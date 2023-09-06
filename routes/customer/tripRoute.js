const express = require("express");
const tripRouter = express.Router();
// Imports
const tripController = require("../../controllers/customer/tripController");

// Fetch trip summary data by vehicle uuid
tripRouter.get(
  "/get-vehicle-trips/:vehicle_uuid",
  tripController.getTripSummary
);

// Export
module.exports = { tripRouter };
