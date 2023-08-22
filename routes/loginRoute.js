const express = require("express");
const { Signup, Login } = require("../controllers/admin/usersController");
const loginRouter = express.Router();

// SignUp user(Insert Data) Routes
loginRouter.post("/signup", Signup);

// Login User Routes
loginRouter.post("/login", Login);

module.exports = { loginRouter };
