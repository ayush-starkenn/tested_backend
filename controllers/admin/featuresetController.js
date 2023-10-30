const { v4: uuidv4 } = require("uuid");
const moment = require("moment-timezone");
const pool = require("../../config/db.js");
const logger = require("../../logger.js");

const { sendEmail } = require("../../middleware/mailer");
const { save_notification} = require("../customer/notifiController");
//const { sendWhatsappMessage } = require("../../middleware/whatsapp");

//adding the featureset
const addFeatureset = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      user_uuid,
      featureset_name,
      featureset_users,
      featuerset_version,
      featureset_data,
    } = req.body;

    const newUuid = uuidv4();

    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const addQuery =
      "INSERT INTO featureset(`featureset_uuid`,`featureset_name`,`featureset_users`,`featureset_version`,`featureset_data`,`featureset_status`,`featureset_created_by`,`featureset_created_at`,`featureset_modified_at`,`featureset_modified_by`) VALUES(?,?,?,?,?,?,?,?,?,?)";

    const values = [
      newUuid,
      featureset_name,
      JSON.stringify(featureset_users),
      featuerset_version,
      JSON.stringify(featureset_data),
      1,
      user_uuid,
      currentTimeIST,
      currentTimeIST,
      user_uuid,
    ];

    const [results] = await connection.execute(addQuery, values);

        //await notification(values);
        var NotificationValues = "Successfully featureset added";
        await save_notification(NotificationValues, user_uuid);

    if (results) {
      res.status(201).send({
        message: "Successfully featureset added",
        totalCount: results.length,
        results,
      });
    }
  } catch (err) {
    logger.error(`Error in adding featureset: ${err}`);
    res.status(500).send({ message: "Error in adding featureset", error: err });
  } finally {
    connection.release();
  }
};

//edit featureset api
const editFeatureset = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { featureset_uuid } = req.params;

    const {
      user_uuid,
      featureset_name,
      featureset_users,
      featuerset_version,
      featureset_data,
      featureset_status,
    } = req.body;

    let updatedAt = new Date();
    let currentTimeIST = moment
      .tz(updatedAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const editQuery =
      "UPDATE featureset SET  `featureset_name`=?,`featureset_users`=?, `featureset_version`=?, `featureset_data`=?, `featureset_status`=?, `featureset_modified_at`=?, `featureset_modified_by`=? WHERE `featureset_uuid`=?";

    const values = [
      featureset_name,
      JSON.stringify(featureset_users),
      featuerset_version,
      JSON.stringify(featureset_data),
      featureset_status,
      currentTimeIST,
      user_uuid,
      featureset_uuid,
    ];

    [results] = await connection.execute(editQuery, values);

        //await notification(values);
        var NotificationValues = "Successfully featureset updated";
        await save_notification(NotificationValues, user_uuid);

    if (results) {
      res.status(200).send({
        message: "Successfully featureset updated",
        totalCount: results.length,
        results,
      });
    }
  } catch (err) {
    logger.error(`Error in updating featureset: ${err}`);
    res
      .status(500)
      .send({ message: "Error in updating featureset", error: err });
  } finally {
    connection.release();
  }
};

//this is the function created to delete all vehicleFS when default featureset updated
const DeleteVehiclesFromVehiFS = async (user_uuid) => {
  const connection = await pool.getConnection();

  try {
    const deleteQuery = "DELETE FROM vehiclefeatureset WHERE `user_uuid`=?";
    const [deleteResults] = await connection.execute(deleteQuery, [user_uuid]);

    if (deleteResults.affectedRows >= 0) {
      return;
    }
  } catch (err) {
    logger.error(`Error in Deleting vehicleFS: ${err}`);
    return;
  } finally {
    connection.release();
  }
};

//this function created to add deviceIds & FS to mqttFS to
const addVehiclesToMqttFS = async (user_uuid, featureset_data) => {
  const connection = await pool.getConnection();
  try {
    const updatedAt = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const getVehicles = `SELECT iot FROM vehicles WHERE user_uuid=?`;
    const [deviceIDs] = await connection.execute(getVehicles, [user_uuid]);

    for (const device of deviceIDs) {
      const insertQuery = `
        INSERT INTO mqttfeatureset (device_id, featureset, status, created_at, modified_at)
        VALUES (?, ?, ?, ?, ?)
      `;

      const values = [
        device.iot,
        JSON.stringify(featureset_data),
        0,
        updatedAt,
        updatedAt,
      ];
      await connection.execute(insertQuery, values);
    }
    return;
  } catch (err) {
    logger.error(`Error in adding vehicles to mqttFeatureset: ${err}`);
    return;
  } finally {
    connection.release();
  }
};

