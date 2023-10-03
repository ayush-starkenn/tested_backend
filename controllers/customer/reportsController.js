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

exports.getAllreport1 = async (req, res) => {
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

// Date format in 2024-01-01 (YYYY-MM-DD)
// Vehicle UUID in Params

exports.getAllreport2= async (req, res) => {
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

exports.getAllreport1= async(req, res) => {
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

// DAte Formate in timestamp epox
// vehicle UUID in body
exports.getAllreport1 = async (req, res) => {
  const connection = await pool.getConnection();
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

    const [results] = await connection.execute(getQuery, [vehicle_uuid, ...event, fromDateObj, toDateObj]);

    res.status(200).json({
      message: "Successfully got all reports",
      totalCountByEvent: results,
    });
  } catch (err) {
    logger.error(`Error in Get All reports, Error: ${err.message}`);
    res.status(500).json({ message: "An error occurred while getting reports", error: err.message });
  }
};

exports.getreport12 = async (req, res) => {
  try {
    const {
      vehicle_uuid,
      event,
      fromDate,
      toDate,
      fault, // Include fault parameter
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
      SELECT DATE(FROM_UNIXTIME(timestamp)) AS alertDate, event, COUNT(*) AS totalCount
      FROM tripdata
      WHERE vehicle_uuid=? AND event IN (${placeholders}) AND timestamp >= ? AND timestamp <= ?
      GROUP BY alertDate, event
    `;

    const [results] = await pool.execute(getQuery, [
      vehicle_uuid,
      ...event,
      fromDateObj,
      toDateObj,
    ]);

    // The following code handles the merged logic for alert counts by date
    const connection = await pool.getConnection();
    const tripIdsQuery = "SELECT trip_id FROM `tripdata` WHERE vehicle_uuid = ?";
    connection.query(tripIdsQuery, [vehicle_uuid], (err, tripResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Database error", error: err.message });
      }

      const tripIds = tripResults.map((row) => row.trip_id);

      const getAlertsQuery = `
        SELECT DATE(FROM_UNIXTIME(timestamp)) AS alertDate, event, jsondata
        FROM tripdata
        WHERE trip_id IN (?) 
          AND event IN (?) 
          AND timestamp >= ? 
          AND timestamp <= ?`;

      connection.query(getAlertsQuery, [tripIds, event, fromDateObj, toDateObj], (err, alertResults) => {
        if (err) {
          console.error(err);
          connection.release();
          return res.status(500).json({ success: false, message: "Database error", error: err.message });
        }

        const alertCountsByDate = {};

        alertResults.forEach((alert) => {
          const jsonData = JSON.parse(alert.jsondata);
          const alertDate = alert.alertDate;

          if (!alertCountsByDate[alertDate]) {
            alertCountsByDate[alertDate] = {};
          }

          if (fault === "harshAcc" && jsonData.notification === 2) {
            alertCountsByDate[alertDate].harshAcc = (alertCountsByDate[alertDate].harshAcc || 0) + 1;
          } else if (fault === "sleepAlert" && jsonData.notification === 13) {
            alertCountsByDate[alertDate].sleepAlert = (alertCountsByDate[alertDate].sleepAlert || 0) + 1;
          } // Add more conditions for other alert types here
        });

        // Build the desired response format
        const response = {
          title: "Report title",
          from_date: fromDate,
          to_date: toDate,
          vehicles: {},
        };

        Object.keys(alertCountsByDate).forEach((date) => {
          const vehicleData = {
            eventTotalCount: results.find((result) => result.alertDate === date),
            graphicalAnalytics: Object.keys(alertCountsByDate[date]).map((event) => ({
              event: event,
              eventCount: alertCountsByDate[date][event],
            })),
          };
          response.vehicles[`vehicle001`] = [vehicleData]; // Assuming a single vehicle for now
        });

        // Respond with the formatted data
        res.status(200).json(response);

        connection.release();
      });
    });
  } catch (err) {
    console.error(`Error in Get All reports: ${err.message}`);
    res.status(500).json({ success: false, message: "An error occurred while getting reports", error: err.message });
  }
};

exports.getAllreport2 = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { vehicle_uuid, event, fromDate, toDate } = req.body;

    // Validate input parameters
    if (!Array.isArray(event) || !Array.isArray(vehicle_uuid) || !fromDate || !toDate) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    // Convert Unix timestamps to JavaScript Date objects
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);

    // Create arrays of question marks for the IN clauses based on the lengths of the event and vehicle_uuid arrays
    const eventPlaceholders = event.map(() => '?').join(',');
    const vehicleUuidPlaceholders = vehicle_uuid.map(() => '?').join(',');

    const getQuery = `
      SELECT vehicle_uuid, event, COUNT(*) AS totalCount
      FROM tripdata
      WHERE vehicle_uuid IN (${vehicleUuidPlaceholders}) AND event IN (${eventPlaceholders})
        AND created_at >= ? AND created_at <= ?
      GROUP BY vehicle_uuid, event
    `;

    const queryParams = [...vehicle_uuid, ...event, fromDateObj, toDateObj];
    const [results] = await connection.execute(getQuery, queryParams);

    res.status(200).json({
      message: "Successfully got all reports",
      totalCountByEvent: results,
    });
  } catch (err) {
    logger.error(`Error in Get All reports, Error: ${err.message}`);
    res.status(500).json({ message: "An error occurred while getting reports", error: err.message });
  }
};

exports.getAllreport4 = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { vehicle_uuid, event, fromDate, toDate , contact_uuid } = req.body;

    // Validate input parameters
    if (!Array.isArray(event) || !Array.isArray(vehicle_uuid) || !fromDate || !toDate) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    // Convert fromDate and toDate to Date objects and validate
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);

    if (isNaN(fromDateObj) || isNaN(toDateObj)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Ensure fromDate is before toDate
    if (fromDateObj >= toDateObj) {
      return res.status(400).json({ message: "fromDate must be earlier than toDate" });
    }

    // Create arrays of question marks for the IN clauses based on the lengths of the event and vehicle_uuid arrays
    const eventPlaceholders = event.map(() => '?').join(',');
    const vehicleUuidPlaceholders = vehicle_uuid.map(() => '?').join(',');

    const getQuery = `
    SELECT vehicle_uuid, event, contact_uuid, COUNT(*) AS totalCount
    FROM tripdata , contacts
    WHERE vehicle_uuid IN (${vehicleUuidPlaceholders}) AND event IN (${eventPlaceholders})
      AND created_at >= ? AND created_at <= ? AND contact_uuid = ?
    GROUP BY vehicle_uuid, event
  `;
  

    const queryParams = [
      ...vehicle_uuid,
       ...event,
        fromDateObj,
         toDateObj,
         contact_uuid,
        ];
    const [results] = await connection.execute(getQuery, queryParams);

    res.status(200).json({
      message: "Successfully got all reports",
      totalCountByEvent: results,
    });
  } catch (err) {
    logger.error(`Error in Get All reports, Error: ${err.message}`);
    res.status(500).json({ message: "An error occurred while getting reports", error: err.message });
  }
};

exports.getAllreport5 = async (req, res) => {
   const connection = await pool.getConnection();
   try {
    const { title,vehicle_uuid, event, fromDate, toDate, contact_uuid } = req.body;
  
   // Validate input parameters
   if (
   !Array.isArray(event) ||
   !Array.isArray(vehicle_uuid) ||
   !fromDate ||
   !toDate ||
   !title ||
   !Array.isArray(contact_uuid)
   ) {
   return res.status(400).json({ message: "Invalid request parameters" });
   }
  
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
  
   const getQuery = `
   INSERT INTO reports(
   vehicle_uuid, 
   event, 
   contact_uuid, 
   title,
  COUNT(*) AS totalCount
  FROM 
   tripdata, contacts
  WHERE 
 vehicle_uuid IN (${vehicleUuidPlaceholders}) 
  AND event IN (${eventPlaceholders}) 
  AND created_at >= ? 
  AND created_at <= ?
  AND title = ?
   AND contact_uuid IN (${contactPlaceholders})
  GROUP BY 
  vehicle_uuid, event, contact_uuid, title)
  
 `;
  
  const queryParams = [
 ...vehicle_uuid,
  ...event,
   fromDateObj,
  toDateObj,
  title,
   ...contact_uuid,
   ];

   console.log("queryParams");

   const [results] = await connection.execute(getQuery, queryParams);
 
   res.status(200).json({
  message: "Successfully got all reports",
  totalCountByEvent: results,
  });
   } catch (err) {
  logger.error(`Error in Get All reports, Error: ${err.message}`);
 res.status(500).json({
   message: "An error occurred while getting reports",
   error: err.message,
  });
   }
  };

exports.getAllreport7 = async (req, res) => {
      const connection = await pool.getConnection();
      try {
        const { vehicle_uuid, event, fromDate, toDate, contact_uuid } = req.body;
    
        // Validate input parameters
        if (
          !Array.isArray(event) ||
          !Array.isArray(vehicle_uuid) ||
          !fromDate ||
          !toDate ||
          !Array.isArray(contact_uuid)
        ) {
          return res.status(400).json({ message: "Invalid request parameters" });
        }
    
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
    
        const getQuery = `
        SELECT 
        vehicle_uuid, 
        event, 
        contact_uuid, 
        COUNT(*) AS totalCount
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
          ...vehicle_uuid,
          ...event,
          fromDateObj,
          toDateObj,
          ...contact_uuid,
        ];
        const [results] = await connection.execute(getQuery, queryParams);
    
        res.status(200).json({
          message: "Successfully got all reports",
          totalCountByEvent: results,
        });
      } catch (err) {
        logger.error(`Error in Get All reports, Error: ${err.message}`);
        res.status(500).json({
          message: "An error occurred while getting reports",
          error: err.message,
        });
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
  
  