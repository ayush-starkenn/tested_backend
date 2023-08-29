const pool = require("../config/db");
const logger = require("../logger");
const { client } = require("../config/mqtt");
const { v4: uuidv4 } = require("uuid");

const setupMQTT = () => {
  // On connect to MQTT then Function to retrieve topics from the database
  client.on("connect", async () => {
    logger.info("Connected to MQTT broker");
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT device_id, device_status FROM devices WHERE device_type = ? OR device_type = ?",
        ["DMS", "IoT"]
      );
      rows.map((row) => {
        if (row.device_status === 1) {
          const topic = `starkennInv3/${row.device_id}/data`;
          client.subscribe(topic);
          logger.info(`Subscribed to topic: ${topic}`);
        }
      }); 
    } catch (error) {
      logger.error(`Enable to subscribe the topics ${error}`);
    } finally {
      connection.release();
    }
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
  const connection = await pool.getConnection();
  try {
    // Retrieve vehicle details by device ID [check if the vehicle with the same device id is exist or not]
    const vehicleData = await getVehicleDetailsbyDeviceID(
      validatedJson.device_id
    );

    if (!vehicleData) {
      logger.info(
        `No vehicle found for the provide device ID : ${validatedJson.device_id}. Tripdata not stored.`
      );
      return;
    }

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
    const tripID = await createTripSummary(tripSummaryData, vehicle_uuid);
    // console.log(tripID);
    // Data to insert into Trip data
    const tripdata = [
      tripID,
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

    await connection.query(
      "INSERT INTO tripdata (trip_id, device_id, vehicle_uuid, event, message, timestamp, igs, lat, lng, spd, jsondata, created_at) VALUES (?, NOW())",
      [tripdata]
    );
    logger.info("Stored Tripdata in the database");
  } catch (error) {
    logger.error(`Error storing Tripdata in database: ${error.message}`);
  } finally {
    connection.release();
  }
};

// get vehicle details by device ID
const getVehicleDetailsbyDeviceID = async (deviceID) => {
  const connection = await pool.getConnection();
  try {
    const [row] = await connection.query(
      "SELECT vehicle_uuid, user_uuid FROM vehicles WHERE ecu = ? || dms = ? AND vehicle_status = ?",
      [deviceID, deviceID, 1]
    );

    if (row.length > 0) {
      // logger.info("Successfully received vehicle details.");
      // Return vehicle uuid
      return row;
    } else {
      logger.info(`Vehicle not found for the incomming device ID ${deviceID}`);
      // Return null if no vehicle is found
      return null;
    }
  } catch (error) {
    logger.error(`Error getting vehicle data : ${error}`);
  } finally {
    connection.release();
  }
};

// create trip summary
const createTripSummary = async (tripSummaryData, vehicle_uuid) => {
  const connection = await pool.getConnection();

  try {
    // Check if there's an ongoing trip for the same vehicle
    const [rows, fields] = await connection.query(
      "SELECT vehicle_uuid, trip_id FROM trip_summary WHERE vehicle_uuid = ? AND trip_status = ?",
      [vehicle_uuid, 0]
    );

    // Check if vehicle ID is exist
    if (rows.length > 0) {
      logger.info("Ongoing trip found. Trip will continue");
      return rows[0].trip_id;
    } else {
      const insertConnection = await pool.getConnection();
      try {
        await insertConnection.query(
          "INSERT INTO trip_summary (trip_id, user_uuid, vehicle_uuid, device_id, trip_start_time, trip_status, created_at) VALUES (?,NOW())",
          [tripSummaryData]
        );

        // Log the inserted trip ID
        return tripSummaryData[0];
      } catch (error) {
        logger.error(`Error in creating trip summary ${error}`);
      } finally {
        insertConnection.release();
      }
    }
  } catch (error) {
    logger.error("Error in inserting trip summary!", error);
  } finally {
    connection.release();
  }
};

// Function to store invalid JSON in the database
const storeInvalidJsonInDatabase = async (topic, message) => {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      "INSERT INTO invalid_tripdata (topic, message) VALUES (?, ?, NOW())",
      [topic, message]
    );

    logger.info("Stored invalid Tripdata in the database");
  } catch (error) {
    logger.error(
      `Error storing invalid Tripdata in database: ${error.message}`
    );
  } finally {
    connection.release();
  }
};

module.exports = setupMQTT;
