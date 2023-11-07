const mysql = require("mysql2/promise");
const logger = require("../logger");

require("dotenv").config();
let pool;

if (process.env.DATABASE === 'testing') {
   pool = mysql.createPool({
    host: process.env.TESTING_HOST,
    user: process.env.TESTING_USER,
    password: process.env.TESTING_PASSWORD,
    database: process.env.TESTING_DATABASE,
    port: process.env.DB_PORT || 3306, // Add a default port if not specified
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
} else {
   pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, // Add a default port if not specified
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

// Add error handling for the connection pool
pool.on("error", (err) => {
  logger.error(`Database error: ${err.message}`);
});

module.exports = pool;
