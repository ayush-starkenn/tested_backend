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
