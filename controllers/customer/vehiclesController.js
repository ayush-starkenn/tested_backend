const { v4: uuidv4 } = require("uuid");
const moment = require("moment-timezone");
const pool = require("../../config/db");
const logger = require("../../logger");

//add the vehicle into database
// const addVehicle = async (req, res) => {
//   const {
//     user_uuid,
//     vehicle_name,
//     vehicle_registration,
//     ecu,
//     iot,
//     dms,
//     featureset_id,
//   } = req.body;

//   const newUuid = uuidv4();

//   const connection = await db();

//   let createdAt = new Date();
//   let currentTimeIST = moment
//     .tz(createdAt, "Asia/Kolkata")
//     .format("YYYY-MM-DD HH:mm:ss a");

//   try {
//     const addQuery =
//       "INSERT INTO vehicles(`vehicle_uuid`,`user_uuid`,`vehicle_name`,`vehicle_registration`,`ecu`,`iot`,`dms`,`featureset_id`,`vehicle_status`,`created_at`,`created_by`,`modified_at`,`modified_by`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";

//     const values = [
//       newUuid,
//       user_uuid,
//       vehicle_name,
//       vehicle_registration,
//       ecu,
//       iot,
//       dms,
//       featureset_id,
//       1,
//       currentTimeIST,
//       user_uuid,
//       currentTimeIST,
//       user_uuid,
//     ];

//     const [results] = await connection.execute(addQuery, values);

//     res.status(200).send({
//       message: "Vehicle added successfully",
//       totalCount: results.length,
//       results,
//     });
//   } catch (err) {
//     res.status(500).send({ message: "Error in adding vehicle", Error: err });
//   } finally {
//     connection.release();
//   }
// };

//update the vehicle details
// const editVehicle = async (req, res) => {
//   const { vehicle_uuid } = req.params;

//   const {
//     user_uuid,
//     vehicle_name,
//     vehicle_registration,
//     ecu,
//     iot,
//     dms,
//     featureset_id,
//   } = req.body;

//   const connection = await db();

//   let createdAt = new Date();
//   let currentTimeIST = moment
//     .tz(createdAt, "Asia/Kolkata")
//     .format("YYYY-MM-DD HH:mm:ss a");

//   try {
//     const editQuery =
//       "UPDATE vehicles SET `user_uuid` = ?, `vehicle_name` = ?, `vehicle_registration` = ?, `ecu` = ?, `iot` = ?, `dms` = ?, `featureset_id` = ?, `modified_at` = ?, `modified_by` = ? WHERE `vehicle_uuid` = ?";

//     const values = [
//       user_uuid,
//       vehicle_name,
//       vehicle_registration,
//       ecu,
//       iot,
//       dms,
//       featureset_id,
//       currentTimeIST,
//       user_uuid,
//       vehicle_uuid,
//     ];

//     const [results] = await connection.execute(editQuery, values);

//     res.status(200).send({
//       message: "Vehicle added successfully",
//       totalCount: results.length,
//       results,
//     });
//   } catch (err) {
//     res.status(500).send({ message: "Error in updating data", Error: err });
//   } finally {
//     connection.release();
//   }
// };

//Get list of all vehicles
const getAllvehicles = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const getQuery = "SELECT * FROM vehicles WHERE vehicle_status != ?";

    const [results] = await connection.execute(getQuery, [0]);

    res.status(200).send({ message: "Successfully fetched data", results });
    connection.release();
  } catch (err) {
    logger.error(`Error in fetching vehicle data ${err}`);
    res
      .status(500)
      .send({ message: "Error in fetching vehicle data", Error: err });
  }
};

//get the list of all vehicle assign to particular user
// const getUserVehicles = async (req, res) => {
//   const { user_uuid } = req.params;

//   const connection = await db();
//   try {
//     const getQuery =
//       "SELECT * FROM vehicles WHERE vehicle_status=? AND user_uuid=?";

//     [results] = await connection.execute(getQuery, [1, user_uuid]);

//     res.status(200).send({
//       message: "Successfully got list of all vehicles",
//       totalCount: results.length,
//       results,
//     });
//   } catch (err) {
//     res
//       .status(500)
//       .send({ message: "Error in getting user vehicle list", Error: err });
//   } finally {
//     connection.release();
//   }
// };

//update the status of vehicle make it deactive
// const deleteVehicle = async (req, res) => {
//   const { vehicle_uuid } = req.params;

//   //connection to database
//   const connection = await db();

//   try {
//     const deleteQuery =
//       "UPDATE vehicles SET vehicle_status=? WHERE vehicle_uuid=?";

//     const [results] = await connection.execute(deleteQuery, [2, vehicle_uuid]);

//     res.status(200).send({
//       message: "Successfully vehicle deleted",
//       totalCount: results.length,
//       results,
//     });
//   } catch (err) {
//     res.status(500).send({ message: "Error in deleting device", Error: err });
//   } finally {
//     connection.release();
//   }
// };

// Get total vehicles [admin]
const totalVehicles = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "SELECT COUNT(*) AS count FROM vehicles where vehicle_status != ?",
      [0]
    );
    res
      .status(200)
      .json({ message: "Successfully received vehicles count.", result });
    connection.release();
  } catch (error) {
    logger.error(`Error in fetching the total vehicle data ${error}`);
    res.status(501).json({ message: "Unable to fetch total vehicle!" });
  }
};

module.exports = {
  // addVehicle,
  // editVehicle,
  getAllvehicles,
  // getUserVehicles,
  // deleteVehicle,
  totalVehicles,
};
