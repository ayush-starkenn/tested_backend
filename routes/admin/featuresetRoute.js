const express = require("express");
const {
  addFeatureset,
  editFeatureset,
  deleteFeatureset,
  getAllFeatureset,
  getFeaturesetOFUser,
  getFeatureset,
  getAssignUsers,
  getUnassignUsers,
  assignuser,
  unassignuser,
  clientFeatureset,
} = require("../../controllers/admin/featuresetController");

const featuresetRouter = express.Router();

featuresetRouter.post("/add-featureset", addFeatureset);

featuresetRouter.put("/edit-featureset/:featureset_uuid", editFeatureset);

featuresetRouter.put(
  "/edit-client-featureset/:featureset_uuid",
  clientFeatureset
);

featuresetRouter.put("/delete-featureset/:featureset_uuid", deleteFeatureset);

featuresetRouter.get("/get-all-featureset", getAllFeatureset);

featuresetRouter.get("/get-user-featureset/:user_uuid", getFeaturesetOFUser);

featuresetRouter.get("/get-featureset/:featureset_uuid", getFeatureset);

featuresetRouter.get("/get-list-assign-users/:featureset_uuid", getAssignUsers);

featuresetRouter.get(
  "/get-list-unassign-users/:featureset_uuid",
  getUnassignUsers
);

featuresetRouter.put("/assign-user/:featureset_uuid", assignuser);

featuresetRouter.put("/unassign-user/:featureset_uuid", unassignuser);

module.exports = { featuresetRouter };
