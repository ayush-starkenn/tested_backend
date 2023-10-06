const pool = require("../../config/db");
const logger = require("../../logger");
const express = require("express");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");

const { sendEmail } = require("../../middleware/mailer");
const { sendWhatsappMessage } = require("../../middleware/whatsapp");

const app = express();

// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


exports.getVehicle = async (req, res) => {

    const connection = await pool.getConnection();
  try {
    const { user_uuid } = req.params;
    const getQuery =
      "SELECT * FROM vehicles WHERE vehicle_status=? AND user_uuid=?";

    [results] = await connection.execute(getQuery, [1, user_uuid]);

    res.status(200).send({
      message: "Successfully got list of all vehicles",
      totalCount: results.length,
      results,
    });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Error in getting user vehicle list", Error: err });
  } finally {
    connection.release();
  }

};

exports.getAllContacts = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { user_uuid } = req.params;

    const getquery = `SELECT * FROM contacts WHERE contact_status !=0 AND user_uuid = ? ORDER BY contact_created_at DESC`;

    const [contacts] = await connection.execute(getquery, [user_uuid]);

    res.status(200).send({
      message: "Successfully Fetched List Of All Contacts",
      // totalCount: contacts.length,
      contacts,
    });
  } catch (err) {
    logger.error(`Error in getting the list, Error: ${err} `);
    res.status(500).send({
      message: "An error occurred while fetching contacts",
      Error: err,
    });
  } finally {
    connection.release();
  }
};

exports.getAllreport = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { title, selected_events, from_date, to_date, contact_uuid, selected_vehicles} = req.body;
    const { user_uuid } = req.params;

