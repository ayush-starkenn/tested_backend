const pool = require("../../config/db");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../logger.js");

const addDriver = async (req, res) => {
    try {
        // Connection to the database
        const connection = await pool.getConnection();

        const { user_uuid } = req.params;
  
    const {
     // user_uuid,
      driver_first_name,
      driver_last_name,
      driver_email,
      driver_mobile,
      driver_dob,
      driver_gender,
      driver_auth_id,
      driver_license_no,
    } = req.body;
 
        
  
    const newUuid = uuidv4();
  
    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss ");
  
   
      const checkQuery =
        `SELECT * FROM drivers WHERE driver_mobile = ? OR driver_license_no = ? OR driver_email = ?` ;
  
      const [checkresults] = await connection.execute(checkQuery, [driver_mobile, driver_license_no, driver_email]);
  
      if (checkresults.length > 0) {
        return res
        .status(400)
        .send({ message: "Drivers mobile number and License and Email already exits" });
      } 

      const addQuery =
        "INSERT INTO drivers(`driver_uuid`,`user_uuid`,`driver_first_name`,`driver_last_name`,`driver_email`,`driver_mobile`,`driver_dob`,`driver_gender`,`driver_auth_id`,`driver_license_no`,`driver_status`,`driver_created_at`,`driver_created_by`,`driver_modified_at`,`driver_modified_by`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
  
      const values = [
        newUuid,
        user_uuid,
        driver_first_name,
        driver_last_name,
        driver_email,
        driver_mobile,
        driver_dob,
        driver_gender,
        driver_auth_id,
        driver_license_no,
        parseInt(1),
        currentTimeIST,
        user_uuid,
        currentTimeIST,
        user_uuid,
      ];
        const [results] = await connection.execute(addQuery, values);
      
        res.status(201).json({
            message: "Driver added successfully",
            totalCount: results.length,
            results,
          });
      
          connection.release();
        } catch (err) {
          logger.error(`Error in adding Driver: ${err}`);
          res.status(500).json({ message: "Internal server error" });
        }
};
  
const editDriver = async (req, res) => {
    try {
    const {
      driver_first_name,
      driver_last_name,
      driver_email,
      driver_mobile,
      driver_dob,
      driver_gender,
      driver_auth_id,
      driver_license_no,
    } = req.body;
  
    const { driver_uuid } = req.params;

      // Connection to the database
      const connection = await pool.getConnection();

  
    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss ");
  
   
      const checkQuery =
      `SELECT * FROM drivers WHERE (driver_mobile = ? OR driver_license_no = ? OR driver_email = ?) AND driver_uuid != ?` ;

    const [checkresults] = await connection.execute(checkQuery, [
        driver_mobile, 
        driver_license_no, 
        driver_email, 
        driver_uuid]);

    if (checkresults.length > 0) {
      return res
      .status(400)
      .send({ message: "Drivers mobile number and License and Email already exits" });
    } 
      const editQuery =
        "UPDATE drivers SET driver_first_name=?,driver_last_name=?,driver_email=?,driver_mobile=?,driver_dob=?,driver_gender=?,driver_auth_id=?,driver_license_no=?,driver_modified_at=?,driver_modified_by=? WHERE driver_uuid=?";
  
      const values = [
        driver_first_name,
        driver_last_name,
        driver_email,
        driver_mobile,
        driver_dob,
        driver_gender,
        driver_auth_id,
        driver_license_no,
        currentTimeIST,
        
        req.body.user_uuid,
        driver_uuid,
      ];
  

      const  [results] = await connection.execute(editQuery, values);
  
        res.status(201).send({
          message: "Successfully driver updated",
          totalCount: results.length,
          results,
        });
      
        connection.release();
    } catch (err) {
      logger.error(`Error in adding Driver: ${err}`);
      res.status(500).json({ message: "Internal server error" });
    }
};
  
const deleteDriver = async (req, res) => {
    try {
    const { driver_uuid } = req.params;
    const { user_uuid } = req.body;
  
      //connection to database
    const connection = await pool.getConnection();
  
    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss ");
  
  
      const deleteQuery =
        "UPDATE drivers SET driver_status=?, driver_modified_at=?,driver_modified_by=? WHERE driver_uuid=?";
  
      const [results] = await connection.execute(deleteQuery, [
        0,
        currentTimeIST,
        user_uuid,
        driver_uuid,
      ]);
      res.status(201).send({
        message: "Successfully driver deleted",
        totalCount: results.length,
        results,
      });
     connection.release();
    } catch (err) {
      logger.error(`Error in deleting the Contacts ${err}`);
      res
        .status(500)
        .send({ message: "Error in deleting the contacts", Error: err });
    }
};
  
const getUsersDrivers = async (req, res) => {
     try {
    const { user_uuid } = req.params;
  
    const connection = await pool.getConnection();
  
   
      const getQuery =
        "SELECT * FROM drivers WHERE user_uuid=? AND driver_status=? ORDER BY driver_created_at DESC";
  
      const [results] = await connection.execute(getQuery, [user_uuid, 1]);
  
      res.status(200).send({
        message: "Successfully got all drivers list",
        totalCount: results.length,
        results,
      });
      connection.release();
    } catch (err) {
      logger.error(`Error in getting data, Error: ${err} `);
      res.status(500).send({ message: "Error in data", Error: err });
    }
};


module.exports = { addDriver, editDriver, deleteDriver, getUsersDrivers };
  