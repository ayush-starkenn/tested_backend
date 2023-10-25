const nodemailer = require('nodemailer');
const cron = require("node-cron");
const logger = require("../logger");
const pool = require("../config/db");
require("dotenv").config();

async function sendReportsByEmail(title,selected_vehicles,selected_events,reports_schedule_type,newUuid) {
  const connection = await pool.getConnection();
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME_NOREPLY,
        pass: process.env.EMAIL_USERNAME_NOREPLY_PASS,
      },
    });

    const emailBody = `Report Title: ${title}\nVehicles: ${selected_vehicles}\nEvents: ${selected_events}\nReports_Schedule_Type: ${reports_schedule_type}\nClick here to your Reports: <a href="${newUuid}">${newUuid}</a>`;

    const mailOptions = {
      from: process.env.EMAIL_USERNAME_NOREPLY,
      to: 'rohitshekhawat@starkenn.com',
      subject: 'Daily/Weekly Reports',
      html: emailBody,
    };

    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully");
  } catch (error) {
    console.log("Error sending email:", error);
    logger.error("sendEmail error:", error);
    // Handle the error appropriately, such as sending an alert or retrying.
  } finally {
    connection.release();
  }
} 

module.exports = { sendReportsByEmail };