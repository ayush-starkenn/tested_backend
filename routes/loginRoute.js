const express = require("express");
const { 
    Signup,
    Login,
    ForgotPasswordOTP ,
    ForgotPasswordOTPVerify,
    ForgotPasswordChange} 
    
= require("../controllers/admin/usersController");
const loginRouter = express.Router();

// Login User Routes
loginRouter.post("/login", Login);

// Sign Up User Router
loginRouter.post("/signup", Signup);

// Forgot Password OTP
loginRouter.post("/forgot-password-otp/", ForgotPasswordOTP);

//Forgot Password OTP verify
loginRouter.post("/forgot-password-otp-verify/", ForgotPasswordOTPVerify)

// Forgot Password Change
loginRouter.post("/forgot-password-Change/", ForgotPasswordChange);

module.exports = { loginRouter };
