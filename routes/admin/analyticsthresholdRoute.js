const express = require("express");
const ATController = require("../../controllers/admin/analyticsthresholdController");
const ATRouter = express.Router();

// ADD Analytics Threshold
ATRouter.post("/add-analytics", ATController.addAnalyticsThreshold);

// Get Customers By ID
ATRouter.get(
  "/get-AnalyticsThresholds-ById/:threshold_uuid",
  ATController.getByIdAnalyticsThresholds
);

// Get Analytics Threshold Routes //
ATRouter.get("/get-analytics-threshold", ATController.getAnalyticsThreshold);

// Update Analytics Threshold Routes //
ATRouter.put(
  "/update-analytic-threshold/:threshold_uuid",
  ATController.updateAnalyticsThresholds
);

// Delete Analytics Threshold Routes //
ATRouter.put(
  "/delete-analytic-threshold/:threshold_uuid",
  ATController.deleteAnalyticsThresholds
);

module.exports = { ATRouter };
