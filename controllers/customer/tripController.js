const express = require("express");
const app = express();
const pool = require("../../config/db");
const logger = require("../../logger.js");

const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Get vehicle trip list by using vehicle uuid
exports.getTripSummary = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { vehicle_uuid } = req.params;

    const query =
      "SELECT * FROM trip_summary WHERE vehicle_uuid = ? AND trip_status = ?";

    const [results] = await connection.execute(query, [vehicle_uuid, 1]);

    if (results.length === 0) {
      return res.status(404).send({ error: "Trip data not found!" });
    }

    res.status(200).send({
      message: "Succesfully fetched trip data.",
      results,
    });
  } catch (err) {
    logger.error(`Error in getting the trip data, Error: ${err} `);
    res.status(500).send({
      message: "An error occurred while fetching trip data",
      Error: err,
    });
  } finally {
    connection.release();
  }
};

// Get ongoing trip data by trip id
exports.getOngoingTripdata = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { vehicle_uuid } = req.params;

    const tripID = await getTripdataByVehicleUUID(vehicle_uuid);
    console.log(tripID);
    if (tripID) {
      const [getTripdata] = await pool.query(
        "SELECT event, message, timestamp, lat, lng, spd FROM tripdata WHERE trip_id = ? ORDER BY timestamp DESC",
        [tripID]
      );
      if (getTripdata.length > 0) {
        res.status(200).json({
          message: "Successfully fetched trip data",
          tripdata: getTripdata,
        });
      } else {
        logger.info(`No trip data found for the tripid : ${tripID}`);
      }
    } else {
      res.status(500).json({ message: "Not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error in fetching tripdata!" });
    logger.error(`Error in fetching tripdata ${error}`);
  } finally {
    connection.release();
  }
};

// Get trip id from trip summary using vehicle uuid
const getTripdataByVehicleUUID = async (vehicle_uuid) => {
  const connection = await pool.getConnection();

  try {
    const [getData] = await pool.query(
      "SELECT trip_id FROM trip_summary WHERE vehicle_uuid = ? AND trip_status= ?",
      [vehicle_uuid, 0]
    );
    if (getData.length > 0) {
      return getData[0].trip_id;
    } else {
      logger.info("No data found!");
      return;
    }
  } catch (error) {
    logger.error(`Error in fetching data ${error}`);
  } finally {
    connection.release();
  }
};

// Get completed trip data by trip id
exports.getCompletedTripdata = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { trip_id } = req.params;

    const [getTripdata] = await pool.query(
      "SELECT event, message, timestamp, lat, lng, spd FROM tripdata WHERE trip_id = ? ORDER BY timestamp DESC",
      [trip_id]
    );
    if (getTripdata.length > 0) {
      res.status(200).json({
        message: "Successfully fetched trip data",
        tripdata: getTripdata,
      });
    } else {
      logger.info(`No trip data found for the tripid : ${trip_id}`);
    }
  } catch (error) {
    res.status(500).json({ message: "Error in fetching tripdata!" });
    logger.error(`Error in fetching tripdata ${error}`);
  } finally {
    connection.release();
  }
};

// Get trip summary using trip id
exports.getTripSummaryByTripId = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { trip_id } = req.params;

    const [getTripdata] = await pool.query(
      "SELECT * FROM trip_summary WHERE trip_id = ?",
      [trip_id]
    );
    if (getTripdata.length > 0) {
      res.status(200).json({
        message: "Successfully fetched trip data",
        tripdata: getTripdata,
      });
    } else {
      logger.info(`No trip data found for the tripid : ${trip_id}`);
    }
  } catch (error) {
    res.status(500).json({ message: "Error in fetching tripdata!" });
    logger.error(`Error in fetching tripdata ${error}`);
  } finally {
    connection.release();
  }
};

// Get fault counts for completedTrip
exports.getFaultCountByTrip_Id = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { trip_id } = req.params;

    const getQuery =
      "SELECT * FROM tripdata WHERE trip_id=? AND event NOT IN ('IGS','NSQ','LOC','RFID')";

    const [results] = await connection.execute(getQuery, [trip_id]);

    if (results) {
      res.status(200).send({
        message: "Successfully got the data of fault count",
        totalCount: results.length,
        results,
      });
    }
  } catch (err) {
    res
      .status(500)
      .send({ message: "Failed to get the data of fault counts", Error: err });
  } finally {
    connection.release();
  }
};

// Get ongoing trip data by trip id
exports.getOngoingTripdataByTripId = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { trip_id } = req.params;
    const [getTripdata] = await pool.query(
      "SELECT event, message, timestamp, lat, lng, spd FROM tripdata WHERE trip_id = ? AND event=? ORDER BY timestamp ASC",
      [trip_id, "LOC"]
    );
    if (getTripdata.length > 0) {
      res.status(200).json({
        message: "Successfully fetched trip data",
        tripdata: getTripdata,
      });
    } else {
      logger.info(`No trip data found for the tripid : ${trip_id}`);
    }
  } catch (error) {
    res.status(500).json({ message: "Error in fetching tripdata!" });
    logger.error(`Error in fetching tripdata ${error}`);
  } finally {
    connection.release();
  }
};

// Get ongoing fault data
exports.getOngoingFaultData = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { tripID, epochstart, epochend } = req.params;
    const [faultData] = await pool.query(
      `SELECT * FROM tripdata WHERE trip_id = ? AND event != 'IGS' AND event != 'NSQ' AND event != 'LOC' AND event != 'RFID'  AND timestamp >= ${epochstart} AND timestamp <= ${epochend}`,
      [tripID, epochstart, epochend]
    );
    if (faultData.length > 0) {
      res.status(200).json({
        message: "Successfully fetched fault data",
        faultdata: faultData,
      });
    } else {
      logger.info(`No fault data found for the tripid : ${tripID}`);
    }
  } catch (error) {
    res.status(500).json({ message: "Error in fetching tripdata!" });
    logger.error(`Error in fetching data ${error}`);
  } finally {
    connection.release();
  }
};
