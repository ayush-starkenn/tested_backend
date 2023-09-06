const express = require("express");
const alertRouter = express.Router();
// imports
const alerttriggersController = require("../../controllers/customer/alerttriggersController");

// routes
alertRouter.post("/save-alert-trigger/:user_uuid", alerttriggersController.saveAlertTrigger);
alertRouter.get("/get-alert-trigger/:trigger_id", alerttriggersController.getAlertTrigger);
alertRouter.get("/getall-alert-trigger/:user_uuid", alerttriggersController.getAllAlertTrigger);
alertRouter.put("/delete-alert-trigger/:trigger_id", alerttriggersController.DeleteAlertTrigger);
alertRouter.put(
  "/deactivate-alert-trigger/:trigger_id",
  alerttriggersController.DeactivateAlertTrigger
);
alertRouter.put("/activate-alert-trigger/:trigger_id", alerttriggersController.ActivateAlertTrigger);

alertRouter.put("/update-alert-trigger/:trigger_id", alerttriggersController.updateAlertTrigger);
//exports
module.exports = { alertRouter };