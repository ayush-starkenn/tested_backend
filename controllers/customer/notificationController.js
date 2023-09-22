const { db } = require("../COnnection/db");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const io = require("../SocketConnection/SocketConn");

// saving the notification in database
const saveNotification = async (NotificationValues) => {
  // latest time function

  let contact_created_at = new Date();
  let currentTimeIST = moment
    .tz(contact_created_at, "Asia/Kolkata")
    .format("YYYY-MM-DD HH:mm:ss");

  const connection = await db();
  console.log(NotificationValues);
  const queries = `INSERT INTO notification (notification_uuid , user_uuid, notification_data , notification_status, notification_created_at, notification_created_by ) VALUES ( ? , ? , ? , ? , ? , ? )`;

  try {
    const [NotificationResult] = await connection.execute(queries, [
      NotificationValues[0],
      NotificationValues[1],
      NotificationValues[2],
      NotificationValues[3],
      currentTimeIST,
      NotificationValues[4],
    ]);
    console.log(NotificationResult);

    // set the socket.io
    const data = `${NotificationValues[2]} : by ${NotificationValues[1]} at time : ${currentTimeIST}`;

    io.emit("123", data);
  } catch (err) {
    console.log(err);
  }
};

// creating the get all notification function
const getAllNotifications = async (req, res) => {
  const { user_uuid } = req.params;
  const connection = await db();
  const queries = `SELECT * FROM notification WHERE user_uuid = ?`;
  try {
    const [results] = await connection.execute(queries, [user_uuid]);
    res.send(results);
  } catch (err) {
    res.send(err);
  } finally {
    connection.release();
  }
};

// modifying all the notifications
const updateAllNotifications = async (req, res) => {
  const { user_uuid } = req.params;
  const connection = await db();
  const queries = `UPDATE notification SET notification_status = ? WHERE user_uuid = ?`;
  try {
    const [results] = await connection.execute(queries, [1, user_uuid]);
    res.send(results);
  } catch (err) {
    res.send(err);
  } finally {
    connection.release();
  }
};

module.exports = {
  saveNotification,
  getAllNotifications,
  updateAllNotifications,
};