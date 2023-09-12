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

exports.getreport11 = async (req, res) => {
  try {
    const { vehicle_uuid } = req.body;
   //  const {CAS, DMS} = req.body;
    const { event } = req.body;
    const { fromDate, toDate } = req.body;

    // Create an array of question marks for the IN clause based on the length of the event array
    const placeholders = event.map(() => '?').join(',');

    const getQuery = `
      SELECT event, COUNT(*) AS totalCount
      FROM tripdata
      WHERE vehicle_uuid=? AND event IN (${placeholders})
        AND timestamp >= ? AND timestamp <= ?
      GROUP BY event
    `;

    const [results] = await pool.execute(getQuery, [vehicle_uuid, ...event, fromDate, toDate]);

    res.status(200).json({
      message: "Successfully got all reports",
      totalCountByEvent: results,
    });
  } catch (err) {
    logger.error(`Error in Get All reports, Error: ${err.message}`);
    res.status(500).json({ message: "An error occurred while getting reports", error: err.message });
  }
};

exports.getCASreport = async (req, res) => {
  try {
    const { vehicle_uuid } = req.params;
   //  const {CAS, DMS} = req.body;
    const { event } = req.body;
    const { fromDate, toDate } = req.body;

    // Create an array of question marks for the IN clause based on the length of the event array
    const placeholders = event.map(() => '?').join(',');

    const getQuery = `
      SELECT event, COUNT(*) AS totalCount
      FROM tripdata
      WHERE vehicle_uuid=? AND event IN (${placeholders})
        AND created_at >= ? AND created_at <= ?
      GROUP BY event
    `;

    const [results] = await pool.execute(getQuery, [vehicle_uuid, ...event, fromDate, toDate]);

    res.status(200).json({
      message: "Successfully got all reports",
      totalCountByEvent: results,
    });
  } catch (err) {
    logger.error(`Error in Get All reports, Error: ${err.message}`);
    res.status(500).json({ message: "An error occurred while getting reports", error: err.message });
  }
};

exports.getDMSreport = async (req, res) => {
  try {
    const { vehicle_uuid } = req.params;
   //  const {CAS, DMS} = req.body;
    const { event } = req.body;
     
    const { fromDate, toDate } = req.body;

    // Create an array of question marks for the IN clause based on the length of the event array
    const placeholders = event.map(() => '?').join(',');

    const getQuery = `
      SELECT event, COUNT(*) AS totalCount
      FROM tripdata
      WHERE vehicle_uuid=? AND event IN (${placeholders})
        AND created_at >= ? AND created_at <= ?
      GROUP BY event
    `;

    const [results] = await pool.execute(getQuery, [vehicle_uuid, ...event, fromDate, toDate]);

    res.status(200).json({
      message: "Successfully got all reports",
      totalCountByEvent: results,
    });
  } catch (err) {
    logger.error(`Error in Get All reports, Error: ${err.message}`);
    res.status(500).json({ message: "An error occurred while getting reports", error: err.message });
  }
};

exports.getAllreport = async (req, res) => {
  try {
    const { vehicle_uuid } = req.params;
   //  const {CAS, DMS} = req.body;
    const { event } = req.body;
    const { fromDate, toDate } = req.body;

    // Create an array of question marks for the IN clause based on the length of the event array
    const placeholders = event.map(() => '?').join(',');

    const getQuery = `
      SELECT event, COUNT(*) AS totalCount
      FROM tripdata
      WHERE vehicle_uuid=? AND event IN (${placeholders})
        AND created_at >= ? AND created_at <= ?
      GROUP BY event
    `;

    const [results] = await pool.execute(getQuery, [vehicle_uuid, ...event, fromDate, toDate]);

    res.status(200).json({
      message: "Successfully got all reports",
      totalCountByEvent: results,
    });
  } catch (err) {
    console.error(`Error in Get All reports, Error: ${err.message}`);
    res.status(500).json({ message: "An error occurred while getting reports", error: err.message });
  }
};

exports.getreports = async(req, res) => {
  try {
    const { vehicle_uuid } = req.params;
    const {event }= req.body;
    const { fromDate, toDate } = req.body;

    // console.log("start:", startDate, "end:", endDate);
    let q =
      "SELECT  vehicle_uuid FROM tripdata WHERE vehicle_uuid = ?";
    pool.query(q, [vehicle_uuid], (err, result) => {
      if (err)  {
        pool.end(); // Close the database connection on error
        return res.status(500).json({ error: 'Database error' });
      }

      let dataAr = result.map((row) => row.vehicle_uuid);
      // console.log(dataAr);

      let getTripQuery = `SELECT * FROM tripdata WHERE vehicle_uuid IN (?) AND event IN (?) AND created_at >= ${fromDate} AND created_at <= ${toDate}`;
      pool.query(getTripQuery, [dataAr, "DMS"], (err, results) => {
        connection.end(); // Close the database connection

        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

       
        let drowsiness = 0;
        let distraction = 0;

          if (item.event == "DMS") {
            let dmsData = JSON.parse(item.jsondata);
            if (dmsData.data.alert_type == "DROWSINESS") {
              drowsiness = drowsiness + 1;
            }
            // if(dmsData.data.alert_type == "TRIP_START") {
            //   drowsiness = drowsiness +1;
            // }
            if (dmsData.data.alert_type == "DISTRACTION") {
              distraction = distraction + 1;
            }
           
          }
        });

      
        if (event == "Drowsiness") {
          return res.send({ count: drowsiness });
        }
        if (event == "Distraction") {
          return res.send({ count: distraction });
        }
      
      });
    
  } catch (error) {
    console.log(error);
  }
}

exports.getreport = async (req, res) => {
  try {
    const { vehicle_uuid, event, fromDate, toDate } = req.body;

    // Validate input parameters
    if (!Array.isArray(event) || !fromDate || !toDate) {
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
      WHERE vehicle_uuid=? AND event IN (${placeholders})
        AND timestamp >= ? AND timestamp <= ?
      GROUP BY event
    `;

    const [results] = await pool.execute(getQuery, [vehicle_uuid, ...event, fromDateObj, toDateObj]);

    res.status(200).json({
      message: "Successfully got all reports",
      totalCountByEvent: results,
    });
  } catch (err) {
    logger.error(`Error in Get All reports, Error: ${err.message}`);
    res.status(500).json({ message: "An error occurred while getting reports", error: err.message });
  }
};
