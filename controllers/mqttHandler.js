const pool = require("../config/db");
const logger = require("../logger");
const { client } = require("../config/mqtt");
const { v4: uuidv4 } = require("uuid");
const pkg = require("geolib");
const { sendEmail } = require("../middleware/mailer");

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

      // Check for trip completion if the current data is > 30 mins
      checkForTripCompletion(validatedJson);
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

// check for trip completion
const checkForTripCompletion = async (validatedJson) => {
  const connection = await pool.getConnection();
  const deviceID = validatedJson.device_id;
  const commingTimeStamp = validatedJson.timestamp;
  try {
    // Get vehicle Id by device ID
    const getVehicleUUID = await getVehicleDetailsbyDeviceID(deviceID);
    const vehicleUUID = getVehicleUUID[0].vehicle_uuid;

    const checkTrip = await checkIfTripAlreadyCompleted(vehicleUUID);
    console.log(checkTrip);
    if (checkTrip === true) {
      logger.info(
        `Trip is already completed for this Vehicle ${vehicleUUID} New trip will generate.`
      );
      // New trip
      storeJsonInDatabase(validatedJson);
      return;
    }

    if (checkTrip === false) {
      logger.info(
        `No trip found for this Vehicle ${vehicleUUID} New trip will generate.`
      );
      // New trip
      storeJsonInDatabase(validatedJson);
      return;
    }

    if (checkTrip[0].trip_id) {
      const [tripData] = await connection.query(
        "SELECT timestamp FROM tripdata WHERE trip_id = ? ORDER BY timestamp DESC LIMIT 1",
        [checkTrip[0].trip_id]
      );
      if (tripData.length > 0) {
        const lastTripTimestamp = tripData[0].timestamp;
        const timeDifferenceInSeconds = commingTimeStamp - lastTripTimestamp;
        const timeDifferenceInMinutes = timeDifferenceInSeconds / 60;

        // check the time diff is > 30 mins
        if (timeDifferenceInMinutes > 30) {
          console.log("Trip end");
          // Complete the trip
          completeTrip(checkTrip[0].trip_id);
        } else {
          console.log("trip continue");
          // Store valid JSON in DB [continue trip]
          storeJsonInDatabase(validatedJson);
        }
      } else {
        // Store valid JSON in DB [continue trip]
        storeJsonInDatabase(validatedJson);
      }
    }
  } catch (error) {
    logger.error(`Something went wrong while completing the trip ${error}`);
  } finally {
    connection.release();
  }
};

// Check trip is already completed or not from trip summary
const checkIfTripAlreadyCompleted = async (vehicleUUID) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await pool.query(
      "SELECT trip_id, trip_status FROM trip_summary WHERE vehicle_uuid = ? ORDER BY ts_id DESC LIMIT 1",
      [vehicleUUID]
    );
    if (result && result.length > 0) {
      if (result[0].trip_status === 1) {
        return true;
      } else if (result[0].trip_status === 0) {
        return [{ trip_id: result[0].trip_id }];
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    logger.error(`Error in checking trip status ${error}`);
  } finally {
    connection.release();
  }
};

// Complete trip
const completeTrip = async (tripID) => {
  const connection = await pool.getConnection();
  // console.log(validatedJson.device_id);
  try {
    const [tripSum] = await connection.query(
      "SELECT trip_id, device_id FROM trip_summary WHERE trip_id = ? AND trip_status = ?",
      [tripID, 0]
    );
    if (tripSum.length > 0) {
      // const tripID = tripSum[0].trip_id;

      // Fetch all data from tripdata related to this tripID
      const [tripdata] = await connection.query(
        "SELECT trip_id, event, timestamp, lat, lng, spd FROM tripdata WHERE trip_id = ? AND event = ? ORDER BY timestamp ASC",
        [tripID, "LOC"]
      );
      if (tripdata.length > 0) {
        let path = [];
        let tripStartTime = tripdata[0].timestamp; // Set trip start time to the first timestamp
        let tripEndTime = tripdata[tripdata.length - 1].timestamp; // Set trip end time to the last timestamp
        let allSpd = [];
        let duration = 0;

        tripdata.forEach((item, index) => {
          // Set lat lng data
          if (item.event == "LOC") {
            let geodata = { latitude: item.lat, longitude: item.lng };
            path.push(geodata);
          }

          // Set speed data
          allSpd.push(item.spd);
        });

        // Set Max speed
        let maxSpd = 0;
        maxSpd = Math.max(...allSpd.map(parseFloat));
        if (maxSpd < 0) {
          maxSpd = 0;
        }

        // Set Avg speed
        const sumOfSpeed = allSpd.reduce(
          (acc, curr) => acc + parseFloat(curr),
          0
        );
        const avgSpd = Math.round(sumOfSpeed) / allSpd.length;
        const averageSpeed = avgSpd.toFixed(2);

        // Set Trip Total distance
        let distance = 0;
        const totalDistance = pkg.getPathLength(path); // In meters
        distance = totalDistance / 1000; // In Kms

        // Set Trip duration
        let difference = "";

        if (tripEndTime > 0 && tripStartTime > 0) {
          difference = tripEndTime - tripStartTime; // seconds
          let hours = Math.floor(difference / 3600);
          difference = difference % 3600;
          let minutes = Math.floor(difference / 60);
          difference = difference % 60;
          let seconds = difference;
          if (hours > 0) {
            duration =
              hours + " hours " + minutes + " Mins " + seconds + " Sec";
          } else {
            duration = minutes + " Mins " + seconds + " Sec";
          }
        }

        // Update to trip summary page
        const [updateTrip] = await pool.query(
          "UPDATE trip_summary SET trip_end_time = ?, total_distance = ?, duration = ?, avg_spd =?, max_spd = ?, trip_status =? WHERE trip_id = ?",
          [tripEndTime, distance, duration, avgSpd, maxSpd, 1, tripID]
        );

        console.log("Trip completed:", updateTrip);
      } else {
        logger.info("Trip data not found for the Trip ID", tripID);
      }
    } else {
      logger.info("No Ongoing trip found!");
    }
  } catch (error) {
    logger.error(`Trip completion process failed! ${error}`);
  } finally {
    connection.release();
  }
};

