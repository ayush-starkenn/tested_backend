const pool = require("../../config/db");
const express = require("express");
const app = express();
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const logger = require("../../logger");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sending Email
const { sendEmail } = require("../../middleware/mailer");
// Sending Notification
const { save_notification} = require("../customer/notifiController");
// Sending Whatsapp Message 
//const { sendWhatsappMessage } = require("../../middleware/whatsapp");

// Add analytic threshold ------------
exports.addAnalyticsThreshold = async (req, res) => {
  // Database Connection-------------
  const connection = await pool.getConnection();
  try {
    const {title,status,brake,tailgating,rash_driving,sleep_alert,over_speed,green_zone,minimum_distance,minimum_driver_rating,ttc_difference_percentage,total_distance,duration,} = req.body;
    const {user_uuid} = req.params;

    // Time Stamp In Bhart Zone----------
    const currentTimeIST = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    // Threshold Id (thresholds_uuid) craete auto genrate ----------
    const threshold_uuid = uuidv4();

    // Insert Queary for add new Thresholds------------------
    const insertQuery = `
      INSERT INTO thresholds
      (threshold_uuid, user_uuid, title, score, incentive, accident, leadership_board, halt, status, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      threshold_uuid,
      user_uuid,
      title,
      JSON.stringify({
        brake,
        tailgating,
        rash_driving,
        sleep_alert,
        over_speed,
        green_zone,
      }),
      JSON.stringify({ minimum_distance, minimum_driver_rating }),
      JSON.stringify({ ttc_difference_percentage }),
      JSON.stringify({ total_distance }),
      JSON.stringify({ duration }),
      status,
      currentTimeIST,
      user_uuid,
    ];

    const [results] = await connection.execute(insertQuery, values);

    // Notification here---------------
        var NotificationValues = `Analytics Thresholds has been  Added Successfully`;
        await save_notification(NotificationValues, user_uuid);
    res
      .status(201)
      .json({ message: "Analytics Thresholds Added Successfully!", results });
      logger.info("Analytics Thresholds Added Successfully!");
  } catch (err) {
    logger.error("Error adding analytics thresholds:", err);
    res.status(500).json({ message: "Error in Add Analytics Thresholds" });
  } finally {
    connection.release();
  }
};

//Get AT By AT-ID
exports.getByIdAnalyticsThresholds = async (req, res) => {
  // Connection To the Database
  const connection = await pool.getConnection();

  try {
    const { threshold_uuid } = req.params;
// Get Query for AT---------
    const getAnalyticsThresholds =
      "SELECT * FROM thresholds WHERE status = ? AND threshold_uuid = ?";
// Status 1 , required only active status AT--------------
    const [results] = await connection.execute(getAnalyticsThresholds, [1,threshold_uuid]);

    res.status(200)
      .send({ message: " Analytics Thresholds Get Succesfully", results });
// logger.info("Analytics Thresholds Get Succesfully")
  } catch (err) {
    res.status(500)
      .send({ message: "Error In getting Analytics Thresholds", Error: "err" });
    logger.error("Error In getting Analytics Thresholds", err);
  } finally {
    connection.release();
  }
};

// Get analyticData ALL 
exports.getAnalyticsThreshold = async (req, res) => {
  // Connection To the Database-----------
  const connection = await pool.getConnection();
  try {
    const getQuery =
      "SELECT thresholds.*, CONCAT(users.first_name, ' ', users.last_name) AS customer_name FROM thresholds INNER JOIN users ON thresholds.user_uuid = users.user_uuid WHERE thresholds.status != ? ORDER BY threshold_id DESC";
    const [analyticData] = await connection.execute(getQuery, [0]);

    res.status(200).send({ total_count: analyticData.length, analyticData });
  } catch (err) {
    logger.error(`Error in fetching analytical threshold data ${err}`);
    res.status(500).send({
      message: "Error in fetching the list of analytical thresholds",
      err,
    });
  } finally {
    connection.release();
  }
};

// Get analyticData By USer UUID
exports.getAnalyticsThresholduser = async (req, res) => {
  // Connection To the Database-----------
  const connection = await pool.getConnection();
  try {
    const {user_uuid} = req.params;
// This query Work for get data by useing user_uuid and get all selected data user_uuid---------
    const getQuery =
      "SELECT thresholds.*, CONCAT(users.first_name, ' ', users.last_name) AS customer_name FROM thresholds INNER JOIN users ON thresholds.user_uuid = users.user_uuid WHERE thresholds.status != ? AND thresholds.user_uuid = ? ORDER BY threshold_id DESC";
    const [analyticData] = await connection.execute(getQuery, [0,user_uuid]);

    res.status(200).send({ total_count: analyticData.length, analyticData });
  } catch (err) {
    logger.error(`Error in fetching analytical threshold data ${err}`);
    res.status(500).send({
      message: "Error in fetching the list of analytical thresholds",
      err,
    });
  } finally {
    connection.release();
  }
};

// update AT
exports.updateAnalyticsThresholds = async (req, res) => {
  // Connection To the Database----------------
  const connection = await pool.getConnection();
  try {
    const { threshold_uuid } = req.params;
    const {user_uuid,title,score,incentive,accident,leadership_board,halt,status,} = req.body;

  // Validate incoming data here-------------------
    if (
      !user_uuid ||
      !title ||
      !score ||
      !incentive ||
      !accident ||
      !leadership_board ||
      !halt
    ) {
      return res
        .status(400)
        .json({ message: "Invalid data. Please provide all required fields." });
    }

    // Generate current time in Asia/Kolkata timezone--------------------
    const currentTimeIST = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    // Update Query-----------------------
    const updateQuery =
      "UPDATE thresholds SET user_uuid=?,title=?, score=?, incentive=?, accident=?, leadership_board=?, halt=?, status=?, modified_at=?, modified_by = ? WHERE threshold_uuid=?";
    const values = [
      user_uuid,
      title,
      JSON.stringify(score),
      JSON.stringify(incentive),
      JSON.stringify(accident),
      JSON.stringify(leadership_board),
      JSON.stringify(halt),
      status,
      currentTimeIST,
      user_uuid,
      threshold_uuid,
    ];

    const [results] = await connection.execute(updateQuery, values);

    // Notification-----------------
    var NotificationValues = "Analytics Thresholds Updated Successfully";
    await save_notification(NotificationValues, user_uuid);

    res.status(201)
      .json({ message: "Analytics Thresholds Updated Successfully", results });
      logger.info("Analytics Thresholds Updated Successfully!");
  } catch (err) {
    logger.error(`Error in updating analytics thresholds: ${err}`);
    res.status(500).json({ message: "Error in Updating Analytics Thresholds" });
  } finally {
    connection.release();
  }
};

//Delete AT
exports.deleteAnalyticsThresholds = async (req, res) => {
  // Connection To the Database
  const connection = await pool.getConnection();

  try {
    const { threshold_uuid } = req.params;
    const { user_uuid } = req.body;

    //creating current date and time
    let createdAt = new Date();
    let currentTimeIST = moment.tz(createdAt, "Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss ");

    // Delete Query For AT
    const deleteQuery =
      "UPDATE thresholds SET status=?, modified_at=?, modified_by=? WHERE threshold_uuid=?";

    const [results] = await connection.execute(deleteQuery, [
      0,
      currentTimeIST,
      user_uuid,
      threshold_uuid,
    ]);

// Notification
  var NotificationValues = "Analytics Thresholds has been Deleted Successfully";
  await save_notification(NotificationValues, user_uuid);

    res.status(201)
      .send({ message: "Analytics Thresholds Deleted Successfully", results });
      logger.info("Analytics Thresholds Deleted Successfully!");
    connection.release();
  } catch (err) {
    logger.error("Error deleteing AT:", err);
    res
      .status(500)
      .send({ message: "Error in deleting the Analytics Thresholds " });
  }
};


