const pool = require("../../config/db");
const logger = require("../../logger");
const express = require("express");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const cron = require("node-cron");
require("dotenv").config();
//const { createAndScheduleReport } = require('../path-to-createAndScheduleReport');
 

const { sendReportsByEmail } = require("../../middleware/reportsmailer");
const { sendWhatsappMessage } = require("../../middleware/whatsapp");
const { Console } = require("winston/lib/winston/transports");

const app = express();
 
// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Insert The Data For Schedule Report
exports.scheduleReports = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { title, selected_vehicles, selected_events, contact_uuid ,reports_schedule_type} = req.body;
    const { user_uuid } = req.params;

    // Validate input parameters
    if (!title ||
      !Array.isArray(selected_vehicles)  || 
       !Array.isArray(selected_events)||
        !contact_uuid || 
        !user_uuid 
        ) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }
    
    const selectedEventsJson = JSON.stringify(selected_events);
    const selectedvehiclesJson = JSON.stringify(selected_vehicles);
    // const selectedEventsJson = Array(selected_events.length).fill("?").join(",");
    // const selectedvehiclesJson = Array(selected_vehicles.length).fill("?").join(",");


    const newUuid = uuidv4();

    const insertQuery = `
      INSERT INTO reports (title, report_uuid, user_uuid, selected_vehicles, selected_events, contact_uuid, reports_type, reports_schedule_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [
      title,
       newUuid, 
       user_uuid,
        selectedvehiclesJson,
         selectedEventsJson, 
         contact_uuid,
          2,
           reports_schedule_type
          ];

    const [results] = await connection.execute(insertQuery, values);
    //connection.release();
   // console.log(results);
    if (results.affectedRows > 0) {
      // Schedule an email to be sent every day at 12:05 AM
      cron.schedule('41 11 * * *', () => { // Changed the cron schedule to 12:05 AM
        try {
          // Send your reports by email here
          sendReportsByEmail(title, selected_vehicles, selected_events,reports_schedule_type, newUuid);
          console.log("Scheduled email sent ");
        } catch (error) {
          logger.error(`Error in scheduled email: ${error.message}`);
        }
      });
      res.status(200).json({ 
        message: "Report inserted successfully" ,
        report_uuid: newUuid,
        selectedvehiclesJson,
        selectedEventsJson,
        reports_schedule_type
      });
    } else {
      res.status(400).json({ message: "Report insertion failed" });
    }
  } catch (error) {
    logger.error(`Error in scheduleReports: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

exports.scheduleupdateReports = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { report_uuid } = req.params;

    //let lastReport;
    let timeAgo;
    let interval;

    // Query the database to retrieve the last report and its schedule type
    const getLastReportQuery = `
      SELECT *
      FROM reports
      WHERE report_uuid = ?`;
    const getLastReportValues = [report_uuid];
    const [lastReport] = await connection.execute(getLastReportQuery, getLastReportValues);
   // console.log('lastReport:', lastReport);
    if (lastReport.length !== 1) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    // Extract the schedule type from the database
    const reports_schedule_type = (lastReport[0] && lastReport[0].reports_schedule_type) || '';

    // Determine the time interval based on the retrieved schedule type
    if (reports_schedule_type === 'daily') {
      timeAgo = 1; // 1 day
      interval = 'day';
    } else if (reports_schedule_type === 'weekly') {
      timeAgo = 1; // 1 week
      interval = 'week';
    } else if (reports_schedule_type === 'monthly') {
      timeAgo = 1; // 1 month
      interval = 'month';
    } else {
      res.status(400).json({ message: "Invalid report_schedule_type" });
      return;
    }

    const timeAgoFormatted = moment()
      .tz("Asia/Kolkata")
      .subtract(timeAgo, interval)
      .format("YYYY-MM-DD HH:mm:ss");
    

