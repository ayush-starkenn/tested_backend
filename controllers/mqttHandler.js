const pool = require("../config/db");
const logger = require("../logger");
const { client } = require("../config/mqtt");
const { v4: uuidv4 } = require("uuid");

const setupMQTT = () => {
  client.on("connect", () => {
    logger.info("Connected to MQTT broker");
    client.subscribe("#");
  });

  client.on("message", (topic, message) => {
    // console.log(`${message.toString()}`);
    try {
      const validatedJson = JSON.parse(message.toString());
      // Store valid JSON in DB
      storeJsonInDatabase(validatedJson);
    } catch (error) {
      logger.error(
        `MQTT send invalid JSON from Topic : ${topic} Error: ${error.message}`
      );
      // Call the function to store in DB
      storeInvalidJsonInDatabase(topic, message.toString());
    }
  });

  return client;
};

// Function to store valid JSON in the database
const storeJsonInDatabase = async (validatedJson) => {
  try {
    const connection = await pool.getConnection();

    // Retrieve vehicle details by device ID
    const vehicleData = await getVehicleDetailsbyDeviceID(
      validatedJson.device_id
    );

    if (!vehicleData) {
      logger.info(
        `No vehicle found for the provide device ID : ${validatedJson.device_id}. Tripdata not stored.`
      );
      return;
    }

    const tripdata = [
      validatedJson.device_id,
      vehicleData[0].vehicle_uuid,
      validatedJson.event,
      validatedJson.message,
      validatedJson.timestamp,
      validatedJson.ignition,
      validatedJson.td.lat,
      validatedJson.td.lng,
      validatedJson.td.spd,
      JSON.stringify(validatedJson),
    ];

    // create new trip id
    const tripUUID = uuidv4();

    // Trip summary data to create trip summary
    const tripSummaryData = [
      tripUUID,
      vehicleData[0].user_uuid,
      vehicleData[0].vehicle_uuid,
      validatedJson.device_id,
      validatedJson.timestamp,
      0,
    ];

    const vehicle_uuid = vehicleData[0].vehicle_uuid;
    await createTripSummary(tripSummaryData, vehicle_uuid);

    await connection.query(
      "INSERT INTO tripdata (device_id, vehicle_uuid, event, message, timestamp, igs, lat, lng, spd, jsondata, created_at) VALUES (?, NOW())",
      [tripdata]
    );
    connection.release();
    logger.info("Stored Tripdata in the database");
  } catch (error) {
    logger.error(`Error storing Tripdata in database: ${error.message}`);
  }
};

// get vehicle details by device ID
const getVehicleDetailsbyDeviceID = async (deviceID) => {
  try {
    const connection = await pool.getConnection();
    const [row] = await connection.query(
      "SELECT vehicle_uuid, user_uuid FROM vehicles WHERE ecu = ? || dms = ? AND vehicle_status = ?",
      [deviceID, deviceID, 1]
    );
    connection.release();

    if (row.length > 0) {
      logger.info("Successfully received vehicle details.");
      // Return vehicle uuid
      return row;
    } else {
      logger.info(`Vehicle not found.`);
      // Return null if no vehicle is found
      return null;
    }
  } catch (error) {
    logger.error(`Error getting vehicle data : ${error}`);
  }
};

// create trip summary
const createTripSummary = async (tripSummaryData, vehicle_uuid) => {
  try {
    const connection = await pool.getConnection();
    const [rows, fields] = await connection.query(
      "SELECT vehicle_uuid FROM trip_summary WHERE vehicle_uuid = ? AND trip_status = ?",
      [vehicle_uuid, 0]
    );
    connection.release();

    // Check if vehicle ID is exist
    if (rows.length > 0) {
      logger.info("Ongoing trip found. Trip will continue");
    } else {
      try {
        const insertConnection = await pool.getConnection();
        await insertConnection.query(
          "INSERT INTO trip_summary (trip_id, user_uuid, vehicle_uuid, device_id, trip_start_time, trip_status, created_at) VALUES (?,NOW())",
          [tripSummaryData]
        );
        insertConnection.release();
      } catch (error) {
        logger.error(`Error in creating trip summary ${error}`);
      }
    }
  } catch (error) {
    logger.error("Error in inserting trip summary!", error);
  }
};

// Function to store invalid JSON in the database
const storeInvalidJsonInDatabase = async (topic, message) => {
  try {
    const connection = await pool.getConnection();
    await connection.query(
      "INSERT INTO invalid_tripdata (topic, message) VALUES (?, ?, NOW())",
      [topic, message]
    );
    connection.release();
    logger.info("Stored invalid Tripdata in the database");
  } catch (error) {
    logger.error(
      `Error storing invalid Tripdata in database: ${error.message}`
    );
  }
};

module.exports = setupMQTT;
