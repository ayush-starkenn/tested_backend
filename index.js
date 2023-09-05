const logger = require("./logger");
const express = require("express");
const pool = require("./config/db");
const setupMQTT = require("./controllers/mqttHandler");
//const  whatsappRouter = require("./middleware/whatsapp");
// Import all routes
const { deviceRouter } = require("./routes/admin/deviceRoute");
const { vehiclesRouter } = require("./routes/customer/vehiclesRoute");
const { driversRouter } = require("./routes/customer/driversRoute");
const { customerRouter } = require("./routes/admin/usersRoute");
const { ATRouter } = require("./routes/admin/analyticsthresholdRoute");
const { loginRouter } = require("./routes/loginRoute");
const { authentication } = require("./middleware/authentication");
const { contactsRouter } = require("./routes/customer/contactsRoute");
const { profileRouter } = require("./routes/customer/profileRoute");
const cronJobForEndTrip = require("./controllers/cronJob");
const { rfidRouter } = require("./routes/customer/rfidRoute");
const { alertRouter } = require("./routes/customer/alerttriggersRoute");


const cors = require("cors");
const { featuresetRouter } = require("./routes/admin/featuresetRoute");

require("dotenv").config();
const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

setupMQTT();
//whatsappRouter();

cronJobForEndTrip();
// setInterval(cronJobForEndTrip, 10 * 60 * 1000); // run cronjob every 10 mins

// Login Routes
app.use("/api", loginRouter);

app.use(authentication);

// Admin Panel Routes
app.use("/api/devices", deviceRouter);
app.use("/api/customers", customerRouter);
app.use("/api/analytics-threshold", ATRouter);
app.use("/api/featuresets", featuresetRouter);

// Customer Panel Routes
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/drivers", driversRouter);
app.use("/api/profile", profileRouter);
app.use("/api/rfid", rfidRouter);
app.use("/api/alert-triggers", alertRouter);

app.listen(PORT, () => {
  logger.info(`App is running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  logger.info("Received SIGINT signal. Closing connection pool...");
  try {
    await pool.end();
    logger.info("Connection pool closed.");
    process.exit(0);
  } catch (error) {
    logger.error("Error closing connection pool:", error);
    process.exit(1);
  }
});