const express = require("express");
const rfidRouter = express.Router();
const rfidController = require("../../controllers/customer/rfidController");

// get all..
rfidRouter.get("/getAll", rfidController.getAllRFID);

// assign..
rfidRouter.put("/assign/:rfid", rfidController.assignRFID);

// unassign..
rfidRouter.put("/unassign/:rfid", rfidController.unassignRFID);

// delete..
rfidRouter.put("/delete/:rfid", rfidController.deleteRFID);

// add RFID..
rfidRouter.post("/add-driver-rfid/:user_uuid/:driver_uuid", rfidController.addRFID);

//export
module.exports = {rfidRouter} ;