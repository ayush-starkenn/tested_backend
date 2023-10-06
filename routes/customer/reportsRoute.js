const express = require("express");
const reportsRouter = express.Router();
// imports
const reportsController = require("../../controllers/customer/reportsController");

reportsRouter.get("/getreports-all/:user_uuid",reportsController.getAllreport);

reportsRouter.post("/createReports-all/:user_uuid",reportsController.createAllreport);

reportsRouter.get("/getreports-all-vehicles/:user_uuid",reportsController.getVehicle);

reportsRouter.get("/getreports-all-contacts/:user_uuid",reportsController.getAllContacts);

module.exports = { reportsRouter };
  
