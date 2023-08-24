const express = require("express");
const { Signup, Login } = require("../controllers/admin/usersController");
const loginRouter = express.Router();

// Login User Routes
loginRouter.post("/login", Login);

module.exports = { loginRouter };
