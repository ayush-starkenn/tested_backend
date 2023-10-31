const pool = require("../../config/db");
const logger = require("../../logger");
const express = require("express");
const moment = require("moment-timezone");
const bodyParser = require("body-parser");

const app = express();

// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { sendEmail } = require("../../middleware/mailer");
const { save_notification} = require("../customer/notifiController");
//const { sendWhatsappMessage } = require("../../middleware/whatsapp");

exports.getOngoingTripData = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { user_uuid } = req.params;

    const [getOnTrip] = await pool.query(
      "SELECT ts.trip_id, ts.vehicle_uuid, ts.trip_start_time, v.vehicle_name FROM trip_summary ts INNER JOIN vehicles v ON ts.vehicle_uuid = v.vehicle_uuid WHERE ts.user_uuid = ? AND ts.trip_status = ? ORDER BY ts.trip_start_time DESC",
      [user_uuid, 0]
    );

    if (getOnTrip.length > 0) {
      res.status(200).json({
        message: "Data fetched successfully!",
        result: getOnTrip,
      });
    } else {
      res.status(200).json({
        message: "Ongoing trip data not found!",
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Something went wrong!", error: error });
  } finally {
    connection.release();
  }
};

exports.getalertbyId = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { user_uuid } = req.params;

    // Query vehicles to get vehicle_name and vehicle_uuid
    const [vehicles] = await connection.query(
      "SELECT v.vehicle_uuid, v.vehicle_name, ts.trip_id, ts.trip_start_time, td.event, td.timestamp " +
        "FROM vehicles v " +
        "LEFT JOIN trip_summary ts ON v.vehicle_uuid = ts.vehicle_uuid " +
        "LEFT JOIN tripdata td ON ts.trip_id = td.trip_id " +
        "WHERE v.user_uuid = ? AND v.vehicle_status = ? AND ts.trip_status = ? AND td.event IN (?, ?, ?) " +
        "ORDER BY td.timestamp ASC",
      [user_uuid, 1, 1, "ACC", "LMP", "ACD"]
    );

    // Group the data by vehicle_uuid
    const groupedData = vehicles.reduce((result, row) => {
      const key = row.vehicle_uuid;
      if (!result[key]) {
        result[key] = {
          vehicle_uuid: key,
          vehicle_name: row.vehicle_name,
          trip_start_time: row.trip_start_time,
          trip_data: [],
        };
      }
      if (row.trip_id) {
        result[key].trip_data.push({
          trip_id: row.trip_id,
          event: row.event,
          timestamp: row.timestamp,
        });
      }
      return result;
    }, {});

    // Convert the grouped data object into an array
    const tripData = Object.values(groupedData);

    res.status(200).json({
      success: true,
      message: "Successfully retrieved trip data",
      data: { trip_data: tripData },
    });
  } catch (err) {
    console.error(`Error in Get Trip Data: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving trip data",
      error: err.message,
    });
  } finally {
    connection.release(); // Release the database connection
  }
};

// Alert logs for dashboard
exports.getalert = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { user_uuid } = req.params;

    // V - Vehicles, td - tripData, ts - trip_summary

    const query = `
    SELECT
    v.vehicle_uuid,
    v.vehicle_name,
    v.vehicle_registration,
    ts.trip_id,
    ts.trip_start_time,
    td.event,
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
    AND ts.trip_status = ? 
    AND td.event IN (?,?,?)
ORDER BY
    td.timestamp DESC`;

    // const [vehicles] = await connection.query(query, [
    //   user_uuid,
    //   1,
    //   1,
    //   "DMS",
    //   "LMP",
    //   "ACD",
    //   "ACC",
    // ]);
    const params = [user_uuid, 1, 1, "LMP", "ACD", "ACC"];

    const [results] = await pool.query(query, params);

    // Group the data by vehicle_uuid
    // const groupedData = vehicles.reduce((result, row) => {
    //   const key = row.vehicle_uuid;
    //   if (!result[key]) {
    //     result[key] = {
    //       vehicle_uuid: key,
    //       vehicle_name: row.vehicle_name,
    //       trip_start_time: row.trip_start_time,
    //       trip_data: [],
    //     };
    //   }
    //   if (row.trip_id) {
    //     result[key].trip_data.push({
    //       trip_id: row.trip_id,
    //       event: row.event,
    //       message: row.message,
    //       timestamp: row.timestamp,
    //       alert_type: row.alert_type, // Extracted alert_type from jsondata
    //     });
    //   }
    //   return result;
    // }, {});

    // // Convert the grouped data object into an array
    // const tripData = Object.values(groupedData);

    res.status(200).json({
      success: true,
      message: "Successfully Get Trip Alert's",
      trip_data: results,
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

exports.getvehicleLogs = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { user_uuid } = req.params;
    const vehicle_status = 1;
    const trip_status = 1;
    const eventList = ["ACP", "LMP", "ACD", "DMS"];
    const alertTypeMapping = {
      Drowsiness: 1,
      Distraction: 2,
      "No Driver": 3,
    };

    const query = `
    SELECT
    v.vehicle_uuid,
    v.vehicle_name,
    ts.trip_id,
    ts.trip_start_time,
    td.event,
    td.timestamp,
    JSON_UNQUOTE(JSON_EXTRACT(td.jsondata, '$.data.alert_type')) AS alert_type
FROM
    vehicles v
LEFT JOIN
    trip_summary ts ON v.vehicle_uuid = ts.vehicle_uuid
LEFT JOIN
    tripdata td ON ts.trip_id = td.trip_id
WHERE
    v.user_uuid = ?
    AND v.vehicle_status = ?
    AND ts.trip_status = ?
    AND td.event IN (?, ?, ?, ?)
    AND JSON_UNQUOTE(JSON_EXTRACT(td.jsondata, '$.data.alert_type')) IN (?, ?, ?)
ORDER BY
    td.timestamp ASC;

`;

    const params = [
      user_uuid,
      vehicle_status,
      trip_status,
      ...eventList,
      ...Object.values(alertTypeMapping), // Use values from the mapping object
    ];
    //console.log(params);
    const [vehicles] = await connection.query(query, params);

    // Filter the data based on alert_type
    const filteredData = vehicles.filter((row) =>
      Object.values(alertTypeMapping).includes(row.alert_type)
    );

    // Group the data by vehicle_uuid
    const groupedData = filteredData.reduce((result, row) => {
      const key = row.vehicle_uuid;
      if (!result[key]) {
        result[key] = {
          vehicle_uuid: key,
          vehicle_name: row.vehicle_name,
          trip_start_time: row.trip_start_time,
          trip_data: [],
        };
      }
      if (row.trip_id) {
        result[key].trip_data.push({
          trip_id: row.trip_id,
          event: row.event,
          timestamp: row.timestamp,
          alert_type: row.alert_type, // Extracted alert_type from jsondata
          alert_type_name: Object.keys(alertTypeMapping).find(
            (key) => alertTypeMapping[key] === row.alert_type
          ), // Find the alert type name based on the value
        });
      }
      return result;
    }, {});

    // Convert the grouped data object into an array
    const tripData = Object.values(groupedData);

    res.status(200).json({
      success: true,
      message: "Successfully retrieved trip data",
      data: { trip_data: tripData },
    });
  } catch (err) {
    console.error(`Error in Get Trip Data: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving trip data",
      error: err.message,
    });
  } finally {
    connection.release(); // Release the database connection
  }
};

