const { v4: uuidv4 } = require("uuid");
const moment = require("moment-timezone");
const pool = require("../../config/db");
const logger = require("../../logger");

//add the vehicle into database
const addVehicle = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      user_uuid,
      vehicle_name,
      vehicle_registration,
      ecu,
      iot,
      dms,
      featureset_uuid,
    } = req.body;

    const newUuid = uuidv4();

    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss a");

    const addQuery =
      "INSERT INTO vehicles(`vehicle_uuid`,`user_uuid`,`vehicle_name`,`vehicle_registration`,`ecu`,`iot`,`dms`,`featureset_uuid`,`vehicle_status`,`created_at`,`created_by`,`modified_at`,`modified_by`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
    const values = [
      newUuid,
      user_uuid,
      vehicle_name,
      vehicle_registration,
      ecu || null,
      iot || null,
      dms || null,
      featureset_uuid,
      1,
      currentTimeIST,
      user_uuid,
      currentTimeIST,
      user_uuid,
    ];
    const [results] = await connection.execute(addQuery, values);

    if (results) {
      res.status(200).send({
        message: "Vehicle added successfully",
        totalCount: results.length,
        results,
      });
    }
  } catch (err) {
    logger.error(`Error in adding vehicle: ${err}`);
    res.status(500).send({ message: "Error in adding vehicle", Error: err });
  } finally {
    connection.release();
  }
};

//update the vehicle details
const editVehicle = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { vehicle_uuid } = req.params;

    const {
      user_uuid,
      vehicle_name,
      vehicle_registration,
      ecu,
      iot,
      dms,
      featureset_uuid,
      vehicle_status,
    } = req.body;

    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss a");

    const editQuery =
      "UPDATE vehicles SET `user_uuid` = ?, `vehicle_name` = ?, `vehicle_registration` = ?, `ecu` = ?, `iot` = ?, `dms` = ?, `featureset_uuid` = ?,`vehicle_status`=?, `modified_at` = ?, `modified_by` = ? WHERE `vehicle_uuid` = ?";

    const values = [
      user_uuid,
      vehicle_name,
      vehicle_registration,
      ecu || null,
      iot || null,
      dms || null,
      featureset_uuid,
      vehicle_status || 1,
      currentTimeIST,
      user_uuid,
      vehicle_uuid,
    ];

    const [results] = await connection.execute(editQuery, values);

    res.status(200).send({
      message: "Vehicle added successfully",
      totalCount: results.length,
      results,
    });
  } catch (err) {
    logger.error(`Error in editing vehicle: ${err}`);
    res.status(500).send({ message: "Error in updating data", Error: err });
  } finally {
    connection.release();
  }
};

//Get list of all vehicles
const getAllvehicles = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const getQuery = "SELECT * FROM vehicles WHERE vehicle_status != ?";

    const [results] = await connection.execute(getQuery, [0]);

    res.status(200).send({ message: "Successfully fetched data", results });
  } catch (err) {
    logger.error(`Error in fetching vehicle data ${err}`);
    res
      .status(500)
      .send({ message: "Error in fetching vehicle data", Error: err });
  } finally {
    connection.release();
  }
};

//get the list of all vehicle assign to particular user
const getUserVehicles = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { user_uuid } = req.params;
    const getQuery =
      "SELECT * FROM vehicles WHERE vehicle_status!=0 AND user_uuid=? ORDER BY vehicle_id DESC";

    [results] = await connection.execute(getQuery, [user_uuid]);

    res.status(200).send({
      message: "Successfully got list of all vehicles",
      totalCount: results.length,
      results,
    });
  } catch (err) {
    logger.error(`Error in getting user vehicle list: ${err}`);
    res
      .status(500)
      .send({ message: "Error in getting user vehicle list", Error: err });
  } finally {
    connection.release();
  }
};

//update the status of vehicle make it deactive
const deleteVehicle = async (req, res) => {
  //connection to database
  const connection = await pool.getConnection();

  try {
    const { vehicle_uuid } = req.params;
    const { user_uuid } = req.body;

    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const deleteQuery =
      "UPDATE vehicles SET vehicle_status=?,modified_at=?,modified_by=?  WHERE vehicle_uuid=?";

    const values = [0, currentTimeIST, user_uuid, vehicle_uuid];

    const [results] = await connection.execute(deleteQuery, values);

    res.status(200).send({
      message: "Successfully vehicle deleted",
      results,
    });
  } catch (err) {
    logger.error(`Error in deleting vehicle: ${err}`);
    res.status(500).send({ message: "Error in deleting vehicle", Error: err });
  } finally {
    connection.release();
  }
};

// Get total vehicles [admin]
const totalVehicles = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      "SELECT COUNT(*) AS count FROM vehicles where vehicle_status != ?",
      [0]
    );
    res
      .status(200)
      .json({ message: "Successfully received vehicles count.", result });
  } catch (error) {
    logger.error(`Error in fetching the total vehicle data ${error}`);
    res.status(501).json({ message: "Unable to fetch total vehicle!" });
  } finally {
    connection.release();
  }
};

//get vehicle Data by vehicle_uuid

const getVehicleData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { vehicle_uuid } = req.params;
    const getQuery = "SELECT * FROM vehicles WHERE vehicle_uuid=?";

    const [results] = await connection.execute(getQuery, [vehicle_uuid]);

    if (results) {
      res.status(200).send({
        message: "Successfully received vehicles count.",
        totalCount: results.length,
        results,
      });
    }
  } catch (err) {
    logger.error(`Error in fetching the vehicle data by vehicle_uuid ${err}`);
    res.status(501).json({ message: "Unable to fetch particular vehicle!" });
  } finally {
    connection.release();
  }
};

module.exports = {
  addVehicle,
  editVehicle,
  getAllvehicles,
  getUserVehicles,
  deleteVehicle,
  totalVehicles,
  getVehicleData,
};
