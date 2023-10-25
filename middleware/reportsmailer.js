const nodemailer = require('nodemailer');
const logger = require("../logger");
const pool = require("../config/db");
require("dotenv").config();

async function sendReportsByEmail(title, recipients, newUuid) {
  const connection = await pool.getConnection();
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME_NOREPLY,
        pass: process.env.EMAIL_USERNAME_NOREPLY_PASS,
      },
    });

    const emailBody = `
      <p>Report Title: ${title}</p>
      <p>Contacts: ${recipients.join(', ')}</p>
      <p>Click here to view your Reports: <a href="${newUuid}">${newUuid}</a></p>
    `;

    

    const mailOptions = {
      from: process.env.EMAIL_USERNAME_NOREPLY,
      to: recipients.join(', '),
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
