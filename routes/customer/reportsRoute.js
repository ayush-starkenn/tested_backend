const express = require("express");
const reportsRouter = express.Router();
// imports
const reportsController = require("../../controllers/customer/reportsController");




reportsRouter.post(
    "/getreports-all/:user_uuid",
    reportsController.getAllreport 
  );

  module.exports = { reportsRouter };
  