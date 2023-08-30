const express = require("express");
const app = express();
const pool = require("../../config/db");
const logger = require("../../logger.js");

const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid"); 
const bodyParser = require("body-parser");

// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// creating the add rfid
exports.addRFID = async (req, res) => {

  // Connection to DB
  const connection = await pool.getConnection();

  try {
      const {
        rfid,
       // driver_uuid,
       // rfid_status,
       } = req.body;

       const {  driver_uuid, user_uuid} = req.params;

    // Generate current time in Asia/Kolkata timezone
    const currentTimeIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const checkQuery = "SELECT rfid FROM rfid WHERE rfid=?";

    const [checkrfid] = await connection.execute(checkQuery, [rfid]);

    if (checkrfid.length > 0) {
      return res
        .status(400)
        .json({ message: "Driver RFID already exists" });
    }

    const query =
      "INSERT INTO rfid (rfid , driver_uuid , rfid_status , rfid_created_at , rfid_created_by ) VALUES (? , ? , ? , ? , ?)";

    const [results] = await connection.execute(query, [
      rfid,
      driver_uuid,
      parseInt(1),
      currentTimeIST,
      user_uuid,
    ]);

    res.status(201).json({ message: "Driver RFID Added Successfully!", results });
  } catch (err) {
    logger.error("Error adding Driver RFID:", err);
    res.status(500).send({ message: "Error in Add Driver RFID" });
  } finally {
    connection.release();
  }
};

// creating the assign rfid
exports.assignRFID = async (req, res) => {

    const connection = await pool.getConnection();

    try {
  const { rfid } = req.params;
  const {user_uuid} = req.body;


    // Generate current time in Asia/Kolkata timezone
    const currentTimeIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const query = `UPDATE rfid SET rfid_status = ?, rfid_modified_at = ? , rfid_modified_by = ? WHERE rfid = ?`;

    const [results] = await connection.execute(query, [
      1,
      currentTimeIST,
      user_uuid,
      rfid,
    ]);

 res.status(200).send({
            message: "Succesfully assign RFID",
            results,
        });
       } catch (err) {
        logger.error(`Error in assign RFID, Error: ${err} `);
        res.status(500).send({ message: "An error occurred while assign RFID", Error: err });
    } finally {
        connection.release();
      }
    
};

// creating the unassign rfid
exports.unassignRFID = async (req, res) => {

      const connection = await pool.getConnection();
  try {

  const { rfid } = req.params;
  const {user_uuid} = req.body;

    // Generate current time in Asia/Kolkata timezone
    const currentTimeIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");


    const query = `UPDATE rfid SET rfid_status = ?, rfid_modified_at = ? , rfid_modified_by = ? WHERE rfid = ?`;

    const [results] = await connection.execute(query, [
      2,
      currentTimeIST,
      user_uuid,
      rfid,
    ]);

 res.status(200).send({
            message: "Succesfully Unassign RFID",
            results,
        });
       } catch (err) {
        logger.error(`Error in Unassign RFID, Error: ${err} `);
        res.status(500).send({ message: "An error occurred while Unassign RFID", Error: err });
    } finally {
        connection.release();
      }
    
};

// creating the delete rfid
exports.deleteRFID = async (req, res) => {

  // Connection to DB
  const connection = await pool.getConnection();

  try {
  const { rfid } = req.params;
  const {user_uuid} = req.body;

    // Generate current time in Asia/Kolkata timezone
    const currentTimeIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const query = `UPDATE rfid SET rfid_status = ?, rfid_modified_at = ? , rfid_modified_by = ? WHERE rfid = ?`;

    const [results] = await connection.execute(query, [
      0,
      currentTimeIST,
      user_uuid,
      rfid,
    ]);

    res.status(200).send({
      message: "Succesfully Delte RFID",
      results,
  });
 } catch (err) {
  logger.error(`Error in Delete RFID, Error: ${err} `);
  res.status(500).send({ message: "An error occurred while Delete RFID", Error: err });
} finally {
  connection.release();
}

};

// creating get all rfid
exports.getAllRFID = async (req, res) => {

  const connection = await pool.getConnection();
 // const { user_uuid } = req.params;

  try {
    const query = `SELECT * from rfid WHERE NOT rfid_status = ?`;

    const [results] = await connection.execute(query, [0]);

 res.status(200).send({
            message: "Succesfully GEt All RFID",
            results,
        });
       } catch (err) {
        logger.error(`Error in Get All RFID, Error: ${err} `);
        res.status(500).send({ message: "An error occurred while Get All RFID", Error: err });
    } finally {
        connection.release();
      }
    
};
