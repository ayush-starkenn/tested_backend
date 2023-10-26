const express = require("express");
const scheduleRouter = express.Router();
// imports
const scheduleController = require("../../controllers/customer/schedulReports");

scheduleRouter.post(
  "/create_Reports_schedule/:user_uuid",
  scheduleController.scheduleReports
);

// schedule_reportsRouter.put("/update_Reports_schedule/:report_uuid", schedule_reportsController.scheduleReports);

scheduleRouter.put(
  "/get_Reports_schedule/:report_uuid",
  scheduleController.scheduleupdateReports
);

module.exports = { scheduleRouter };
