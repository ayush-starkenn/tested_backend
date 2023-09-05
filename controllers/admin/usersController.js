const pool = require("../../config/db");
const logger = require("../../logger");
const express = require("express");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const { sendEmail } = require("../../middleware/mailer");
const { sendWhatsappMessage } = require("../../middleware/whatsapp");

const app = express();

// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Login user
exports.Login = async (req, res) => {
  // Connection to DB
  const connection = await pool.getConnection();
  try {
    const { email, password } = req.body;

    // Check if the user with the given email exists in the database
    const [userRows] = await connection.execute(
      "SELECT * FROM users WHERE user_status = ? AND email = ?",

      [1, email]
    );
    const user = userRows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    // Compare the provided password with the hashed password stored in the database
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    // Generate JWT Token
    const token = await jwt.sign(
      { userId: user.user_uuid, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      user: {
        user_uuid: user.user_uuid,
        email: user.email,
        user_type: user.user_type,
      },
      token: token,
    });
  } catch (err) {
    logger.error("Login error:", err);
    res.status(500).send({ message: "Error in Login" });
  } finally {
    connection.release();
  }
};

// Signup or create new customer/user
exports.Signup = async (req, res) => {
  // Connection to DB
  const connection = await pool.getConnection();
  try {
    const {
      userUUID,
      first_name,
      last_name,
      email,
      password,
      user_type,
      company_name,
      address,
      state,
      city,
      pincode,
      phone,
    } = req.body;

    // Hash the password. You can adjust the salt rounds (10) as needed
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure pincode and phone are numeric values. Regular expression to check if a string contains only numbers
    const isNumeric = (value) => /^\d+$/.test(value);

    if (!isNumeric(pincode) || !isNumeric(phone)) {
      return res
        .status(400)
        .json({ message: "Pincode and phone must be numeric values." });
    }

    const checkIfExists = async (connection, column, value) => {
      const [rows] = await connection.execute(
        `SELECT ${column} FROM users WHERE ${column} = ?`,
        [value]
      ); 

      return rows.length > 0;
    };

    // Check Email Already Exist
    const emailExists = await checkIfExists(connection, "email", email);
    if (emailExists) {
      return res.status(409).json({ message: "This email id already exists!" });
    }

    // Check Phone Number Already Exist
    const phoneExists = await checkIfExists(connection, "phone", phone);
    if (phoneExists) {
      return res
        .status(409)
        .json({ message: "This Phone Number Already Used" });
    }

    // Generate current time in Asia/Kolkata timezone
    const currentTimeIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const addQuery =
      "INSERT INTO users(`user_uuid`,`first_name`,`last_name`,`email`,`password`,`user_type`,`company_name`,`address`,`state`,`city`,`pincode`,`phone`,`user_status`,`created_at`,`created_by`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    // Generate a new UUID
    const user_uuid = uuidv4();

    const values = [
      user_uuid,
      first_name,
      last_name,
      email,
      hashedPassword,
      user_type,
      company_name,
      address,
      state,
      city,
      pincode,
      phone,
      parseInt(1),
      currentTimeIST,
      userUUID,
    ];

    // console.log(values);
    const [results] = await connection.execute(addQuery, values);

    // Send OTP on Email
    await sendEmail(email, values);
    await sendWhatsappMessage(phone);

    res.status(201).json({ message: "Customer Added Successfully!", results });
  } catch (err) {
    logger.error("Error adding customers:", err);
    res.status(500).send({ message: "Error in Add Customer" });
  } finally {
    connection.release();
  }
};

// Get all customers details [admin]
exports.getCustomers = async (req, res) => {
  // Connection To the Database
  const connection = await pool.getConnection();
  try {
    const getQuery =
      "SELECT * FROM users WHERE user_status = ? AND user_type = ? ORDER BY user_id DESC";
    const [customers] = await connection.execute(getQuery, [1, 2]);

    res
      .status(200)
      .send({ total_count: customers.length, customerData: customers });
  } catch (err) {
    logger.error("Error in fetching the list of Customers");
    res
      .status(500)
      .send({ message: "Error in fetching the list of Customers" });
  } finally {
    connection.release();
  }
};

// Update customer
exports.updateCustomers = async (req, res) => {
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

    // Generate current time in Asia/Kolkata timezone
    const currentTimeIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

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
        } else  
        if (result.length > 0) {
            return res.status(400).send({ message: "User already exists with the provided email or mobile" });
          }

    const updateQuery =
      "UPDATE users SET first_name=?, last_name=?, email=?, company_name=?, address=?, state=?, city=?, pincode=?, phone=?, modified_at=?, modified_by = ? WHERE user_uuid=?";
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
      currentTimeIST,
      userUUID,
      user_uuid,
    ];

    const [results] = await connection.execute(updateQuery, values);

    // Send OTP on Email
    await sendEmail(email, values);

    res
      .status(201)
      .json({ message: "User updated successfully", customerData: results });
  } catch (err) {
    logger.error("Error updating user:", err);
    res.status(500).send({ message: "Error in updating user" });
  } finally {
    connection.release();
  }
};

