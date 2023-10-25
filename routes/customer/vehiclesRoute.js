const express = require("express");
const {
  getAllvehicles,
  totalVehicles,
  addVehicle,
  editVehicle,
  getUserVehicles,
  deleteVehicle,
  getVehicleData,
  getVehicleByVehicleId,
} = require("../../controllers/customer/vehiclesController");
const vehiclesRouter = express.Router();
// Hello
// //add the vehicle into databse
vehiclesRouter.post("/add-vehicle", addVehicle);

// //update the vehicle details
vehiclesRouter.put("/edit-vehicle/:vehicle_uuid", editVehicle);

// Get list of all vehicles [admin]
vehiclesRouter.get("/get-all-vehicles", getAllvehicles);

// //get list of vehicle assign to particular user
vehiclesRouter.get("/get-user-vehiclelist/:user_uuid", getUserVehicles);

// //delete the vehicle by updating the status
vehiclesRouter.put("/delete-vehicle/:vehicle_uuid", deleteVehicle);

// Get total vehicles count[admin]
vehiclesRouter.get("/total-vehicles", totalVehicles);

//get data of particular vehicle by vehicle_uuid
vehiclesRouter.get("/get-vehicle-details/:vehicle_uuid", getVehicleData);

// Get vehicle by id
vehiclesRouter.get("/get-vehicle-by-id/:vehicle_uuid", getVehicleByVehicleId);

module.exports = { vehiclesRouter };
