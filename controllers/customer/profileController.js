const express = require("express");
const app = express();
const pool = require("../../config/db");
const logger = require("../../logger.js");
const bcrypt = require("bcryptjs");

const moment = require("moment-timezone");
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { sendEmail } = require("../../middleware/mailer");

exports.getProfile = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { user_uuid } = req.params;

    const query = "SELECT * FROM users WHERE user_uuid = ? AND user_status = ?";

    const [results] = await connection.execute(query, [user_uuid, 1]);

    if (results.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    res.status(200).send({
      message: "Succesfully Get User Profile",
      results,
    });
  } catch (err) {
    logger.error(`Error in getting the user profile, Error: ${err} `);
    res.status(500).send({
      message: "An error occurred while fetching profile",
      Error: err,
    });
  } finally {
    connection.release();
  }
};

exports.updateProfile = async (req, res) => {
  // Connection to the database
  const connection = await pool.getConnection();
  try {
    const {
      first_name,
      last_name,
      email,
      company_name,
      address,
      state,
      city,
      pincode,
      phone,
      user_status,
      userUUID,
    } = req.body;

    const { user_uuid } = req.params;

    // Ensure pincode and phone are numeric values
    const isNumeric = (value) => /^\d+$/.test(value);

    if (!isNumeric(pincode) || !isNumeric(phone)) {
      return res
        .status(400)
        .json({ message: "Pincode and phone must be numeric values." });
    }

    // Check if user exists
    const [existingUserRows] = await connection.execute(
      "SELECT * FROM users WHERE user_uuid = ?",
      [user_uuid]
    );
    // Check if the updated email or mobile already exist for another contact
    const queriesToGet = `
      SELECT * FROM users WHERE (email = ? OR phone= ?) AND user_uuid != ?`;

    const [result] = await connection.execute(queriesToGet, [
      email,
      phone,
      user_uuid,
    ]);
    if (existingUserRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    } else if (result.length > 0) {
      return res.status(400).send({
        error: "Contact already exists with the provided email or mobile",
      });
    }

    // Generate current time in Asia/Kolkata timezone
    const currentTimeIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

      const updateQuery =
      "UPDATE users SET first_name=?, last_name=?, email=?, company_name=?, address=?, state=?, city=?, pincode=?, phone=?, user_status=?, modified_at=?, modified_by = ? WHERE user_uuid=?";
    const values = [
      first_name,
      last_name,
      email,
      company_name,
      address,
      state,
      city,
      pincode,
      phone,
      user_status,
      currentTimeIST,
      userUUID,
      user_uuid,
    ];

    const [results] = await connection.execute(updateQuery, values);

    // Send OTP on Email
    await sendEmail(email, values);

    res
      .status(202)
      .json({ message: "User updated successfully", customerData: results });
  } catch (err) {
    logger.error("Error updating user:", err);
    res.status(500).send({ message: "Error in updating user" });
  } finally {
    connection.release();
  }
};

exports.changePassword = async (req, res) => {
  // Connection to the database
  const connection = await pool.getConnection();

  try {
    const { user_uuid } = req.params;
    const { oldPassword, newPassword } = req.body;

    // Get user information
    const [userRows] = await connection.execute(
      "SELECT * FROM users WHERE user_uuid = ?",
      [user_uuid]
    );
    // Check User Exists in DataBase
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userRows[0].password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Old password is incorrect." });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await connection.execute(
      "UPDATE users SET password = ? WHERE user_uuid = ?",
      [hashedNewPassword, user_uuid]
    );

    res.status(200).json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "An error occurred." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
