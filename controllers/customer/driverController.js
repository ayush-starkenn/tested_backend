const pool = require("../../config/db");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../logger.js");

const addDriver = async (req, res) => {
  // Connection to the database
  const connection = await pool.getConnection();
  try {
    const { user_uuid } = req.params;

    const {
      // user_uuid,
      driver_first_name,
      driver_last_name,
      driver_email,
      driver_mobile,
      driver_dob,
      driver_gender,
      driver_auth_id,
      driver_license_no,
    } = req.body;
    console.log(req.body);

    const newUuid = uuidv4();

    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss ");

    let driverDOB = moment.tz(driver_dob, "Asia/Kolkata").format("YYYY-MM-DD");

    const checkQuery = `SELECT * FROM drivers WHERE driver_mobile = ? OR driver_license_no = ? OR driver_email = ?`;

    const [checkResults] = await connection.execute(checkQuery, [
      driver_mobile,
      driver_license_no,
      driver_email,
    ]);

    if (checkResults.length > 0) {
      const existingFields = checkResults.map((result) => {
        if (result.driver_mobile === driver_mobile) {
          return "Mobile number";
        } else if (result.driver_license_no === driver_license_no) {
          return "License number";
        } else if (result.driver_email === driver_email) {
          return "Email";
        }
      });

      return res.status(400).send({
        message: `Driver ${existingFields.join(", ")} already exists`,
      });
    }

    const addQuery =
      "INSERT INTO drivers(`driver_uuid`,`user_uuid`,`driver_first_name`,`driver_last_name`,`driver_email`,`driver_mobile`,`driver_dob`,`driver_gender`,`driver_auth_id`,`driver_license_no`,`driver_status`,`driver_created_at`,`driver_created_by`,`driver_modified_at`,`driver_modified_by`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    const values = [
      newUuid,
      user_uuid,
      driver_first_name,
      driver_last_name,
      driver_email,
      driver_mobile,
      driverDOB,
      driver_gender,
      driver_auth_id,
      driver_license_no,
      parseInt(1),
      currentTimeIST,
      user_uuid,
      currentTimeIST,
      user_uuid,
    ];
    const [results] = await connection.execute(addQuery, values);

    res.status(201).json({
      message: "Driver added successfully",
      totalCount: results.length,
      results,
    });
  } catch (err) {
    logger.error(`Error in adding Driver: ${err}`);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

const editDriver = async (req, res) => {
  // Connection to the database
  const connection = await pool.getConnection();
  try {
    const {
      driver_first_name,
      driver_last_name,
      driver_email,
      driver_mobile,
      driver_dob,
      driver_gender,
      driver_auth_id,
      driver_license_no,
      driver_status,
      userUUID,
    } = req.body;

    const { driver_uuid } = req.params;

    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss ");

    let driverDOB = moment.tz(driver_dob, "Asia/Kolkata").format("YYYY-MM-DD");

    const checkQuery = `SELECT * FROM drivers WHERE (driver_mobile = ? OR driver_license_no = ? OR driver_email = ?) AND driver_uuid != ?`;

    const [checkResults] = await connection.execute(checkQuery, [
      driver_mobile,
      driver_license_no,
      driver_email,
      driver_uuid,
    ]);

    if (checkResults.length > 0) {
      const existingFields = checkResults.map((result) => {
        if (result.driver_mobile === driver_mobile) {
          return "Mobile number";
        } else if (result.driver_license_no === driver_license_no) {
          return "License number";
        } else if (result.driver_email === driver_email) {
          return "Email";
        }
      });

      return res.status(400).send({
        message: `Driver ${existingFields.join(", ")} already exists`,
      });
    }

    const editQuery =
      "UPDATE drivers SET driver_first_name=?,driver_last_name=?,driver_email=?,driver_mobile=?,driver_dob=?,driver_gender=?,driver_auth_id=?,driver_license_no=?,driver_status=?,driver_modified_at=?,driver_modified_by=? WHERE driver_uuid=?";

    const values = [
      driver_first_name,
      driver_last_name,
      driver_email,
      driver_mobile,
      driverDOB,
      driver_gender,
      driver_auth_id,
      driver_license_no,
      driver_status,
      currentTimeIST,
      userUUID,
      driver_uuid,
    ];

    const [results] = await connection.execute(editQuery, values);

    res.status(201).send({
      message: "Successfully driver updated",
      totalCount: results.length,
      results,
    });
  } catch (err) {
    logger.error(`Error in updating Driver: ${err}`);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

const deleteDriver = async (req, res) => {
  //connection to database
  const connection = await pool.getConnection();
  try {
    const { driver_uuid } = req.params;
    const { user_uuid } = req.body;

    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss ");

    const deleteQuery =
      "UPDATE drivers SET driver_status=?, driver_modified_at=?,driver_modified_by=? WHERE driver_uuid=?";

    const [results] = await connection.execute(deleteQuery, [
      0,
      currentTimeIST,
      user_uuid,
      driver_uuid,
    ]);
    res.status(201).send({
      message: "Successfully driver deleted",
      totalCount: results.length,
      results,
    });
  } catch (err) {
    logger.error(`Error in deleting the Contacts ${err}`);
    res
      .status(500)
      .send({ message: "Error in deleting the contacts", Error: err });
  } finally {
    connection.release();
  }
};

const getUsersDrivers = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { user_uuid } = req.params;
    const getQuery =
      "SELECT * FROM drivers WHERE user_uuid=? AND driver_status=? ORDER BY driver_created_at DESC";

    const [results] = await connection.execute(getQuery, [user_uuid, 1]);

    res.status(200).send({
      message: "Successfully got all drivers list",
      totalCount: results.length,
      results,
    });
  } catch (err) {
    logger.error(`Error in getting data, Error: ${err} `);
    res.status(500).send({ message: "Error in data", Error: err });
  } finally {
    connection.release();
  }
};

module.exports = { addDriver, editDriver, deleteDriver, getUsersDrivers };
