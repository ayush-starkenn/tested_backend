const express = require("express");
const profileRouter = express.Router();
const ProfileController = require("../../controllers/customer/profileController");

profileRouter.get("/get-profile/:user_uuid",ProfileController.getProfile);

profileRouter.put("/update-profile/:user_uuid", ProfileController.updateProfile);

profileRouter.put("/change-profile-password/:user_uuid", ProfileController.changePassword);

module.exports = { profileRouter };