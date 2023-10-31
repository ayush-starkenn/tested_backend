const express = require("express");
const ATController = require("../../controllers/admin/analyticsthresholdController");
const ATRouter = express.Router();

// ADD Analytics Threshold
ATRouter.post("/add-analytics/:user_uuid", ATController.addAnalyticsThreshold);

// Get Analytics Thresholds By AT - uuid 
ATRouter.get("/get-AnalyticsThresholds-ById/:threshold_uuid",ATController.getByIdAnalyticsThresholds);

// Get- ALL - Analytics Threshold  //
ATRouter.get("/get-analytics-threshold", ATController.getAnalyticsThreshold);

// Get Analytics thresholds By User UUID
ATRouter.get("/get-analytics-threshold-userID/:user_uuid", ATController.getAnalyticsThresholduser);

// Update Analytics Threshold Routes //
ATRouter.put("/update-analytic-threshold/:threshold_uuid",ATController.updateAnalyticsThresholds);

// Delete Analytics Threshold Routes //
ATRouter.put("/delete-analytic-threshold/:threshold_uuid",ATController.deleteAnalyticsThresholds);

module.exports = { ATRouter };
