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
 
const { save_notification} = require("../customer/notifiController");
const { sendReportsByEmail } = require("../../middleware/reportsmailer");
const { sendWhatsappMessage } = require("../../middleware/whatsapp");
const { Console } = require("winston/lib/winston/transports");

const app = express();
 
// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// This code optimaztie and updated
exports.scheduleReports = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { title, selected_vehicles, selected_events, contact_uuid, reports_schedule_type } = req.body;
    const { user_uuid } = req.params;

    // Validate input parameters
    if (!title || !Array.isArray(selected_vehicles) || !Array.isArray(selected_events) || !contact_uuid || !user_uuid) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }
    const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    const selectedEventsJson = JSON.stringify(selected_events);
    const selectedvehiclesJson = JSON.stringify(selected_vehicles);
    const newUuid = uuidv4();

    const insertQuery = `
      INSERT INTO reports (title, report_uuid, user_uuid, selected_vehicles, selected_events, contact_uuid, reports_type, report_status, reports_schedule_type, report_created_at, report_created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [title, newUuid, user_uuid, selectedvehiclesJson, selectedEventsJson, contact_uuid, 2, 1, reports_schedule_type, createdAt, user_uuid];

    const [results] = await connection.execute(insertQuery, values);

    if (results.affectedRows > 0) {
      // Schedule an email based on the reports_schedule_type
      if (['daily', 'weekly', 'monthly'].includes(reports_schedule_type)) {
        const getquery = `SELECT contact_email FROM contacts WHERE user_uuid = ? AND contact_uuid = ?`;
        const [contacts] = await connection.execute(getquery, [user_uuid, contact_uuid]);

        if (contacts.length > 0) {
          const emailAddresses = contacts.map((contact) => contact.contact_email);
          const schedule = {
            'daily': '5 0 * * *',
            'weekly': '10 0 * * 1',
            'monthly': '15 0 1 * *'
          }[reports_schedule_type];

          cron.schedule(schedule, () => {
            sendReportsByEmail(title, emailAddresses, newUuid);
            console.log(`Scheduled ${reports_schedule_type} email sent`);
          });
        }
      }

    //await notification(values);
    var NotificationValues = "Report inserted successfully";
    await save_notification(NotificationValues, user_uuid);

      res.status(200).json({
        message: "Report inserted successfully",
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

// This api Update the schedule report And get the Reports 
exports.scheduleupdateReports = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { report_uuid } = req.params;

    let timeAgo;
    let interval;

    // Query the database to retrieve the last report and its schedule type
    const getLastReportQuery = `
      SELECT *
      FROM reports
      WHERE report_uuid = ?`;
    const getLastReportValues = [report_uuid];
    const [lastReport] = await connection.execute(getLastReportQuery, getLastReportValues);

    if (lastReport.length === 0) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    const title = lastReport[0].title;

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

    const timeAgoFormatted = moment().tz("Asia/Kolkata").subtract(timeAgo, interval).format("YYYY-MM-DD HH:mm:ss");

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
      v.vehicle_name,
      v.vehicle_registration,
      td1.trip_id,
      td2.created_at AS event_created_at, 
      td2.event AS event_type,
      SUM(CASE WHEN td1.event = td2.event THEN 1 ELSE 0 END) AS event_count
    FROM reports r
    LEFT JOIN vehicles v ON JSON_CONTAINS(r.selected_vehicles, JSON_ARRAY(v.vehicle_uuid))
    LEFT JOIN trip_summary ts ON v.vehicle_uuid = ts.vehicle_uuid
    LEFT JOIN (
      SELECT event, vehicle_uuid, created_at, trip_id
      FROM tripdata
    ) td2 ON v.vehicle_uuid = td2.vehicle_uuid
    LEFT JOIN tripdata td1 ON ts.trip_id = td1.trip_id 
      AND td1.event = td2.event
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
      AND (JSON_CONTAINS(r.selected_events, JSON_ARRAY(td2.event)))
      AND td2.created_at > ?
    GROUP BY
      r.reports_schedule_type,
      ts.vehicle_uuid,
      v.vehicle_name,
      v.vehicle_registration,
      td1.event,  
      td1.trip_id,
      td2.created_at
    ORDER BY
      r.report_uuid ASC;
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

      const [s_reports] = await connection.execute(getQuery, values);

      await updateschedulereports(s_reports, report_uuid,title,res,timeAgoFormatted);
      
    }
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

async function updateschedulereports(s_reports, report_uuid,title,res,timeAgoFormatted) {
  const connection = await pool.getConnection();

  try {
    if (!Array.isArray(s_reports)) {
      res.status(400).json({ message: "Invalid data: s_reports is not an array" });
      return;
    }

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
          trip_id: row.trip_id,
          eventType: row.event_type,
          eventCount: row.event_count,
          event_created_at: row.event_created_at,
        });
      }
      return result;
    }, {});

    const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    const updateQuery = `
      UPDATE reports 
      SET vehicles = ?,
          report_modified_at = ?
      WHERE report_uuid = ?`;

    const values2 = [
      JSON.stringify(groupedData),
      createdAt,
      report_uuid,
    ];

    const [results] = await connection.execute(updateQuery, values2);

    if (results.affectedRows > 0) {
      const report = {
        title: title,
        report_uuid: report_uuid,
        from_date: timeAgoFormatted, // Assuming timeAgoFormatted is defined in the outer function
        to_date: createdAt,
      };

      const vehicleResults = Object.values(groupedData).map((vehicleData) => {
        const filteredEvents = vehicleData.events.filter((event) => {
          return moment(event.event_created_at).isBetween(report.from_date, report.to_date);
        });

        return {
          vehicle_uuid: vehicleData.vehicle_uuid,
          vehicle_name: vehicleData.vehicle_name,
          vehicle_registration: vehicleData.vehicle_registration,
          tripdata: filteredEvents,
        };
      });

 
      if (res) {
        res.status(200).json({
          message: "Report successfully updated",
          report: report,
          vehicleResults: vehicleResults,
        });
      } else {
        // Handle the case where res is not defined or incorrect
        console.error("Response object (res) is undefined or incorrect.");
      }
    }
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
}


