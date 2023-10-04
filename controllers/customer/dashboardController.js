const pool = require("../../config/db");
const logger = require("../../logger");
const express = require("express");
const moment = require("moment-timezone");
const bodyParser = require("body-parser");

const app = express();

// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


exports.getongoingTripDashboard = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { user_uuid } = req.params;
  
    // Query vehicles to get vehicle_name and vehicle_uuid
    const [vehicles] = await connection.query(
      "SELECT vehicle_name, vehicle_uuid FROM vehicles WHERE user_uuid = ? AND vehicle_status = ?",
      [user_uuid, 1]
    );

    // Use Promise.all to parallelize queries
    const tripDataPromises = vehicles.map(async (vehicle) => {
      const { vehicle_name, vehicle_uuid } = vehicle;

      // Query trip_summary based on vehicle_uuid
      const [tripSum] = await connection.query(
        "SELECT trip_start_time, trip_id FROM trip_summary WHERE user_uuid = ? AND vehicle_uuid = ? AND trip_status = ?",
        [user_uuid, vehicle_uuid, 0]
      );

      // Extract trip IDs from trip_summary
      const tripIDs = tripSum.map((tripRow) => tripRow.trip_id);

      // Skip this vehicle if it has no trips
      if (tripIDs.length === 0) {
        return [];
      }

      // Query tripdata based on trip IDs
      const getQuery = `
        SELECT trip_id, vehicle_uuid
        FROM trip_summary
        WHERE trip_id IN (${tripIDs.map(() => '?').join(',')})
          AND trip_status = ?
        ORDER BY trip_start_time ASC
      `;

      const [analyticData] = await connection.query(getQuery, [...tripIDs, 0]);

      // Map and add vehicle_name and trip_start_time to each object
      return analyticData.map((data) => ({
        ...data,
        vehicle_name,
        trip_start_time: tripSum.find((trip) => trip.trip_id === data.trip_id).trip_start_time,
      }));
    });

    // Use Promise.all to await all promises in parallel
    const allData = await Promise.all(tripDataPromises);

    // Flatten and filter out empty arrays (vehicles with no trips)
    const flattenedData = allData.flat();

    res.status(200).json({
      success: true,
      message: "Successfully retrieved trip data",
      data: { trip_data: flattenedData },
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
  
exports.getalert = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { user_uuid } = req.params;

// V - Vehicles, td - tripData, ts - trip_summary

    const query = `
    SELECT
    v.vehicle_uuid,
    v.vehicle_name,
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
    AND td.event IN (?,?,?,?)
ORDER BY
    td.timestamp ASC`

    const [vehicles] = await connection.query(query, [user_uuid, 1, 1,"DMS","LMP","ACD","ACC"]);

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
          message: row.message,
         timestamp: row.timestamp,
          alert_type: row.alert_type, // Extracted alert_type from jsondata
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
    logger.error(`Error in Get Trip Data: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving trip data",
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
console.log(params);
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
    const vehicle_status = 1;
    const trip_status = 0;

    const query = `
    SELECT
      v.vehicle_uuid,
      v.vehicle_name,
      ts.trip_id,
      ts.trip_start_time,
      td.event,
      td.lat,
      td.lng,
      MAX(td.timestamp) AS latest_timestamp
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
      AND td.event = 'LOC'
    GROUP BY
      v.vehicle_uuid, ts.trip_id
    ORDER BY
      latest_timestamp ASC;
    `;

    const params = [user_uuid, vehicle_status, trip_status];
    const [results] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      message: "Successfully retrieved trip data",
      data: { trip_data: results },
    });
  } catch (err) {
    console.error(`Error in Get Trip Data: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving trip data",
      error: err.message,
    });
  }
};