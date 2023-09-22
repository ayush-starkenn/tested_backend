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
        "SELECT vehicle_name FROM vehicles WHERE user_uuid = ? AND vehicle_status = ?",
        [user_uuid, 1]
      );
  
      let allData = [];
  
      // Construct tripDataPromises
      const tripDataPromises = vehicles.map(async (vehicle) => {
        const { vehicle_name } = vehicle;
  
        // Query trip_summary based on vehicle_uuid
        const [tripSum] = await connection.query(
          "SELECT trip_start_time, trip_id FROM trip_summary WHERE user_uuid = ? AND  trip_status = ?  ",
          [user_uuid, 1]
        );
  
        // Extract trip IDs from trip_summary
        const tripIDs = tripSum.map((tripRow) => tripRow.trip_id);
  
        // Check if there are any trip IDs
        if (tripIDs.length === 0) {
          return null; // Skip this vehicle if it has no trips
        }
  
        // Query tripdata based on trip IDs
        const getQuery = `
          SELECT trip_id, vehicle_uuid
          FROM tripdata
          WHERE trip_id IN (${tripIDs.map((id) => '?').join(',')})
          ORDER BY timestamp ASC
        `;
  
        const [analyticData] = await connection.query(getQuery, tripIDs);
        // Add vehicle_name to each object inside the trip_data array
        const tripDataWithVehicleName = analyticData.map((data) => ({
          ...data,
          vehicle_name,
          trip_start_time: tripSum.find((trip) => trip.trip_id === data.trip_id).trip_start_time,
        }));
  
        // Debugging: Log vehicle_uuid and length of analyticData
        // console.log("Vehicle UUID:", vehicle_uuid);
        // console.log("Vehicle Name:", vehicle_name);
        // console.log("Analytic Data Length:", tripDataWithVehicleName.length);
  
        return tripDataWithVehicleName;
      });
  
      allData = await Promise.all(tripDataPromises);
  
      // Filter out null values (vehicles with no trips)
      const filteredData = allData.filter((data) => data !== null);
  
      res.status(200).json({
        success: true,
        message: "Successfully retrieved trip data",
        data: { trip_data: [].concat(...filteredData) }, // Flatten the array of trip_data
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
  
  

  
  

  
  
  
   
  
  
  
  
  

  