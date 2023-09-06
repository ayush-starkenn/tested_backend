const express = require("express");
const {
  addVehicleFeatureset,
  editVehicleFeatureset,
  getVehicleFeaturesetOfVehicle,
} = require("../../controllers/customer/vehicleFeaturesetController");

const vehiclefeaturesetRouter = express.Router();

vehiclefeaturesetRouter.post("/add-vehiclefeatureset", addVehicleFeatureset);

vehiclefeaturesetRouter.put(
  "/edit-vehiclefeatureset/:vehiclefeatureset_uuid",
  editVehicleFeatureset
);

vehiclefeaturesetRouter.get(
  "/get-vehiclefeatureset-vehicle/:vehicle_uuid",
  getVehicleFeaturesetOfVehicle
);

module.exports = { vehiclefeaturesetRouter };
