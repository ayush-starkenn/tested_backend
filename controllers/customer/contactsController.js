const pool = require("../../config/db");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../logger.js");
const { clear } = require("winston");

const { sendEmail } = require("../../middleware/mailer");
const { save_notification } = require("../customer/notifiController");
//const { sendWhatsappMessage } = require("../../middleware/whatsapp");

const getAllContacts = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { user_uuid } = req.params;

    const getquery = `SELECT * FROM contacts WHERE contact_status !=0 AND user_uuid = ? ORDER BY contact_created_at DESC`;

    const [contacts] = await connection.execute(getquery, [user_uuid]);

    res.status(200).send({
      message: "Successfully Fetched List Of All Contacts",
      // totalCount: contacts.length,
      contacts,
    });
  } catch (err) {
    logger.error(`Error in getting the list, Error: ${err} `);
    res.status(500).send({
      message: "An error occurred while fetching contacts",
      Error: err,
    });
  } finally {
    connection.release();
  }
};

const getContact = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { contact_uuid } = req.params;

    const query = `
        SELECT * FROM contacts WHERE contact_uuid = ? AND contact_status = ? ORDER BY contact_created_at DESC`;

    const [results] = await connection.execute(query, [contact_uuid, 1]);

    if (results.length === 0) {
      return res.status(404).send({ error: "Contact not found" });
    }

    res.status(200).send({
      message: "Successfully fetched the Contacts details",
      // totalCount: results.length,
      results,
    });
  } catch (err) {
    logger.error(`Error in getting data, Error: ${err} `);
    res.status(500).send({ message: "Error in data", Error: err });
  } finally {
    connection.release();
  }
};

const saveContact = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      contact_first_name,
      contact_last_name,
      contact_email,
      contact_mobile,
      //contact_status
    } = req.body;

    const { user_uuid } = req.params;

    const contact_created_at = new Date();
    const currentTimeIST = moment
      .tz(contact_created_at, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss ");

    const newUuid = uuidv4();

    const queriesToGet = `
        SELECT * FROM contacts WHERE contact_email = ? OR contact_mobile = ?`;

    const [result] = await connection.execute(queriesToGet, [
      contact_email,
      contact_mobile,
    ]);

    if (result.length > 0) {
      return res.status(400).json({
        message: "Contacts in Email and Mobile Number already exists",
      });
    }

    const insertQuery = `
        INSERT INTO contacts (user_uuid, contact_uuid, contact_first_name, contact_last_name, contact_email, contact_mobile, contact_status, contact_created_at, contact_created_by, contact_modified_at, contact_modified_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const insertData = [
      user_uuid,
      newUuid,
      contact_first_name,
      contact_last_name,
      contact_email,
      contact_mobile,
      parseInt(1),
      currentTimeIST,
      user_uuid,
      currentTimeIST,
      user_uuid,
    ];

    const [insertResults] = await connection.execute(insertQuery, insertData);

    //await notification(values);
    var NotificationValues = "Contact added successfully";
    await save_notification(NotificationValues, user_uuid);

    res.status(201).json({
      message: "Contact added successfully",
      totalCount: insertResults.length,
      insertResults,
    });
  } catch (err) {
    logger.error(`Error in adding Contact: ${err}`);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

const editContact = async (req, res) => {
  // Connection to database
  const connection = await pool.getConnection();
  try {
    const {
      contact_first_name,
      contact_last_name,
      contact_email,
      contact_mobile,
      contact_status,
      user_uuid,
    } = req.body;
    // const { user_uuid } = req.decoded;

    const { contact_uuid } = req.params;

    const contact_modified_at = new Date();
    const currentTimeIST2 = moment
      .tz(contact_modified_at, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    // Check if the updated email or mobile already exist for another contact
    const queriesToGet = `
        SELECT * FROM contacts WHERE (contact_email = ? OR contact_mobile = ?) AND contact_uuid != ?`;

    const [result] = await connection.execute(queriesToGet, [
      contact_email,
      contact_mobile,
      contact_uuid,
    ]);

    if (result.length > 0) {
      return res.status(400).send({
        error: "Contact already exists with the provided email or mobile",
      });
    }

    const query = `
        UPDATE contacts SET contact_first_name = ? , contact_last_name = ? , contact_email = ? , contact_mobile = ? ,contact_status = ?, contact_modified_at = ?, contact_modified_by = ? WHERE contact_uuid = ?`;

    const updateData = [
      contact_first_name,
      contact_last_name,
      contact_email,
      contact_mobile,
      contact_status,
      currentTimeIST2,
      user_uuid,
      //req.body.user_uuid,
      contact_uuid,
    ];

    const [results] = await connection.execute(query, updateData);

    //await notification(values);
    var NotificationValues = `${contact_first_name} updated successfully`;
    await save_notification(NotificationValues, user_uuid);

    res.status(201).json({
      message: "Contacts updated successfully",
      totalCount: results.length,
      results,
    });
  } catch (err) {
    logger.error(`Error in updating Contacts: ${err}`);
    res.status(500).send({ message: "Error in updating Contacts", err });
  } finally {
    connection.release();
  }
};

const deleteContact = async (req, res) => {
  //connection to database
  const connection = await pool.getConnection();

  try {
    const { contact_uuid } = req.params;
    const { user_uuid } = req.body;

    //creating current date and time
    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss ");

    // writing the query
    const queryMade = `UPDATE contacts SET contact_status = ?, contact_modified_at = ?, contact_modified_by = ?  WHERE contact_uuid = ?`;

    // executing ...
    const [results] = await connection.execute(queryMade, [
      0,
      currentTimeIST,
      user_uuid,
      contact_uuid,
    ]);

    //await notification(values);
    var NotificationValues = "Contacts deleted successfully";
    await save_notification(NotificationValues, user_uuid);

    res.status(201).json({
      message: "Contacts deleted successfully",
      totalCount: results.length,
      results,
    });
  } catch (err) {
    logger.error(`Error in deleting the Contacts ${err}`);
    res
      .status(500)
      .json({ message: "Error in deleting the contacts", Error: err });
  } finally {
    connection.release();
  }
};
  
//exports.....
module.exports = {
  getAllContacts,
  getContact,
  saveContact,
  editContact,
  deleteContact,
};
