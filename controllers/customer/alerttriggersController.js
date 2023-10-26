const pool = require("../../config/db");
const express = require("express");
const app = express();
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../logger");
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

;const { sendEmail } = require("../../middleware/mailer");
const { save_notification} = require("../customer/notifiController");
//const { sendWhatsappMessage } = require("../../middleware/whatsapp");

// functions
exports.saveAlertTrigger = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { user_uuid } = req.params;
    const {
      trigger_name,
      trigger_description,
      vehicle_uuid,
      trigger_type,
      selectedContacts,
    } = req.body;

    // Input validation
    if (
      !trigger_name ||
      !trigger_description ||
      !vehicle_uuid ||
      !trigger_type ||
      !selectedContacts
    ) {
      return res.status(400).send({ message: "All fields are required." });
    }

    // Check if the alert trigger already exists
    const checkQuery =
      "SELECT * FROM alert_triggers WHERE vehicle_uuid = ? AND trigger_type = ?";
    const [existingAlerts] = await connection.execute(checkQuery, [
      vehicle_uuid,
      trigger_type,
    ]);

    if (existingAlerts.length > 0) {
      return res.status(409).send({ message: "Alert trigger already exists." });
    }

    const trigger_created_at = new Date();
    const currentTimeIST = moment
      .tz(trigger_created_at, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const dataSent = [
      user_uuid,
      trigger_name,
      trigger_description,
      vehicle_uuid,
      trigger_type,
      JSON.stringify(selectedContacts),
      1,
      currentTimeIST,
      user_uuid,
    ];

    const savequery = `INSERT INTO alert_triggers (user_uuid, trigger_name, trigger_description, vehicle_uuid, trigger_type, recipients, trigger_status, trigger_created_at, trigger_created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [alerts] = await connection.execute(savequery, dataSent);

      //await notification(values);
   var NotificationValues = "Successfully saved the alert";
   await save_notification(NotificationValues, user_uuid);

    res.status(200).send({
      message: "Successfully saved the alert",
      alerts,
    });
  } catch (err) {
    logger.error(`Error in saving the alert: ${err}`);
    res.status(500).send({
      message: "An error occurred while saving alerts",
      error: err.message,
    });
  } finally {
    connection.release();
  }
};

// get one triggers
exports.getAlertTrigger = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { trigger_id } = req.params;
    const getquery = `SELECT * FROM alert_triggers WHERE trigger_id = ?`;

    const [alerts] = await connection.execute(getquery, [trigger_id]);

    res.status(200).send({
      message: "Successfully got the alert",
      // totalCount: contacts.length,
      alerts,
    });
  } catch (err) {
    logger.error(`Error in getting the alert by trigger_id, Error: ${err} `);
    res.status(500).send({
      message: "An error occurred while getting the alerts",
      Error: err,
    });
  } finally {
    connection.release();
  }
};

// get all triggers
exports.getAllAlertTrigger = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { user_uuid } = req.params;

    const getquery = `SELECT * FROM alert_triggers WHERE user_uuid = ? AND trigger_status !=? ORDER BY trigger_id DESC`;

    const [alerts] = await connection.execute(getquery, [user_uuid, 0]);

    res.status(200).send({
      message: "Successfully got all the alert",
      // totalCount: contacts.length,
      alerts,
    });
  } catch (err) {
    logger.error(`Error in getting all the alert by user_uuid, Error: ${err} `);
    res.status(500).send({
      message: "An error occurred while getting all the alerts",
      Error: err,
    });
  } finally {
    connection.release();
  }
};

//delete the trigger by trigger_id ==> means status 0 now
exports.DeleteAlertTrigger = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { trigger_id } = req.params;
    const deletequery = `UPDATE alert_triggers SET trigger_status = ? WHERE trigger_id = ?`;

    const [alerts] = await connection.execute(deletequery, [0, trigger_id]);

          //await notification(values);
   var NotificationValues = "Successfully deleted the alert";
   await save_notification(NotificationValues, user_uuid);

    res.status(200).send({
      message: "Successfully deleted the alert",
      // totalCount: contacts.length,
      alerts,
    });
  } catch (err) {
    logger.error(`Error in deleting the alert by trigger_id, Error: ${err} `);
    res.status(500).send({
      message: "An error occurred while deleting the alerts",
      Error: err,
    });
  } finally {
    connection.release();
  }
};

//edit triggers by trigger_id
exports.updateAlertTrigger = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { trigger_id } = req.params;
    const {
      trigger_name,
      trigger_description,
      vehicle_uuid,
      trigger_type,
      recipients,
      trigger_status,
      user_uuid,
    } = req.body;

    // Input validation
    if (
      !trigger_name ||
      !trigger_description ||
      !vehicle_uuid ||
      !trigger_type ||
      !recipients ||
      !trigger_status ||
      !user_uuid
    ) {
      return res.status(400).send({ message: "All fields are required." });
    }

    const checkQuery =
      "SELECT vehicle_uuid, trigger_type FROM alert_triggers WHERE vehicle_uuid = ? AND trigger_type = ? AND trigger_id <> ?";
    const [existingAlerts] = await connection.execute(checkQuery, [
      vehicle_uuid,
      trigger_type,
      trigger_id,
    ]);

    if (existingAlerts.length > 0) {
      return res.status(409).send({
        message:
          "Alert trigger with the same vehicle and trigger type already exists.",
      });
    }

    const trigger_modified_at = new Date();
    const currentTimeIST = moment
      .tz(trigger_modified_at, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const dataSent = [
      trigger_name,
      trigger_description,
      vehicle_uuid,
      trigger_type,
      recipients,
      trigger_status,
      currentTimeIST,
      user_uuid,
      trigger_id,
    ];

    const editquery = `UPDATE alert_triggers SET trigger_name = ?, trigger_description = ?, vehicle_uuid = ?, trigger_type = ?, recipients = ?, trigger_status = ?, trigger_modified_at = ?, trigger_modified_by = ? WHERE trigger_id = ?`;

    const [alerts] = await connection.execute(editquery, dataSent);

              //await notification(values);
   var NotificationValues = "Successfully updated the alert";
   await save_notification(NotificationValues, user_uuid);

    res.status(200).send({
      message: "Successfully updated the alert",
      alerts,
    });
  } catch (err) {
    logger.error(`Error in updating the alert: ${err}`);
    res.status(500).send({
      message: "An error occurred while updating alerts",
      error: err.message,
    });
  } finally {
    connection.release();
  }
};
