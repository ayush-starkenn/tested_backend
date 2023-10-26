const express = require("express");
const notifiRouter = express.Router();
const notifiController = require("../../controllers/customer/notifiController");

notifiRouter.get("/get-all-notification/:user_uuid",notifiController.get_all_notifications);

notifiRouter.put("/update-all-notification/:user_uuid", notifiController.update_all_notifications);

notifiRouter.put("/update-notification/:notification_uuid", notifiController.update_notifications);

module.exports = { notifiRouter }; 