const clientFeatureset = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { featureset_uuid } = req.params;
    const { featureset_data, user_uuid } = req.body;

    const updatedAt = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const editQuery =
      "UPDATE featureset SET `featureset_data`=?, `featureset_modified_at`=?, `featureset_modified_by`=? WHERE `featureset_uuid`=?";

    const values = [
      JSON.stringify(featureset_data),
      updatedAt,
      user_uuid,
      featureset_uuid,
    ];

    const [results] = await connection.execute(editQuery, values);

    if (results.affectedRows > 0) {
      DeleteVehiclesFromVehiFS(user_uuid);
      addVehiclesToMqttFS(user_uuid, featureset_data);

              //await notification(values);
              var NotificationValues = "Successfully featureset updated and related records deleted";
              await save_notification(NotificationValues, user_uuid);

      res.status(200).send({
        message: "Successfully featureset updated and related records deleted",
        updatedRows: results.affectedRows,
      });
    } else {
      res.status(404).send({
        message: "No matching featureset found for the given ID",
      });
    }
  } catch (err) {
    logger.error(`Error in updating featureset: ${err}`);
    res
      .status(500)
      .send({ message: "Error in updating featureset", error: err });
  } finally {
    connection.release();
  }
};

//delete featureset api
const deleteFeatureset = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { featureset_uuid } = req.params;

    const { user_uuid } = req.body;

    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");
    const deleteQuery =
      "UPDATE featureset SET featureset_status=?,featureset_modified_at=?,featureset_modified_by=? WHERE featureset_uuid=?";

    const values = [0, currentTimeIST, user_uuid, featureset_uuid];

    const [results] = await connection.execute(deleteQuery, values);

  //await notification(values);
   var NotificationValues = "Successfully featureset deleted";
   await save_notification(NotificationValues, user_uuid);

    if (results) {
      res
        .status(200)
        .send({ message: "Successfully featureset deleted", results });
    }
  } catch (err) {
    logger.error(`Error in deleting the featureset: ${err}`);
    res
      .status(500)
      .send({ message: "Error in deleting the featureset", error: err });
  } finally {
    connection.release();
  }
};

//get list of all featureset
const getAllFeatureset = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const getQuery =
      "SELECT * FROM featureset WHERE featureset_status!=? ORDER BY featureset_id DESC";

    const [results] = await connection.execute(getQuery, [0]);

    if (results) {
      res.status(200).send({
        message: "Successfully got list of all featureset",
        results,
      });
    }
  } catch (err) {
    logger.error(`Error in getting the FeaturesetList: ${err}`);
    res
      .status(500)
      .send({ message: "Error in getting the FeaturesetList", error: err });
  } finally {
    connection.release();
  }
};

//get data of particular featureset
const getFeatureset = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { featureset_uuid } = req.params;

    const getQuery = "SELECT * FROM featureset WHERE featureset_uuid=? ";

    const [results] = await connection.execute(getQuery, [featureset_uuid]);

    if (results) {
      res.status(200).send({
        message: "Successfully got the featureset",
        totalCount: results.length,
        results,
      });
    }
  } catch (err) {
    logger.error(`Failed to get featureset: ${err}`);
    res.status(500).send({ message: "Failed to get featureset", error: err });
  } finally {
    connection.release();
  }
};

//get list of featuresets which are assign to particular user
const getFeaturesetOFUser = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { user_uuid } = req.params;
    const getQuery = "SELECT * FROM featureset WHERE featureset_status = ?";
    const [results] = await connection.execute(getQuery, [1]);

    if (results) {
      const matchingFeaturesets = [];

      for (const result of results) {
        const featuresetUsers = JSON.parse(result.featureset_users);

        // Check if any object in the featuresetUsers array has the desired user_uuid
        const userFound = featuresetUsers.some(
          (userObj) => userObj.user_uuid === user_uuid
        );

        if (userFound) {
          matchingFeaturesets.push({
            featureset_uuid: result.featureset_uuid,
            featureset_name: result.featureset_name,
            featureset_data: result.featureset_data,
          });
        }
      }

      res.status(200).send({
        message: "Successfully retrieved user's featuresets",
        totalCount: matchingFeaturesets.length,
        results: matchingFeaturesets,
      });
    } else {
      res.status(404).send({
        message: "No matching featuresets found for the user",
      });
    }
  } catch (err) {
    logger.error(`Error in getting featureset of user: ${err}`);
    res
      .status(500)
      .send({ message: "Error in getting featureset of user", error: err });
  } finally {
    connection.release();
  }
};

