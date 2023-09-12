const express = require("express");
const reportsRouter = express.Router();
// imports
const reportsController = require("../../controllers/customer/reportsController");




reportsRouter.get(
    "/getreports-all",
    reportsController.getreport
  );

  module.exports = { reportsRouter };