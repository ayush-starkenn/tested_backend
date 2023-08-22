const express = require("express");
const {
  addVehicleFeatureset,
  editVehicleFeatureset,
  deletevehiclefeatureset,
  getVehicleFeatureset,
  getVehicleFeaturesetOfVehicle,
  getVehicleFeaturesetOfUser,
} = require("../../controllers/customer/vehiclefeaturesetController");
const vehiclefeaturesetRouter = express.Router();

vehiclefeaturesetRouter.post("/add-vehiclefeatureset", addVehicleFeatureset);

vehiclefeaturesetRouter.put(
  "/edit-vehiclefeatureset/:vehiclefeatureset_uuid",
  editVehicleFeatureset
);

vehiclefeaturesetRouter.put(
  "/delete-vehiclefeatureset/:vehiclefeatureset_uuid",
  deletevehiclefeatureset
);

vehiclefeaturesetRouter.get(
  "/get-vehiclefeatureset-list",
  getVehicleFeatureset
);

vehiclefeaturesetRouter.get(
  "/get-vehiclefeatureset-vehicle/:vehicle_uuid",
  getVehicleFeaturesetOfVehicle
);

vehiclefeaturesetRouter.get(
  "/get-vehiclefeaturesetofuser/:user_uuid",
  getVehicleFeaturesetOfUser
);

module.exports = { vehiclefeaturesetRouter };