// Validate input parameters
if (
  !Array.isArray(selected_events) ||
  !from_date ||
  !to_date ||
  !title ||
  !contact_uuid ||
  !Array.isArray(selected_vehicles) || 
  selected_vehicles.length === 0
  ) {
  return res.status(400).json({ message: "Invalid request parameters" });
  }

   // Convert fromDate and toDate to Date objects and validate
   const fromDateObj = new Date(from_date);
   const toDateObj = new Date(to_date);
  
   if (isNaN(fromDateObj) || isNaN(toDateObj)) {
   return res.status(400).json({ message: "Invalid date format" });
   }
  
   // Ensure fromDate is before toDate
   if (fromDateObj >= toDateObj) {
   return res
   .status(400)
   .json({ message: "fromDate must be earlier than toDate" });
   }

   const eventPlaceholders = selected_events.map(() => "?").join(",");
   const vehiclePlaceholders = selected_vehicles.map(() => "?").join(",");
    // V - Vehicles, td - tripData, ts - trip_summary

    const query = `
    SELECT
    v.vehicle_uuid,
    v.vehicle_name,
    v.vehicle_registration,
    ts.trip_id,
    td.event AS event_type, 
    COUNT(*) AS event_count,
    td.timestamp,
    JSON_UNQUOTE(JSON_EXTRACT(td.jsondata, '$.data.alert_type')) AS alert_type,
    JSON_UNQUOTE(JSON_EXTRACT(td.jsondata, '$.message')) AS message
FROM
    vehicles v 
LEFT JOIN
    trip_summary ts ON v.vehicle_uuid = ts.vehicle_uuid
LEFT JOIN
    tripdata td ON ts.trip_id = td.trip_id
WHERE
    v.user_uuid = ? 
    AND v.vehicle_status = ? 
    AND td.created_at >= ?
    AND td.created_at <= ? 
    AND ts.trip_status = ? 
    AND td.event IN (${eventPlaceholders})
    AND v.vehicle_uuid IN (${vehiclePlaceholders})
GROUP BY
    v.vehicle_uuid,
    v.vehicle_name,
    v.vehicle_registration,
    td.event  
ORDER BY
    v.vehicle_uuid ASC

`;

    const [vehicles] = await connection.query(query, [
      user_uuid,
      1,
      fromDateObj,
      toDateObj,
      1,
      ...selected_events,
      ...selected_vehicles,
    ]);


    // Group the data by vehicle_uuid
    const groupedData = vehicles.reduce((result, row) => {
      const key = row.vehicle_uuid;
      if (!result[key]) {
        result[key] = {
          vehicle_uuid: key,
          vehicle_name: row.vehicle_name,
          vehicle_registration: row.vehicle_registration,
          events: [],
        };
      }
      if (row.trip_id) {
        result[key].events.push({
         // trip_id: row.trip_id,
          eventType: row.event_type,
          eventCount: row.event_count, 
        });
      }
      return result;
    }, {});

    // Convert the grouped data object into an array
    const tripData = Object.values(groupedData);

    res.status(200).json({
      success: true,
      message: "Successfully Get Trip Alert's",
      report_title: title,
      from_date: from_date,
      to_date: to_date,
      user_uuid: user_uuid,
      vehicles: tripData, 
    });
  } catch (err) {
    logger.error(`Error in Get Trip Alert's: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "An error occurred while  trip data alert's",
      error: err.message,
    });
  } finally {
    connection.release(); // Release the database connection
  }
};

exports.createAllreport1 = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      title,
      selected_events,
      from_date,
      to_date,
      contact_uuid,
      selected_vehicles,
      
    } = req.body;
    const {user_uuid} = req.params;

    const newUuid = uuidv4();

    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    // Validate input parameters
    if (
      !Array.isArray(selected_events) ||
      !from_date ||
      !to_date ||
      !title ||
      !contact_uuid ||
      !Array.isArray(selected_vehicles) ||
      selected_vehicles.length === 0
    ) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    // Convert fromDate and toDate to Date objects and validate
    const fromDateObj = new Date(from_date);
    const toDateObj = new Date(to_date);

    if (isNaN(fromDateObj) || isNaN(toDateObj)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Ensure fromDate is before toDate
    if (fromDateObj >= toDateObj) {
      return res
        .status(400)
        .json({ message: "fromDate must be earlier than toDate" });
    }

    const eventPlaceholders = selected_events.map(() => "?").join(",");
    const vehiclePlaceholders = selected_vehicles.map(() => "?").join(",");

    // INSERT query to add the report data into a database table
    const getQuery = `
     SELECT
        v.user_uuid,
        v.vehicle_uuid,
        td.event,
        td.timestamp
      FROM
        vehicles v
      LEFT JOIN
        trip_summary ts ON v.vehicle_uuid = ts.vehicle_uuid
      LEFT JOIN
        tripdata td ON ts.trip_id = td.trip_id
      WHERE
        v.user_uuid = ?
        AND v.vehicle_status = ?
        AND td.created_at >= ?
        AND td.created_at <= ?
        AND ts.trip_status = ?
        AND td.event IN (${eventPlaceholders})
        AND v.vehicle_uuid IN (${vehiclePlaceholders})
    `;

        // Execute the GET query
        await connection.query(getQuery, [
          user_uuid,
          1,
          fromDateObj,
          toDateObj,
          1,
          ...selected_events,
          ...selected_vehicles,
        ]);

    const insertQuery = `
    INSERT INTO reports (title, report_uuid, user_uuid, vehicles, from_date, to_date, contact_uuid, report_status, report_created_at, report_created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?);`

    // Execute the INSERT query
await connection.query(insertQuery, [
  title,
  newUuid,
  user_uuid,
  JSON.stringify(selected_vehicles), 
  from_date,
  to_date,
  contact_uuid,
  1,
  currentTimeIST,
  user_uuid
])

    res.status(200).json({
      success: true,
      message: "Report data successfully created",
      report_title: title,
      from_date: from_date,
      to_date: to_date,
      user_uuid: user_uuid,
    });
  } catch (err) {
    logger.error(`Error in creating report: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the report",
      error: err.message,
    });
  } finally {
    connection.release(); // Release the database connection
  }
};