//console.log(lastReport);
    if (lastReport.length === 0) {
      res.status(404).json({ message: "Report not found" });
    } else {
      let eventPlaceholders;
      let vehiclePlaceholders;
      if (lastReport[0]) {
        try {
          // Check if the fields are defined and not empty
          if (lastReport[0].selected_events && lastReport[0].selected_events.trim() !== '') {
            eventPlaceholders = JSON.parse(lastReport[0].selected_events);
          }
          if (lastReport[0].selected_vehicles && lastReport[0].selected_vehicles.trim() !== '') {
            vehiclePlaceholders = JSON.parse(lastReport[0].selected_vehicles);
          }
        } catch (error) {
          logger.error(`Error parsing JSON: ${error.message}`);
          res.status(500).json({ message: "Error parsing JSON" });
          return;
        }
      } else {
        res.status(404).json({ message: "Report not found" });
        return;
      }

      const user = lastReport[0].user_uuid;

      const getQuery = `
        SELECT 
          ts.vehicle_uuid,
          r.report_uuid,
          r.reports_schedule_type,
          r.selected_vehicles,
          r.selected_events,
          v.vehicle_uuid,
          v.vehicle_name,
          v.vehicle_registration,
          td2.trip_id,
          td1.created_at,
          td2.event AS event_type,
          COALESCE(COUNT(*), 0) AS event_count
        FROM 
          reports r
        LEFT JOIN
          vehicles v ON JSON_CONTAINS(r.selected_vehicles, JSON_ARRAY(v.vehicle_uuid))
        LEFT JOIN
          trip_summary ts ON v.vehicle_uuid = ts.vehicle_uuid
        LEFT JOIN
          tripdata td1 ON ts.trip_id = td1.trip_id 
        LEFT JOIN 
          tripdata td2 ON JSON_CONTAINS(r.selected_events, JSON_ARRAY(td2.event))
        WHERE
          r.report_uuid = ?
          AND r.reports_schedule_type = ?
          AND v.user_uuid = ?
          AND v.vehicle_status = ?
          AND ts.trip_status = ? 
          AND (td1.event IN (${Array(eventPlaceholders.length).fill('?').join(', ')})
          OR td1.event IS NULL)
          AND (td2.vehicle_uuid IN (${Array(vehiclePlaceholders.length).fill('?').join(', ')})
          OR td2.vehicle_uuid IS NULL)
          AND td1.created_at >= ?
        GROUP BY
          r.reports_schedule_type,
          v.vehicle_uuid,
          v.vehicle_name,
          v.vehicle_registration,
          td2.event  
        ORDER BY
          r.report_uuid ASC
      `;

      const placeholders = [...eventPlaceholders, ...vehiclePlaceholders];
      const values = [
        report_uuid,
        reports_schedule_type,
        user,
        1,
        1,
        ...placeholders,
        timeAgoFormatted,
      ];
     // console.log(values);
      const [s_reports] = await connection.execute(getQuery, values);
      //console.log(s_reports)
      const groupedData = s_reports.reduce((result, row) => {
        const key = row.vehicle_uuid;
        if (!result[key]) {
          result[key] = {
            vehicle_uuid: key,
            vehicle_name: row.vehicle_name,
            vehicle_registration: row.vehicle_registration,
            events: [],
          };
        }
        if (row.trip_id) {
          result[key].events.push({
            eventType: row.event_type ,
            eventCount: row.event_count 
          });
        }
        return result;
      }, {});

      const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
      const updateQuery = `
        UPDATE reports 
        SET vehicles = ?,
            report_created_at = ?
        WHERE report_uuid = ?`;

      const values2 = [
        JSON.stringify(groupedData),
        createdAt,
        report_uuid,
      ];

      const [results] = await connection.execute(updateQuery, values2);
          // Send your reports by email here
          sendReportsByEmail(groupedData);
          console.log("Scheduled email sent");
       
      if (results.affectedRows > 0) {
        res.status(200).json({
          success: true,
          message: "Report successfully updated",
          report_uuid: report_uuid,
        });
      } else {
        res.status(404).json({ message: "No reports were updated" });
      }
    }
  } catch (error) {
    logger.error(`Error : ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};



