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

//this the delete featureset route
featuresetRouter.put("/delete-featureset/:featureset_uuid", deleteFeatureset);

//get list of all featureset
featuresetRouter.get("/get-all-featureset", getAllFeatureset);

//get featureset of that particular user
featuresetRouter.get("/get-user-featureset/:user_uuid", getFeaturesetOFUser);

//get that featureset based on featureset uuid
featuresetRouter.get("/get-featureset/:featureset_uuid", getFeatureset);

//get list of assign users
// featuresetRouter.get("/get-list-assign-users/:featureset_uuid", getAssignUsers);

//get list of unassign users
// featuresetRouter.get(
//   "/get-list-unassign-users/:featureset_uuid",
//   getUnassignUsers
// );

//assign user to featureset
// featuresetRouter.put("/assign-user/:featureset_uuid", assignuser);

//unassign user from featureset
// featuresetRouter.put("/unassign-user/:featureset_uuid", unassignuser);

module.exports = { featuresetRouter };
