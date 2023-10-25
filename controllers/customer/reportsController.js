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
 

const { sendEmail } = require("../../middleware/mailer");
const { sendWhatsappMessage } = require("../../middleware/whatsapp");
const { Console } = require("winston/lib/winston/transports");

const app = express();

// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//First Step of selected Vehicles
// This api use to get Vehicles for reports .
exports.getVehicle = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { user_uuid } = req.params;
    const getQuery =
      "SELECT * FROM vehicles WHERE vehicle_status=? AND user_uuid=?";

    [results] = await connection.execute(getQuery, [1, user_uuid]);

    res.status(200).send({
      message: "Successfully got list of all vehicles",
      totalCount: results.length,
      results,
    });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Error in getting user vehicle list", Error: err });
  } finally {
    connection.release();
  }
};

// Selected Vehicles
// This Api user to get All conatcts for  reports .
exports.getAllContacts = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { user_uuid } = req.params;

    const getquery = `SELECT * FROM contacts WHERE contact_status !=0 AND user_uuid = ? ORDER BY contact_created_at DESC`;

    const [contacts] = await connection.execute(getquery, [user_uuid]);

    res.status(200).send({
      message: "Successfully Fetched List Of All Contacts",
      // totalCount: contacts.length,
      contacts,
    });
  } catch (err) {
    logger.error(`Error in getting the list, Error: ${err} `);
    res.status(500).send({
      message: "An error occurred while fetching contacts",
      Error: err,
    });
  } finally {
    connection.release();
  }
};

// This api use only Get The new reports(Testing Purpose)  .
exports.getAllreport = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      title,
      selected_events,
      from_date,
      to_date,
      contact_uuid,
      selected_vehicles,
    } = req.body;
    const { user_uuid } = req.params;

    // Validate input parameters
    if (
      !Array.isArray(selected_events) ||
      !from_date ||
      !to_date ||
      !title ||
      !contact_uuid ||
      !Array.isArray(selected_vehicles) ||
      selected_vehicles.length === 0
    ) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    // Convert fromDate and toDate to Date objects and validate
    const fromDateObj = new Date(from_date);
    const toDateObj = new Date(to_date);

    if (isNaN(fromDateObj) || isNaN(toDateObj)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Ensure fromDate is before toDate
    if (fromDateObj >= toDateObj) {
      return res
        .status(400)
        .json({ message: "fromDate must be earlier than toDate" });
    }

    const eventPlaceholders = selected_events.map(() => "?").join(",");
    const vehiclePlaceholders = selected_vehicles.map(() => "?").join(",");
    // V - Vehicles, td - tripData, ts - trip_summary

    const query = `
    SELECT
    v.vehicle_uuid,
    v.vehicle_name,
    v.vehicle_registration,
    ts.trip_id,
    td.event AS event_type, 
    COUNT(*) AS event_count,
    td.timestamp,
    JSON_UNQUOTE(JSON_EXTRACT(td.jsondata, '$.data.alert_type')) AS alert_type,
    JSON_UNQUOTE(JSON_EXTRACT(td.jsondata, '$.message')) AS message
FROM
    vehicles v 
LEFT JOIN
    trip_summary ts ON v.vehicle_uuid = ts.vehicle_uuid
LEFT JOIN
    tripdata td ON ts.trip_id = td.trip_id
WHERE
    v.user_uuid = ? 
    AND v.vehicle_status = ? 
    AND td.created_at >= ?
    AND td.created_at <= ? 
    AND ts.trip_status = ? 
    AND td.event IN (${eventPlaceholders})
    AND v.vehicle_uuid IN (${vehiclePlaceholders})
GROUP BY
    v.vehicle_uuid,
    v.vehicle_name, 
    v.vehicle_registration,
    td.event  
ORDER BY
    v.vehicle_uuid ASC

`;

    const [vehicles] = await connection.query(query, [
      user_uuid,
      1,
      fromDateObj,
      toDateObj,
      1,
      ...selected_events,
      ...selected_vehicles,
    ]);

    // Group the data by vehicle_uuid
    const groupedData = vehicles.reduce((result, row) => {
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
          // trip_id: row.trip_id,
          eventType: row.event_type,
          eventCount: row.event_count,
        });
      }
      return result;
    }, {});

    // Convert the grouped data object into an array
    const tripData = Object.values(groupedData);

    res.status(200).json({
      success: true,
      message: "Successfully Get Trip Alert's",
      report_title: title,
      from_date: from_date,
      to_date: to_date,
      user_uuid: user_uuid,
      vehicles: tripData,
    });
  } catch (err) {
    logger.error(`Error in Get Trip Alert's: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "An error occurred while  trip data alert's",
      error: err.message,
    });
  } finally {
    connection.release(); // Release the database connection
  }
};

// This api Genrate a Report to the Selected Vehicles .
exports.createAllreport = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      title,
     // selected_events,
      from_date,
      to_date,
      contact_uuid,
      selected_vehicles,
    } = req.body;
    const { user_uuid } = req.params;

    const newUuid = uuidv4();
    const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const selected_events = req.body.selected_events || []; 

    // Validate input parameters
    if (
      !Array.isArray(selected_events) ||
      !from_date ||
      !to_date ||
      !title ||
      !contact_uuid ||
      !Array.isArray(selected_vehicles) ||
      selected_vehicles.length === 0,
      selected_events.length === 0
    ) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    // Convert fromDate and toDate to Date objects and validate
    const fromDateObj = new Date(from_date);
    const toDateObj = new Date(to_date);

    if (isNaN(fromDateObj) || isNaN(toDateObj)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const eventPlaceholders = Array(selected_events.length).fill("?").join(",");
    const vehiclePlaceholders = Array(selected_vehicles.length)
      .fill("?")
      .join(",");

    const getQuery = `
      SELECT
        v.vehicle_uuid,
        v.vehicle_name,
        v.vehicle_registration,
        ts.trip_id,
        td.event AS event_type, 
        COALESCE(COUNT(*), 0) AS event_count,
        td.timestamp,
        JSON_UNQUOTE(JSON_EXTRACT(td.jsondata, '$.data.alert_type')) AS alert_type,
        JSON_UNQUOTE(JSON_EXTRACT(td.jsondata, '$.message')) AS message
      FROM
        vehicles v 
      LEFT JOIN
        trip_summary ts ON v.vehicle_uuid = ts.vehicle_uuid
      LEFT JOIN
        tripdata td ON ts.trip_id = td.trip_id
      WHERE
        v.user_uuid = ? 
        AND v.vehicle_status = ? 
        AND td.created_at BETWEEN ? AND ? 
        AND ts.trip_status = ? 
        AND (td.event IN (${eventPlaceholders}) OR td.event IS NULL) 
        AND v.vehicle_uuid IN (${vehiclePlaceholders})
      GROUP BY
        v.vehicle_uuid,
        v.vehicle_name,
        v.vehicle_registration,
        td.event  
      ORDER BY
        v.vehicle_uuid ASC
    `;

    const [vehicles] = await connection.query(getQuery, [
      user_uuid,
      1,
      fromDateObj,
      toDateObj,
      1,
      ...selected_events,
      ...selected_vehicles,
    ]);
    //console.log(vehicles)
    const groupedData = vehicles.reduce((result, row) => {
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
          eventType: row.event_type || null,
          eventCount: row.event_count || 0,
        });
      }
      return result;
    }, {});

    // Convert the selected_events array to a JSON string
    const selectedEventsJson = JSON.stringify(selected_events);
    const selectedvehiclesJson = JSON.stringify(selected_vehicles);

    const insertQuery = `
      INSERT INTO reports (title, report_uuid, user_uuid, vehicles, selected_vehicles, selected_events, from_date, to_date, contact_uuid, report_status, reports_type, report_created_at, report_created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);
    `;

    const values = [
      title,
      newUuid,
      user_uuid,
      JSON.stringify(groupedData),
      selectedvehiclesJson,
      selectedEventsJson,
      fromDateObj,
      toDateObj,
      contact_uuid,
      1,
      1,
      createdAt,
      user_uuid,
    ];

    const [results] = await connection.execute(insertQuery, values);

    res.status(200).json({
      success: true,
      message: "Report data successfully created",
      report_uuid: newUuid,
      events: selectedEventsJson,
      vehicles: selectedvehiclesJson
    });
  } catch (err) {
    logger.error(`Error in creating report: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the report",
      error: err.message,
    });
  } finally {
    connection.release();
  }
};

