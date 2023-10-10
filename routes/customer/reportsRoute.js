const express = require("express");
const reportsRouter = express.Router();
// imports
const reportsController = require("../../controllers/customer/reportsController");

// This api A testing purpose and Only Get A reports  of Selected Vehicles
reportsRouter.get("/getreports-all/:user_uuid",reportsController.getAllreport);

// This Api Get All Vehicles for Reports
reportsRouter.get("/getreports-all-vehicles/:user_uuid",reportsController.getVehicle);

// This Api Get All Contacts For Reports
reportsRouter.get("/getreports-all-contacts/:user_uuid",reportsController.getAllContacts);

// This Api Create a Reports to the selected Vehicles
reportsRouter.post("/createReports-all/:user_uuid",reportsController.createAllreport);

// This  Api Get a Reports
reportsRouter.get("/get_Reports/:report_uuid", reportsController.getReports);

// This  Api Get a Schedule Reports
reportsRouter.get("/get_Reports_schedule/:user_uuid", reportsController.scheduleReports);

module.exports = { reportsRouter };
  
 