//get list of users which are not assign to featureset
const getAssignUsers = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { featureset_uuid } = req.params;

    const getusers =
      "SELECT user_uuid FROM users WHERE user_status=? AND user_type=?";

    const [allusers] = await connection.execute(getusers, [1, 2]);

    const getFeaturesetUsers =
      "SELECT featureset_users FROM featureset WHERE featureset_uuid=?";

    const [featuresetUsers] = await connection.execute(getFeaturesetUsers, [
      featureset_uuid,
    ]);

    const assignusers = JSON.parse(featuresetUsers[0].featureset_users);
    const mapassignusers = assignusers.map((el) => el.user_uuid);
    const unassignuserslist = allusers.filter(
      (item) => !mapassignusers.includes(item.user_uuid)
    );

    if (unassignuserslist) {
      res.status(200).send({
        message: "Successfully got list of all users",
        results: unassignuserslist,
      });
    }
  } catch (err) {
    logger.error(`Failed to get list of users: ${err}`);
    res
      .status(500)
      .send({ message: "Failed to get list of users", error: err });
  } finally {
    connection.release();
  }
};

const getUnassignUsers = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { featureset_uuid } = req.params;

    const getQuery =
      "SELECT featureset_users FROM featureset WHERE featureset_uuid=?";

    const [results] = await connection.execute(getQuery, [featureset_uuid]);

    const unassignusers = JSON.parse(results[0].featureset_users);

    if (unassignusers) {
      res.status(200).send({
        message: "Successfully got list of assin users",
        results: unassignusers,
      });
    }
  } catch (err) {
    logger.error(`Failed to get unassign users list: ${err}`);
    res
      .status(500)
      .send({ messsage: "Failed to get unassign users list", error: err });
  } finally {
    connection.release();
  }
};

const assignuser = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { featureset_uuid } = req.params;
    const { featureset_user } = req.body;

    const getQuery =
      "SELECT featureset_users FROM featureset WHERE featureset_uuid = ?";

    const [getusers] = await connection.execute(getQuery, [featureset_uuid]);

    const assignedUsers = JSON.parse(getusers[0].featureset_users);

    assignedUsers.push(featureset_user);

    const updateQuery =
      "UPDATE featureset SET featureset_users = ? WHERE featureset_uuid = ?";

    const addedusers = [JSON.stringify(assignedUsers), featureset_uuid];

    await connection.execute(updateQuery, addedusers);

      //await notification(values);
  //  var NotificationValues = "Successfully featureset deleted";
  //  await save_notification(NotificationValues, user_uuid);

    if (addedusers) {
      res.status(200).send({
        message: "User assigned successfully",
        results: assignedUsers,
      });
    }
  } catch (err) {
    logger.error(`Failed to assign user: ${err}`);
    res.status(500).send({ message: "Failed to assign user", error: err });
  } finally {
    connection.release();
  }
};

const unassignuser = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { featureset_uuid } = req.params;
    const { featureset_user } = req.body;

    const getQuery =
      "SELECT featureset_users FROM featureset WHERE featureset_uuid = ?";

    const [getusers] = await connection.execute(getQuery, [featureset_uuid]);

    const assignedUsers = JSON.parse(getusers[0].featureset_users);

    const newlist = assignedUsers.filter(
      (item) => item.user_uuid !== featureset_user.user_uuid
    );

    const unassignQuery =
      "UPDATE featureset SET featureset_users=? WHERE featureset_uuid=?";

    const values = [JSON.stringify(newlist), featureset_uuid];

    await connection.execute(unassignQuery, values);

    if (newlist) {
      res
        .status(200)
        .send({ message: "User unassigned successfully", results: newlist });
    }
  } catch (err) {
    logger.error(`Failed to unassign user: ${err}`);
    res.status(500).send({ message: "Failed to unassign user", error: err });
  } finally {
    connection.release();
  }
};

module.exports = {
  addFeatureset,
  editFeatureset,
  clientFeatureset,
  deleteFeatureset,
  getAllFeatureset,
  getFeaturesetOFUser,
  getFeatureset,
  getAssignUsers,
  getUnassignUsers,
  assignuser,
  unassignuser,
};
