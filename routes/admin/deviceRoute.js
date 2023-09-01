const express = require("express");
const {
  addDevice,
  editDevice,
  deleteDevice,
  getDevices,
  getusersDevices,
  getUserEcu,
  getUserIot,
  getUserDMS,
  deviceCount,
  getCustomerList,
  getDeviceById,
} = require("../../controllers/admin/deviceController");
const deviceRouter = express.Router();

// Add the device [admin]
deviceRouter.post("/add-device", addDevice);

// Edit the device [admin]
deviceRouter.put("/edit-device/:device_id", editDevice);

// Delete the device by updating the status
deviceRouter.put("/delete-device/:device_id", deleteDevice);

//get list of all devices [admin]
deviceRouter.get("/list-devices", getDevices);

// Get device by id
deviceRouter.get("/get-device-by-id/:device_id", getDeviceById);

// Get customer list [admin]
deviceRouter.get("/get-customerlist", getCustomerList);

// //get list of all devices assign to particular user
deviceRouter.get("/get-user-devices-list/:user_uuid", getusersDevices);

// //get list of ecu assign to particular user
deviceRouter.get("/get-user-ecu/:user_uuid", getUserEcu);

// //get list of all  iot assign to particular user
deviceRouter.get("/get-user-iot/:user_uuid", getUserIot);

// //get list of all dms assign to particular user
deviceRouter.get("/get-user-dms/:user_uuid", getUserDMS);

// Get total devices count
deviceRouter.get("/total-devices", deviceCount);

module.exports = { deviceRouter };
