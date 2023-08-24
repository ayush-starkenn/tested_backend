const logger = require("./logger");
const express = require("express");
const pool = require("./config/db");
const setupMQTT = require("./controllers/mqttHandler");
// Import all routes
const { deviceRouter } = require("./routes/admin/deviceRoute");
const { vehiclesRouter } = require("./routes/customer/vehiclesRoute");
const { driversRouter } = require("./routes/customer/driversRoute");
const { customerRouter } = require("./routes/admin/usersRoute");
const { ATRouter } = require("./routes/admin/analyticsthresholdRoute");
const { loginRouter } = require("./routes/loginRoute");
const { authentication } = require("./middleware/authentication");
const { contactsRouter } = require("./routes/customer/contactsRoute");

const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

// Login Routes
app.use("/api", loginRouter);

app.use(authentication);

// Admin Panel Routes
app.use("/api/devices", deviceRouter);
app.use("/api/customers", customerRouter);
app.use("/api/analytics-threshold", ATRouter);

// Customer Panel Routes
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/drivers", driversRouter);

setupMQTT();

app.listen(8080, () => {
  logger.info(`App is running on port ${8080}`);
});

// process.on("SIGINT", async () => {
//   logger.info("Received SIGINT signal. Closing connection pool...");
//   try {
//     await pool.end();
//     logger.info("Connection pool closed.");
//     process.exit(0);
//   } catch (error) {
//     logger.error("Error closing connection pool:", error);
//     process.exit(1);
//   }
// });
