const express = require("express");
const {
  addDriver,
  editDriver,
  getUsersDrivers,
  deleteDriver,
} = require("../../controllers/customer/driverController");
const driversRouter = express.Router();

driversRouter.post("/add-driver/:user_uuid", addDriver);

driversRouter.put("/edit-driver/:driver_uuid", editDriver);

driversRouter.get("/get-driverslist/:user_uuid", getUsersDrivers);

driversRouter.put("/delete-driver/:driver_uuid", deleteDriver);

module.exports = { driversRouter };
