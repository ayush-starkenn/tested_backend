const { v4: uuidv4 } = require("uuid");
const moment = require("moment-timezone");
const pool = require("../../config/db.js");
const logger = require("../../logger.js");

const addVehicleFeatureset = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { user_uuid, vehicle_uuid, featureset_data } = req.body;
    const newUuid = uuidv4();

    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const addQuery =
      "INSERT INTO vehiclefeatureset(`vehiclefeatureset_uuid`,`user_uuid`,`vehicle_uuid`,`featureset_data`,`vehiclefeatureset_status`,`vehiclefeatureset_created_by`,`vehiclefeatureset_created_at`,`vehiclefeatureset_modified_by`,`vehiclefeatureset_modified_at`) VALUES (?,?,?,?,?,?,?,?,?)";

    const values = [
      newUuid,
      user_uuid,
      vehicle_uuid,
      featureset_data,
      1,
      currentTimeIST,
      user_uuid,
      currentTimeIST,
      user_uuid,
    ];

    const [results] = await connection.execute(addQuery, values);

    if (results) {
      res.status(200).send({
        message: "Successfully vehicle featureset added",
        totalCount: results.length,
        results,
      });
    }
  } catch (err) {
    logger.error(`Error in adding vehicleFeatureset: ${err}`);
    res
      .status(500)
      .send({ message: "Error in adding vehicleFeatureset", error: err });
  } finally {
    connection.release();
  }
};

const editVehicleFeatureset = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { vehiclefeatureset_uuid } = req.params;
    const { user_uuid, vehicle_uuid, featureset_data } = req.body;

    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const editQuery =
      "UPDATE vehiclefeatureset SET vehicle_uuid=?,featureset_data=?,vehiclefeatureset_modified_by=?,vehiclefeatureset_modified_at=? WHERE vehiclefeatureset_uuid=?";

    const values = [
      vehicle_uuid,
      featureset_data,
      user_uuid,
      currentTimeIST,
      vehiclefeatureset_uuid,
    ];

    const [results] = await connection.execute(editQuery, values);

    if (results) {
      res.status(200).send({
        message: "Successsfully vehicle featureset updated",
        totalCount: results.length,
        results,
      });
    }
  } catch (err) {
    logger.error(`Error in updating vehicle featureset: ${err}`);
    res
      .status(500)
      .send({ message: "Error in updating vehicle featureset", error: err });
  } finally {
    connection.release();
  }
};

const getVehicleFeaturesetOfVehicle = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { vehicle_uuid } = req.params;
    const getQuery =
      "SELECT * FROM vehiclefeatureset WHERE vehiclefeatureset_status=? AND vehicle_uuid=?";

    const [results] = await connection.execute(getQuery, [1, vehicle_uuid]);

    if (results) {
      res.status(200).send({
        message: "Successfully got the list of vehicleFeatureset",
        totalCount: results.length,
        results,
      });
    }
  } catch (err) {
    logger.error(`Error in getting the vehicle featureset list: ${err}`);

    res.status(500).send({
      message: "Error in getting the vehicle featureset list",
      error: err,
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  addVehicleFeatureset,
  editVehicleFeatureset,
  getVehicleFeaturesetOfVehicle,
};
