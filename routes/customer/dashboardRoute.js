const express = require("express");
const dashboardRouter = express.Router();
const dashboardController = require("../../controllers/customer/dashboardController");

dashboardRouter.get("/getAlert/:user_uuid", dashboardController.getalertbyId);

dashboardRouter.get(
  "/get-ongoing-trip-data/:user_uuid",
  dashboardController.getOngoingTripData
);

dashboardRouter.get(
  "/getVehicleLogs/:user_uuid",
  dashboardController.getvehicleLogs
);

dashboardRouter.get("/get-alert/:user_uuid", dashboardController.getalert);

module.exports = { dashboardRouter };
dashboardRouter.get(
  "/getOngoingLoc/:user_uuid",
  dashboardController.getOngoingLOC
);

module.exports = { dashboardRouter };
