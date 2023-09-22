const express = require("express");
const dashboardRouter = express.Router();
const dashboardController = require("../../controllers/customer/dashboardController");

dashboardRouter.get("/getAlert/:user_uuid",dashboardController.getalertbyId);

dashboardRouter.get("/getOngoingTripDashboard/:user_uuid", dashboardController.getongoingTripDashboard);


module.exports = { dashboardRouter };   