exports.createAllreport = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      title,
      selected_events,
      from_date,
      to_date,
      contact_uuid,
      selected_vehicles,
      
    } = req.body;
    const {user_uuid} = req.params;

    const newUuid = uuidv4();

    let createdAt = new Date();
    let currentTimeIST = moment
      .tz(createdAt, "Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    // Validate input parameters
    if (
      !Array.isArray(selected_events) ||
      !from_date ||
      !to_date ||
      !title ||
      !contact_uuid ||
      !Array.isArray(selected_vehicles) ||
      selected_vehicles.length === 0
    ) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    // Convert fromDate and toDate to Date objects and validate
    const fromDateObj = new Date(from_date);
    const toDateObj = new Date(to_date);

    if (isNaN(fromDateObj) || isNaN(toDateObj)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Ensure fromDate is before toDate
    if (fromDateObj >= toDateObj) {
      return res
        .status(400)
        .json({ message: "fromDate must be earlier than toDate" });
    }

    const eventPlaceholders = selected_events.map(() => "?").join(",");
    const vehiclePlaceholders = selected_vehicles.map(() => "?").join(",");

    // INSERT query to add the report data into a database table
    const getQuery = `
    SELECT
    v.vehicle_uuid,
    v.vehicle_name,
    v.vehicle_registration,
    ts.trip_id,
    td.event AS event_type, 
    COUNT(*) AS event_count,
    td.timestamp,
    JSON_UNQUOTE(JSON_EXTRACT(td.jsondata, '$.data.alert_type')) AS alert_type,
    JSON_UNQUOTE(JSON_EXTRACT(td.jsondata, '$.message')) AS message
FROM
    vehicles v 
LEFT JOIN
    trip_summary ts ON v.vehicle_uuid = ts.vehicle_uuid
LEFT JOIN
    tripdata td ON ts.trip_id = td.trip_id
WHERE
    v.user_uuid = ? 
    AND v.vehicle_status = ? 
    AND td.created_at >= ?
    AND td.created_at <= ? 
    AND ts.trip_status = ? 
    AND td.event IN (${eventPlaceholders})
    AND v.vehicle_uuid IN (${vehiclePlaceholders})
GROUP BY
    v.vehicle_uuid,
    v.vehicle_name,
    v.vehicle_registration,
    td.event  
ORDER BY
    v.vehicle_uuid ASC
  `;

        // Execute the GET query
        const [vehicles] = await connection.query(getQuery, [
          user_uuid,
          1,
          fromDateObj,
          toDateObj,
          1,
          ...selected_events,
          ...selected_vehicles,
        ]);
        
        const groupedData = vehicles.reduce((result, row) => {
          const key = row.vehicle_uuid;
          if (!result[key]) {
            result[key] = {
              vehicle_uuid: key,
              vehicle_name: row.vehicle_name,
              vehicle_registration: row.vehicle_registration,
              events: [],
            };0
          }
          if (row.trip_id) {
            result[key].events.push({
             // trip_id: row.trip_id,
              eventType: row.event_type,
              eventCount: row.event_count, 
            });
          }
          return result;
        }, {});
    // console.log("vehicles---------",vehicles);
    // console.log("groupedData---------",groupedData);

        const insertQuery = `
        INSERT INTO reports (title, report_uuid, user_uuid, vehicles, from_date, to_date, contact_uuid, report_status, report_created_at, report_created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?);
      `;
      
      const values = [
        title,
        newUuid,
        user_uuid,
        JSON.stringify(groupedData), // Save the formatted data as a JSON string
        from_date,
        to_date,
        contact_uuid,
        1,
        currentTimeIST,
        user_uuid,
      ];
      // Execute the INSERT query
      // await connection.query(insertQuery, [
      //   title,
      //   newUuid,
      //   user_uuid,
      //   JSON.stringify(groupedData), // Save the formatted data as a JSON string
      //   from_date,
      //   to_date,
      //   contact_uuid,
      //   1,
      //   currentTimeIST,
      //   user_uuid,
      // ]);
//console.log("values-----------",values);
      const results = await connection.execute(insertQuery, values);
    //  console.log("results-----------",results);

    res.status(200).json({
      success: true,
      message: "Report data successfully created", 
     // Reports: values,
      title:title,
      from_date:from_date,
      to_date:to_date,
      user_uuid:user_uuid,
      vehicles:groupedData,
      contact_uuid:contact_uuid

    });
  } catch (err) {
    logger.error(`Error in creating report: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the report",
      error: err.message,
    });
  } finally {
    connection.release(); // Release the database connection
  }
};
