const express = require("express");
const { 
    Login,
    ForgotPasswordOTP ,
    ForgotPasswordOTPVerify,
    ForgotPasswordChange} 
    
= require("../controllers/admin/usersController");
const loginRouter = express.Router();

// Login User Routes
loginRouter.post("/login", Login);

// Forgot Password OTP
loginRouter.get("/forgot-password-otp/:user_uuid", ForgotPasswordOTP);

//Forgot Password OTP verify
loginRouter.post("/forgot-password-otp-verify/:user_uuid", ForgotPasswordOTPVerify)

// Forgot Password Change
loginRouter.post("/forgot-password-Change/:user_uuid", ForgotPasswordChange);

module.exports = { loginRouter };