// Function to store valid JSON in the database
const storeJsonInDatabase = async (validatedJson) => {
  const connection = await pool.getConnection();
  const deviceIDD = validatedJson.device_id;
  try {
    // Retrieve vehicle details by device ID [check if the vehicle with the same device id is exist or not]
    const vehicleData = await getVehicleDetailsbyDeviceID(deviceIDD);

    if (!vehicleData) {
      logger.info(
        `No vehicle found for the provide device ID : ${deviceIDD}. Tripdata not stored.`
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
      deviceIDD,
      validatedJson.timestamp,
      0,
    ];

    const vehicle_uuid = vehicleData[0].vehicle_uuid;
    const tripID = await createTripSummary(
      tripSummaryData,
      vehicle_uuid,
      deviceIDD
    );
    // console.log(tripID);
    // Data to insert into Trip data
    const tripdata = [
      tripID,
      deviceIDD,
      vehicle_uuid,
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

    // Alert triggers
    await trigerMode(validatedJson.event, vehicle_uuid);
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
const createTripSummary = async (tripSummaryData, vehicle_uuid, deviceIDD) => {
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

        // Send Feature set
        sendFeatureSetToDevice(deviceIDD, vehicle_uuid);

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

// Set feature set for the particular device id
const sendFeatureSetToDevice = async (deviceIDD, vehicle_uuid) => {
  try {
    const featureSet =
      '"{"device_id":"EC0001A","message":"105","data":{"system_mode":1,"version_type":1,"cas":{"enabled":1,"activation_speed":40,"alarm_threshold":20.0,"brake_threshold":10.0,"brake_speed":50,"detect_stationary_obj":1,"allow_complete_brake":1,"detect_oncoming_obstacle":1,"safety_mode":2,"ttc_threshold":175,"brake_on_dur":1000,"brake_off_dur":1000,"start_time":12,"stop_time":12},"sleep_alert":{"enabled":1,"pre_warning":5,"slp_alert_interval":60,"activation_spd":40,"start_time":11,"stop_time":6,"braking":1,"braking_act_time":20},"driver_eval":{"enabled":1,"max_lane_chng_threshold":0.35,"min_lane_chng_threshold":-0.35,"max_harsh_acceleration_threshold":0.25,"min_harsh_acceleration_threshold":-0.4,"sudden_braking_threshold":-0.4,"max_spd_bump_threshold":0.5,"min_spd_bump_threshold":-0.5},"speed_governor":{"enabled":1,"speed_limit":100},"cruise":{"enabled":1,"activation_speed":100,"vehicle_type":1},"obd":{"enabled":0,"protocol_no":1},"tpms":{"enabled":1},"veh_settings":{"acc_type":0,"brake_type":1,"gyro_type":2},"sensor":{"laser_sensor":1,"rf_sensor":2,"rf_angle":0,"actication_spd":0},"speed_setting":{"source":1,"const_speed":0,"slope":0.26,"offset":-1.24},"shutdown_delay":{"delay":5},"rfid":{"enabled":1},"time_errors":{"no_alarm":30,"speed":30,"acc_bypass":30,"tpms":0},"speed_errors":{"rf_sen_absent":30,"gyro_absent":50,"hmi_absent":50,"tns":60,"brake_err":0,"tpms_err":0,"obd_absent":0,"no_alarm":0,"laser_sen_absent":0,"rfid_absent":0,"iot_absent":0,"acc_board":0,"dd_mod_dis":60,"alco_sen_dis":0,"temp_sen_dis":30},"firmware_update":{"status":0},"alchohol_detection":{"enable":0,"alchohol_ta_int":120,"actication_spd":40,"start_time":23,"stop_time":6,"alchohol_threshold":1},"dms":{"enable":0,"alert_type":1,"severity":1,"act_spd":40,"start_time":23,"stop_time":6},"temp_sensor":{"enable":0,"threshold":0}},"timestamp":1419038000}"';

    client.publish(`starkennOutv3/${deviceIDD}/data`, featureSet);
  } catch (error) {
    logger.error(`Error in sending featureset ${error}`);
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

// Trigger mode
const trigerMode = async (event, vehicleUUID) => {
  const connection = await pool.getConnection();

  try {
    const [triggers] = await connection.query(
      `SELECT recipients FROM alert_triggers WHERE vehicle_uuid = ? AND trigger_type = ? AND trigger_status = ?`,
      [vehicleUUID, event, 1]
    );
    if (triggers.length > 0) {
      // console.log(triggers);
      sendEmail("piyush@starkenn.com", `${event} mode due to Some reason...`);
    } else {
      // logger.info(`No alert trigger found`);
      return;
    }
  } catch (error) {
    logger.error(`Error in alert trigger ${error}`);
  } finally {
    connection.release();
  }
};

module.exports = setupMQTT;
