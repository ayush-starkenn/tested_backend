const logger = require("./logger");
const express = require("express");
const pool = require("./config/db");
const setupMQTT = require("./controllers/mqttHandler");
const cors = require("cors");

require("dotenv").config();
const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

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
const { reportsRouter } = require("./routes/customer/reportsRoute");
const { scheduleRouter } = require("./routes/customer/scheduleRoute");
const { dashboardRouter } = require("./routes/customer/dashboardRoute");
const { notifiRouter } = require("./routes/customer/notifiRoute");
const { featuresetRouter } = require("./routes/admin/featuresetRoute");
const {
  vehiclefeaturesetRouter,
} = require("./routes/customer/vehicleFeaturesetRoute");
const { alertRouter } = require("./routes/customer/alerttriggersRoute");
const { tripRouter } = require("./routes/customer/tripRoute");

setupMQTT();
//whatsappRouter();

cronJobForEndTrip();
setInterval(cronJobForEndTrip, 10 * 60 * 1000); // run cronjob every 10 mins

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
app.use("/api/reports", reportsRouter);
app.use("/api/vehicle-featureset", vehiclefeaturesetRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/schedule_reports", scheduleRouter);
app.use("/api/trips", tripRouter);
app.use("/api/dashboardCustomers", dashboardRouter);
app.use("/api/notification", notifiRouter);

// PORT
app.listen(PORT, () => {
  logger.info(`App is running on port ${PORT}`);
});

// Logger / combined / Error File
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
