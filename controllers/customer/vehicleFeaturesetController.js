const { v4: uuidv4 } = require("uuid");
const moment = require("moment-timezone");
const pool = require("../../config/db.js");
const logger = require("../../logger.js");

const { sendEmail } = require("../../middleware/mailer");
const { save_notification } = require("../customer/notifiController");
//const { sendWhatsappMessage } = require("../../middleware/whatsapp");
const addVehiclesToMqttFS = async (vehicle_uuid, featureset_data) => {
  const connection = await pool.getConnection();
  try {
    const parsedFS = JSON.parse(featureset_data);

    const updatedFS = parsedFS.featureset_data;

    const updatedAt = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    const getVehicleIOT = `SELECT iot FROM vehicles WHERE vehicle_uuid=?`;
    const [iotRow] = await connection.execute(getVehicleIOT, [vehicle_uuid]);

    if (iotRow.length === 0 || !iotRow[0].iot) {
      console.log("No valid device (iot) found for the vehicle.");
      return;
    }
    const iot = iotRow[0].iot;

    // Check if the device (iot) already exists in mqttfeatureset
    const checkQuery = `SELECT device_id FROM mqttfeatureset WHERE device_id = ?`;
    const [checkResult] = await connection.execute(checkQuery, [iot]);

    let now = new Date();
    let timestamp = Math.floor(now.getTime() / 1000);

    let FormatedMSG = {
      message: 105,
      timestamp: timestamp,
      data: {
        sys: { mode: parseInt(updatedFS.mode) },
        cas: {
          sts: parseInt(updatedFS.CASMode),
          act_spd: parseInt(updatedFS.activationSpeed),
          brk_spd: parseInt(updatedFS.brakeSpeed),
          stat_obj_sts: parseInt(updatedFS.detectStationaryObject),
          full_brk_sts: parseInt(updatedFS.allowCompleteBrake),
          oncm_obj_sts: parseInt(updatedFS.detectOncomingObstacle),
          cas_mode: parseInt(updatedFS.safetyMode),
          alrm_th: parseInt(updatedFS.alarmThreshold),
          brk_th: parseInt(updatedFS.brakeThreshold),
          ttc_th: parseInt(updatedFS.ttcThreshold),
          brk_on_time: parseInt(updatedFS.brakeOnDuration),
          brk_off_time: parseInt(updatedFS.brakeOffDuration),
          start_tm: parseInt(updatedFS.start_time),
          stop_tm: parseInt(updatedFS.stop_time),
        },
        sa: {
          sts: parseInt(updatedFS.sleepAlertMode),
          pre_warn: parseInt(updatedFS.preWarning),
          brk_sts: parseInt(updatedFS.braking),
          intvl: parseInt(updatedFS.sleepAlertInterval),
          spd: parseInt(updatedFS.sa_activationSpeed),
          start_tm: parseInt(updatedFS.startTime),
          stop_tm: parseInt(updatedFS.stopTime),
          brk_tm: parseInt(updatedFS.brakeActivateTime),
        },
        de: {
          sts: parseInt(updatedFS.driverEvalMode),
          ln_ch_th1: parseInt(updatedFS.maxLaneChangeThreshold),
          ln_ch_th2: parseInt(updatedFS.minLaneChangeThreshold),
          h_acc_th1: parseInt(updatedFS.maxHarshAccelerationThreshold),
          h_acc_th2: parseInt(updatedFS.minHarshAccelerationThreshold),
          s_brk_th1: parseInt(updatedFS.suddenBrakingThreshold),
          s_bmp_th1: parseInt(updatedFS.maxSpeedBumpThreshold),
          s_bmp_th2: parseInt(updatedFS.minSpeedBumpThreshold),
        },
        spd_gov: {
          sts: parseInt(updatedFS.GovernerMode),
          limit: parseInt(updatedFS.speedLimit),
        },
        cruz: {
          sts: parseInt(updatedFS.cruiseMode),
          act_spd: parseInt(updatedFS.cruiseactivationSpeed),
          veh_typ: parseInt(updatedFS.vehicleType),
        },
        obd: {
          sts: parseInt(updatedFS.obdMode),
          proto_no: parseInt(updatedFS.protocolType),
        },
        tpms: { sts: parseInt(updatedFS.tpmsMode) },
        veh_set: { acc_type: parseInt(updatedFS.acceleratorType) },
        sensor: {
          rdr_sts: parseInt(updatedFS.rfSensorMode),
          ldr_sts: parseInt(updatedFS.lazerMode),
          rdr_angl: parseInt(updatedFS.rfAngle),
          rdr_act_spd: parseInt(updatedFS.rdr_act_spd),
          rs1: parseInt(updatedFS.rdr_type),
          rs2: parseInt(updatedFS.Sensor_res1),
        },
        spd_sett: {
          src: parseInt(updatedFS.speedSource),
          slope: parseInt(updatedFS.slope),
          offset: parseInt(updatedFS.offset),
        },
        sht_dwn_tm: { delay: parseInt(updatedFS.delay) },
        rfid: { sts: parseInt(updatedFS.rfNameMode) },
        fota: {
          sts: parseInt(updatedFS.firmwareOtaUpdate),
          rs1: parseInt(updatedFS.firewarereserver1),
          rs2: parseInt(updatedFS.firewarereserver2),
        },
        alcohol: {
          sts: parseInt(updatedFS.alcoholDetectionMode),
          intvl: parseInt(updatedFS.alcoholinterval),
          start_tm: parseInt(updatedFS.alcoholstart_time),
          stop_tm: parseInt(updatedFS.alcoholstop_time),
          mode: parseInt(updatedFS.alcoholmode),
          act_spd: parseInt(updatedFS.alcoholact_spd),
        },
        dd: {
          sts: parseInt(updatedFS.driverDrowsinessMode),
          acc_cut_sts: parseInt(updatedFS.dd_acc_cut),
          act_spd: parseInt(updatedFS.dd_act_spd),
          start_tm: parseInt(updatedFS.dd_strt_tim),
          stop_tm: parseInt(updatedFS.dd_stop_tim),
          rs1: parseInt(updatedFS.dd_res1),
        },
        temp: { sts: 0, thrshld: 0, rs1: 0 },
        err_tim: {
          no_alrm: parseInt(updatedFS.noAlarm),
          spd: parseInt(updatedFS.speed),
          acc_byps: parseInt(updatedFS.accelerationBypass),
          tpms: parseInt(updatedFS.tim_err_tpms),
        },
        err_spd: {
          rdr: parseInt(updatedFS.rfSensorAbsent),
          gyro: parseInt(updatedFS.gyroscopeAbsent),
          hmi: parseInt(updatedFS.hmiAbsent),
          rtc: parseInt(updatedFS.timeNotSet),
          brake_cyl: parseInt(updatedFS.brakeError),
          tpms: parseInt(updatedFS.tpmsError),
          obd: parseInt(updatedFS.obdAbsent),
          no_alarm: parseInt(updatedFS.noAlarmSpeed),
          ldr: parseInt(updatedFS.laserSensorAbsent),
          rfid: parseInt(updatedFS.rfidAbsent),
          iot: parseInt(updatedFS.iotAbsent),
          acc_board: parseInt(updatedFS.acc_board),
          dd: parseInt(updatedFS.SBE_dd),
          alcohol: parseInt(updatedFS.SBE_alcohol),
          temp: parseInt(updatedFS.SBE_temp),
        },
        lds: {
          sts: parseInt(updatedFS.load_sts),
          max_cap: parseInt(updatedFS.load_max_cap),
          acc: parseInt(updatedFS.load_acc),
        },
        fuel: {
          sts: parseInt(updatedFS.fuelMode),
          Tank_Capacity: parseInt(updatedFS.fuel_tnk_cap),
          Interval1: parseInt(updatedFS.fuel_intvl1),
          Interval2: parseInt(updatedFS.fuel_intvl2),
          ACC_Cut: parseInt(updatedFS.fuel_acc),
          threshold: parseInt(updatedFS.fuel_thrsh),
        },
      },
    };

    if (checkResult.length > 0) {
      const updateQuery = `
        UPDATE mqttfeatureset
        SET featureset = ?,
            status = ?,
            modified_at = ?
        WHERE device_id = ?
      `;
      const updateValues = [JSON.stringify(FormatedMSG), 0, updatedAt, iot];

      await connection.execute(updateQuery, updateValues);
    } else {
      const insertQuery = `
        INSERT INTO mqttfeatureset (device_id, featureset, status, created_at, modified_at)
        VALUES (?, ?, ?, ?, ?)
      `;
      const insertValues = [
        iot,
        JSON.stringify(FormatedMSG),
        0,
        updatedAt,
        updatedAt,
      ];

      await connection.execute(insertQuery, insertValues);
    }

    return;
  } catch (err) {
    logger.error(`Error in adding vehicles to mqttFeatureset: ${err}`);
    return;
  } finally {
    connection.release();
  }
};

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
      user_uuid,
      currentTimeIST,
      user_uuid,
      currentTimeIST,
    ];

    const [results] = await connection.execute(addQuery, values);

    //await notification(values);
    var NotificationValues = "Successfully vehicle featureset added";
    await save_notification(NotificationValues, user_uuid);

    if (results) {
      addVehiclesToMqttFS(vehicle_uuid, featureset_data);
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

    //await notification(values);
    var NotificationValues = "Successsfully vehicle featureset updated";
    await save_notification(NotificationValues, user_uuid);

    if (results) {
      addVehiclesToMqttFS(vehicle_uuid, featureset_data);

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
