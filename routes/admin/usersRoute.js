const express = require("express");
const AdminController = require("../../controllers/admin/usersController");
const customerRouter = express.Router();
//const { validateToken } = require("../../auth/validateToken");

// SignUp user(Insert Data) Routes
customerRouter.post("/signup", AdminController.Signup);

// Login User Routes
customerRouter.post("/login", AdminController.Login);

// Logout User Routes
customerRouter.get("/logout", AdminController.Logout);

// Chnage Password User Routes
customerRouter.get("/change-password/:user_uuid", AdminController.ResetPassword);

// Get All User Routes
customerRouter.get("/get-all-customer", AdminController.getCustomers);

// Get User By Id Routes
customerRouter.get("/get/:user_uuid", AdminController.GetCustomerById);

// Update User Routes
customerRouter.put(
  "/update-customer/:user_uuid",
  AdminController.updateCustomers
);

// Delete User Routes
customerRouter.put(
  "/delete-customer/:user_uuid",
  AdminController.deleteCustomer
);

// Get total customers count [admin]
customerRouter.get("/total-customers", AdminController.getTotalCustomers);

module.exports = { customerRouter };
