const nodemailer = require("nodemailer");
const logger = require("../logger");
const pool = require("../config/db");

async function sendEmail(email, values) {
  const connection = await pool.getConnection();
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME_NOREPLY,
        pass: process.env.EMAIL_USERNAME_NOREPLY_PASS,
      },
    });

    const msg = {
      from: process.env.EMAIL_USERNAME_NOREPLY,
      to: email,
      subject: "Testing",
      html: `<h3>This message is for testing purposes only. Please ignore it.</h3><h1 style='font-weight:bold;'>${values}</h1>`,
    };

    await transporter.sendMail(msg);
  } catch (error) {
    logger.error("sendEmail error:", error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { sendEmail };
