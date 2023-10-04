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

// Fetch completed trip data by tripid
tripRouter.get(
  "/get-completed-tripdata-by-tripid/:trip_id",
  tripController.getCompletedTripdata
);

// Fetch trip summary data
tripRouter.get(
  "/get-trip-summary-by-tripid/:trip_id",
  tripController.getTripSummaryByTripId
);

//get faultCounts
tripRouter.get(
  "/get-fault-counts/:trip_id",
  tripController.getFaultCountByTrip_Id
);

// Get ongoing trip data by trip id
tripRouter.get(
  "/get-ongoing-tripdata-by-tripid/:trip_id",
  tripController.getOngoingTripdataByTripId
);

// Get ongoing trip fault counts
tripRouter.get(
  "/get-ongoing-fault-counts/:tripID/:epochstart/:epochend",
  tripController.getOngoingFaultData
);

// Export
module.exports = { tripRouter };