exports.getOngoingLOC = async (req, res) => {
  try {
    const { user_uuid } = req.params;
  //  const {vehicle_uuid} = req.decoded;
    const event = "LOC";
    const trip_status = 0;

    const query = 
    `SELECT
    ts.trip_status,
    td.event, 
    td.timestamp, 
    td.lat, 
    td.lng, 
    td.spd,
    td.timestamp,
    v.vehicle_uuid, 
    v.vehicle_name, 
    v.vehicle_registration, 
    ts.trip_id 
FROM 
    vehicles v
LEFT JOIN
    trip_summary ts ON v.vehicle_uuid = ts.vehicle_uuid
LEFT JOIN
    tripdata AS td ON ts.trip_id = td.trip_id
WHERE 
ts.trip_status = ? 
AND td.event = ? 
AND ts.user_uuid = ? 
AND td.timestamp = (
    SELECT MAX(timestamp)
    FROM tripdata
    WHERE trip_id = ts.trip_id
)
ORDER BY 
     td.timestamp DESC;`;

    const params = [trip_status, event, user_uuid, ];
    const [results] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      message: "Successfully retrieved location of latest Vehicle trip data ",
      Trip_data: results,
    });
  } catch (err) {
    logger.error(`Error in Get Trip Data: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving trip data",
      error: err.message,
    });
  }
};
