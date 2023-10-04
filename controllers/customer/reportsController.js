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

exports.getAllreport = async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const {title, vehicle_uuid, event, fromDate, toDate, contact_uuid } = req.body;
      const {user_uuid} =req.params;

      // Validate input parameters
      if (
        !title ||
        !user_uuid ||
        !Array.isArray(event) ||
        !Array.isArray(vehicle_uuid) ||
        !fromDate ||
        !toDate ||
        !Array.isArray(contact_uuid) 
      ) {
        return res.status(400).json({ message: "Invalid request parameters" });
      }
      const newUuid = uuidv4();
      let createdAt = new Date();
      let currentTimeIST = moment
        .tz(createdAt, "Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss ");

      // Convert fromDate and toDate to Date objects and validate
      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);
  
      if (isNaN(fromDateObj) || isNaN(toDateObj)) {
        return res.status(400).json({ message: "Invalid date format" });
      }
  
      // Ensure fromDate is before toDate
      if (fromDateObj >= toDateObj) {
        return res
          .status(400)
          .json({ message: "fromDate must be earlier than toDate" });
      }
  
      // Create arrays of question marks for the IN clauses based on the lengths of the event and vehicle_uuid arrays
      const eventPlaceholders = event.map(() => "?").join(",");
      const contactPlaceholders = contact_uuid.map(() => "?").join(",");
      const vehicleUuidPlaceholders = vehicle_uuid.map(() => "?").join(",");
  
      // Construct the SQL query to retrieve and insert data
      const getQuery = `
      INSERT INTO reports (title, user_uuid, reports_uuid, vehicle_uuid, event, from_date, to_date, contact_uuid, totalCount, report_status, report_created_at, report_created_by)
      SELECT
        ? AS title,
        ? AS user_uuid,
        ? AS reports_uuid,
        vehicle_uuid,
        event,
        ? AS from_date,
        ? AS to_date,
        contact_uuid,
        COUNT(*) AS totalCount,
        ? AS report_status,
        ? AS report_created_at,
        ? AS report_created_by
      FROM
        tripdata, contacts
      WHERE
        vehicle_uuid IN (${vehicleUuidPlaceholders})
        AND event IN (${eventPlaceholders})
        AND created_at >= ?
        AND created_at <= ?
        AND contact_uuid IN (${contactPlaceholders})
      GROUP BY
        vehicle_uuid, event, contact_uuid
    `;
    
    const queryParams = [
      title,
      user_uuid,
      newUuid,
      fromDateObj,
      toDateObj,
      parseInt(1),
      currentTimeIST,
      user_uuid,
      ...vehicle_uuid,
      ...event,
      fromDateObj,
      toDateObj,
      ...contact_uuid,
    ];
  
      // Execute the SQL query to insert data
      const [result] = await connection.execute(getQuery, queryParams);
  
      res.status(200).json({
        message: `Successfully inserted ${result.affectedRows} row(s) into the reports table.`, result,
      });
    } catch (err) {
      logger.error(`Error in Get All reports, Error: ${err.message}`);
      res.status(500).json({
        message: "An error occurred while getting and saving reports",
        error: err.message,
      });
    } finally {
      connection.release(); // Always release the connection when done
    }
};
  
