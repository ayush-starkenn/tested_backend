const mysql = require("mysql2/promise");
const logger = require("../logger");
const redis = require('redis');
const client = redis.createClient();
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Add a listener for the 'connection' event
pool.on("connection", (connection) => {
  logger.info("Database connected");
  connection.on("end", () => {
    console.log("Database connection released");
  });
});

// Add a listener for the 'error' event
pool.on("error", (err) => {
  logger.error(`Database error: ${err}`);
});

module.exports = pool;