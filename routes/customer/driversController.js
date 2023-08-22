const express = require("express");
const {
  addDriver,
  editDriver,
  getUsersDrivers,
  deleteDriver,
} = require("../../controllers/customer/driversController");
const driversRouter = express.Router();

driversRouter.post("/add-driver", addDriver);

driversRouter.put("/edit-driver/:driver_uuid", editDriver);

driversRouter.get("/get-driverslist/:user_uuid", getUsersDrivers);

driversRouter.put("/delete-driver/:driver_uuid", deleteDriver);

module.exports = { driversRouter };