// Get customer details by customer ID
exports.GetCustomerById = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { user_uuid } = req.params;

    const getCustomer =
      "SELECT * FROM users WHERE user_status=? AND user_uuid=?";

    const [results] = await connection.execute(getCustomer, [1, user_uuid]);

    res
      .status(200)
      .send({ message: "Customer Get successfully", customerData: results });
  } catch (err) {
    logger.error(`Error in fetching customer data. Error-> ${err}`);
    res.status(500).send("Error in fetching Customer");
  } finally {
    connection.release();
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  //connection to database
  const connection = await pool.getConnection();
  try {
    const { userUUID } = req.body;
    const { user_uuid } = req.params;

    //creating current date and time
    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss ");

    const deleteQuery =
      "UPDATE users SET user_status=?, modified_at=?, modified_by=? WHERE user_uuid=?";

    const [results] = await connection.execute(deleteQuery, [
      0,
      currentTimeIST,
      userUUID,
      user_uuid,
    ]);
    // // Send OTP on Email
    // await sendEmail(email, values);
    res.status(200).send({ message: "Customer deleted successfully", results });
  } catch (err) {
    logger.error("Error updating user:", err);
    res.status(500).send({ message: "Error in deleting the Customer" });
  } finally {
    connection.release();
  }
};

// Logout
exports.Logout = async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token not provided" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Validate the user ID
    const user_uuid = decodedToken.user_uuid;

    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    logger.error("Logout error:", err);
    return res.status(500).json({ message: "Error in Logout" });
  }
};

exports.ResetPassword = async (req, res) => {
  //connection to database
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
    connection.release();
  }
};

// Get total customers [admin]
exports.getTotalCustomers = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE user_status != ? AND user_type != ?",
      [0, 1]
    );
    res.status(200).json({
      message: "Successfully fetched the total customers data",
      result,
    });
  } catch (error) {
    logger.error(`Unable of fetched the total customers data ${error}`);
    res
      .status(501)
      .json({ message: "Unable to fetched the total customers data" });
  } finally {
    connection.release();
  }
};

exports.ForgotPasswordOTP = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { email } = req.body;
    const { user_uuid } = req.params;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Send OTP on Email
    await sendEmail(email, otp);

    await connection.execute("UPDATE users SET otp = ? WHERE user_uuid = ?", [
      otp,
      user_uuid,
    ]);
    //let expiry = Date.now() + 60 * 1000 * 15;
    //user_uuid.resetPasswordToken = otp;
    // user_uuid.resetPasswordExpires = expiry;

    res.status(200).json({ message: "OTP generated " });
  } catch (err) {
    logger.error("Forgot password error:", err);
    res.status(500).json({ message: "An error occurred." });
  } finally {
    connection.release();
  }
};

exports.ForgotPasswordOTPVerify = async (req, res) => {
  // Connection to database
  const connection = await pool.getConnection();
  try {
    const { user_uuid } = req.params;
    const { otp } = req.body;

    const [userRows] = await connection.execute(
      "SELECT otp FROM users WHERE user_uuid = ?",
      [user_uuid]
    );
    // Check User Exists in DataBase
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const storedOTP = userRows[0].otp;
    // const expiry = new Date(userRows[0].resetPasswordExpires).getTime();

    // Check Enter OTP and Exists OTP same
    if (otp != storedOTP) {
      return res.status(401).json({ message: "Invalid OTP " });
    }

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (err) {
    logger.error("Verify OTP error:", err);
    res.status(500).json({ message: "An error occurred." });
  } finally {
    connection.release();
  }
};

exports.ForgotPasswordChange = async (req, res) => {
  // Connection to database
  const connection = await pool.getConnection();
  try {
    const { password } = req.body;
    const { user_uuid } = req.params;

    // Encrypted Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Password Change Time
    const currentTimeIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const updatePasswordQuery =
      "UPDATE users SET password=?, modified_at=?, modified_by=?  WHERE user_uuid=?";

    const values = [hashedPassword, currentTimeIST, user_uuid, user_uuid];

    const [results] = await connection.execute(updatePasswordQuery, values);

    res
      .status(200)
      .json({ message: "User Password Change Successfully", results });
  } catch (err) {
    logger.error("Error updating user password:", err);
    res.status(500).send({ message: "Error in updating user password" });
  } finally {
    connection.release();
  }
};
