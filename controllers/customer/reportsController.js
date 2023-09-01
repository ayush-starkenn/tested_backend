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

exports.getDriver = async (req, res) => {

    const connection = await pool.getConnection();
    try { 
   const { user_uuid } = req.params;
     const getQuery =
       "SELECT * FROM drivers WHERE user_uuid=? AND driver_status=? ORDER BY driver_created_at DESC";
 
     const [results] = await connection.execute(getQuery, [user_uuid, 1]);
 
     res.status(200).send({
       message: "Successfully got all drivers list",
       totalCount: results.length,
       results,
     });
   } catch (err) {
     logger.error(`Error in getting data, Error: ${err} `);
     res.status(500).send({ message: "Error in data", Error: err });
   } finally {
     connection.release();
 }
};

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

exports.getReports = async (req, res) => {

    try {
        const { fromDate, toDate, selectedId, selectedType } = req.query;
        
        let summary = {
          title: 'Vehicle/Driver Report',
          dateRange: {
            fromDate,
            toDate
          }
        };
    
        if (selectedType === 'vehicle') {
          const [vehicleRow] = await db.query('SELECT name FROM vehicles WHERE id = ?', [selectedId]);
          summary.selectedVehicle = vehicleRow[0].name;
        } else if (selectedType === 'driver') {
          const [driverRow] = await db.query('SELECT name FROM drivers WHERE id = ?', [selectedId]);
          summary.selectedDriver = driverRow[0].name;
        }
    
        res.json(summary);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate report summary' });
      }
    }

exports.generateReport = async (req, res) => {
    try {
      const { fromDate, toDate, vehicleName } = req.body;
  
      // Construct the query based on the provided parameters
      let query = `
        SELECT COUNT(*) AS totalVehiclesDrivers
        FROM drivers
        WHERE date BETWEEN ? AND ?
      `;
      let queryParams = [fromDate, toDate];
  
      if (vehicleName) {
        query += ' AND vehicleParams_CAS = ?';
        queryParams.push(vehicleName);
      }
  
      if (vehicleName) {
        query += ' AND vehicleParams_DMS = ?';
        queryParams.push(vehicleName);
      }
  
      const [rows] = await db.query(query, queryParams);
  
      // Prepare the report summary object
      let reportSummary = {
        title: 'Vehicle/Driver Report',
        dateRange: {
          fromDate,
          toDate
        },
        totalVehiclesDrivers: rows[0].totalVehiclesDrivers
      };
  
      if (vehicleName && !driverName) {
        reportSummary.selectedVehicle = vehicleName;
      }
  
      if (!vehicleName && vehicleName) {
        reportSummary.selectedDriver = vehicleName;
      }
  
      res.status(200).json({ reportSummary });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  };
  