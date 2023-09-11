const express = require("express");
const tripRouter = express.Router();
// Imports
const tripController = require("../../controllers/customer/tripController");

// Fetch trip summary data by vehicle uuid
tripRouter.get(
  "/get-vehicle-trips/:vehicle_uuid",
  tripController.getTripSummary
);

// Fetch ongoing trip data by vehicle_uuid
tripRouter.get(
  "/get-ongoing-tripdata-by-vehicleUUID/:vehicle_uuid",
  tripController.getOngoingTripdata
);

// Export
module.exports = { tripRouter };
