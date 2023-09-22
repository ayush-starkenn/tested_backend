const pool = require("../../config/db");
const logger = require("../../logger");
const express = require("express");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");

const { sendEmail } = require("../../middleware/mailer");
const { sendWhatsappMessage } = require("../../middleware/whatsapp");

const app = express();

// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

exports.getreport = async (req, res) => {
  try {
    const {
     // title,
      vehicle_uuid,
      event,
      fromDate,
      toDate,
     // device_type,
      //recipients,
     // userUUID,
    } = req.body;

    // Validate input parameters
    if (!Array.isArray(event) || !fromDate || !toDate || fromDate > toDate) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    // Convert Unix timestamps to JavaScript Date objects
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);

    // Create an array of question marks for the IN clause based on the length of the event array
    const placeholders = event.map(() => '?').join(',');

    const getQuery = `
      SELECT event, COUNT(*) AS totalCount
      FROM tripdata
      WHERE vehicle_uuid=? AND event IN (${placeholders}) AND timestamp >= ? AND timestamp <= ?
      GROUP BY event
    `;

    const [results] = await pool.execute(getQuery, [
      vehicle_uuid,
      ...event,
      fromDateObj,
      toDateObj,
    ]);

    res.status(200).json({
      success: true,
      message: "Successfully got all reports",
      data: { totalCountByEvent: results },
    });
  } catch (err) {
    console.error(`Error in Get All reports: ${err.message}`);
    res.status(500).json({ success: false, message: "An error occurred while getting reports", error: err.message });
  }
};

exports.getreport1 = async (req, res) => {
  try {
    const {
      vehicle_uuid,
      event,
      fromDate,
      toDate,
      // fault, // Include fault parameter
    } = req.body;

    // Validate input parameters
    if (!Array.isArray(vehicle_uuid) || !Array.isArray(event) || !fromDate || !toDate || fromDate > toDate) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    // Convert Unix timestamps to JavaScript Date objects
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);

    // Create an array of question marks for the IN clause based on the length of the event array
    const placeholders = event.map(() => '?').join(',');
    const vehicleUuidPlaceholders = vehicle_uuid.map(() => '?').join(',');

    const getQuery = `
    SELECT DATE(FROM_UNIXTIME(timestamp)) AS alertDate, vehicle_uuid, event, COUNT(*) AS totalCount
    FROM tripdata
    WHERE vehicle_uuid IN (${vehicleUuidPlaceholders}) AND event IN (${placeholders}) AND timestamp >= ? AND timestamp <= ?
    GROUP BY alertDate, vehicle_uuid, event
  `;

    const [results] = await pool.execute(getQuery, [
      ...vehicle_uuid,
      ...event,
      fromDateObj,
      toDateObj,
    ]);

    // The following code handles the merged logic for total counts by date
    const totalCountsByDate = {};

    results.forEach((result) => {
      const alertDate = result.alertDate;

      if (!totalCountsByDate[alertDate]) {
        totalCountsByDate[alertDate] = {};
      }

      if (!totalCountsByDate[alertDate][result.event]) {
        totalCountsByDate[alertDate][result.event] = 0;
      }

      totalCountsByDate[alertDate][result.event] += result.totalCount;
    });

    // Build the desired response format
    const response = {
      title: "Report title",
      from_date: fromDate,
      to_date: toDate,
      vehicles: {},
    };

    results.forEach((result) => {
      const date = result.alertDate;
      const vehicleUuid = result.vehicle_uuid;
      const eventCount = result.totalCount;

      // Find or create the vehicle entry in the response
      if (!response.vehicles[vehicleUuid]) {
        response.vehicles[vehicleUuid] = {
          //vehicle_uuid: vehicleUuid,
          event_data: [],
        };
      }

      const vehicleData = response.vehicles[vehicleUuid];

      // Find or create the date entry for the vehicle
      let dateEntry = vehicleData.event_data.find((entry) => entry.date === date);

      if (!dateEntry) {
        dateEntry = {
          date: date,
          events: [],
        };
        vehicleData.event_data.push(dateEntry);
      }

      // Add the event count to the date entry
      dateEntry.events.push({
        event: result.event,
        eventCount: eventCount,
      });
    });

    // Respond with the formatted data
    res.status(200).json(response);
  } catch (err) {
    console.error(`Error in Get All reports: ${err.message}`);
    res.status(500).json({ success: false, message: "An error occurred while getting reports", error: err.message });
  }
};


