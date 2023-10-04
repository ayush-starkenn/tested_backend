const express = require("express");
const dashboardRouter = express.Router();
const dashboardController = require("../../controllers/customer/dashboardController");

dashboardRouter.get("/getAlert/:user_uuid",dashboardController.getalertbyId);

dashboardRouter.get("/getOngoingTripDashboard/:user_uuid", dashboardController.getongoingTripDashboard);

dashboardRouter.get("/getVehicleLogs/:user_uuid", dashboardController.getvehicleLogs);

dashboardRouter.get("/get-alert/:user_uuid", dashboardController.getalert);

dashboardRouter.get("/getOngoingLoc/:user_uuid",dashboardController.getOngoingLOC);

module.exports = { dashboardRouter };   