const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../logger");
const pool = require("../../config/db");
const express = require("express");
const bodyParser = require("body-parser");
//const io = require("../SocketConnection/SocketConn");

const app = express();
 
// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// saving the notification in database
async function save_notification(NotificationValues,user_uuid)  {
  const connection = await pool.getConnection();
  // latest time function
try{
  const newUuid = uuidv4();
  let contact_created_at = new Date();
  let currentTimeIST = moment
    .tz(contact_created_at, "Asia/Kolkata")
    .format("YYYY-MM-DD HH:mm:ss");

 
  console.log(NotificationValues);
  const queries = `INSERT INTO notifications (notification_uuid , user_uuid, content , notification_status, notification_created_at, notification_created_by ) VALUES ( ? , ? , ? , ? , ? , ? )`;

    const [NotificationResult] = await connection.execute(queries, [
      newUuid,
      user_uuid,
      NotificationValues,
      0,
      currentTimeIST,
      user_uuid,
    ]);
    console.log(NotificationResult);

    // set the socket.io
   // const data = `${NotificationValues[2]} : by ${NotificationValues[1]} at time : ${currentTimeIST}`;

   // io.emit("123", data);
  } catch (error) {
    console.log("Error in notification:", error);
    logger.error("notification error:", error);
    // Handle the error appropriately, such as sending an alert or retrying.
  } finally {
    connection.release();
  }
}

// creating the get all notification function
const get_all_notifications = async (req, res) => {
  const connection = await pool.getConnection();

  try {
  const { user_uuid } = req.params;

  const queries = `SELECT * FROM notifications WHERE user_uuid = ? ORDER BY notification_id DESC`;

    const [results] = await connection.execute(queries, [user_uuid]);

    res.send(results);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// modifying all the notifications
const update_all_notifications = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { user_uuid } = req.params;
    const query = 'UPDATE notifications SET notification_status = ? WHERE user_uuid = ?';
    const [results] = await connection.execute(query, [1, user_uuid]);
    
    res.send(results);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Update only Single Notification
 const update_notifications = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { notification_uuid } = req.params;
    const query = 'UPDATE notifications SET notification_status = ? WHERE notification_uuid = ?';
    const [results] = await connection.execute(query, [1, notification_uuid]);
    
    res.send(results);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

module.exports = {
  save_notification,
  get_all_notifications,
  update_notifications,
  update_all_notifications};