// This api Get a report to the genrated .
exports.getReports = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { report_uuid } = req.params;
    const { events } = req.query;

    const [reportResult] = await connection.execute(
      "SELECT * FROM reports WHERE report_uuid = ?",
      [report_uuid]
    );

    if (reportResult.length === 0) {
      return res.status(404).send({ error: "Report not found" });
    }

    const report = reportResult[0];
    const {
      from_date: fromDate,
      to_date: toDate,
      selected_events: reportSelectedEvents,
    } = report;

    const vehiclesData = JSON.parse(report.vehicles);
    const vehicle_uuids = Object.keys(vehiclesData).map(
      (vehicleKey) => vehiclesData[vehicleKey].vehicle_uuid
    );

    const selectedEvents = Array.isArray(reportSelectedEvents)
      ? reportSelectedEvents
      : JSON.parse(reportSelectedEvents);

    const vehicleResults = await Promise.all(
      vehicle_uuids.map(async (vehicle_uuid) => {
        const vehicleData = vehiclesData[vehicle_uuid];
        const tripdataQuery = `
          SELECT trip_id, DATE(created_at) AS date, event, COUNT(*) AS eventCount
          FROM tripdata
          WHERE vehicle_uuid = ?
            AND created_at >= ?
            AND created_at <= ?
            AND event IN (${selectedEvents.map(() => "?").join(",")})
          GROUP BY trip_id, date, event 
        `;

        const [tripdataResult] = await connection.execute(tripdataQuery, [
          vehicle_uuid,
          fromDate,
          toDate,
          ...selectedEvents,
        ]);
        //console.log(tripdataResult);
        return {
          vehicle_uuid,
          vehicle_name: vehicleData.vehicle_name,
          vehicle_registration: vehicleData.vehicle_registration,
          tripdata: tripdataResult,
        };
      })
    );

    res.status(200).send({
      message:
        "Successfully retrieved report and tripdata for multiple vehicles",
      report: {
        ...report,
        selected_events: selectedEvents,
      },
      vehicleResults,
    });
  } catch (err) {
    logger.error("Error in getting report and tripdata:", err);
    res.status(500).send({
      message: "Error in getting report and tripdata",
      Error: err.message,
    });
  } finally {
    connection.release();
  }
};

// Get All Reports
exports.getreportsall = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { user_uuid } = req.params;

    const [reportResult] = await connection.execute(
      "SELECT * FROM reports WHERE user_uuid = ? AND reports_type IN (?,?)  ORDER BY r_id DESC",
      [user_uuid , 1,2]
    );

    res.status(200).send({
      message: "Successfully got list of all Reports",
      totalCount: reportResult.length,
      reportResult,
    });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Error in getting user reports list", Error: err });
  } finally {
    connection.release();
  }
};


