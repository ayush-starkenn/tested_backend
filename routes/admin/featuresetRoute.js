const express = require("express");
const {
  addFeatureset,
  editFeatureset,
  deleteFeatureset,
  getFeatureset,
  getFeaturesetOFUser,
} = require("../../controllers/admin/featuresetController");
const featuresetRouter = express.Router();

featuresetRouter.post("/add-featureset", addFeatureset);

featuresetRouter.put("/edit-featureset/:featureset_uuid", editFeatureset);

featuresetRouter.put("/delete-featureset/:featureset_uuid", deleteFeatureset);

featuresetRouter.get("/get-all-featureset", getFeatureset);

featuresetRouter.get("/get-user-featureset/:user_uuid", getFeaturesetOFUser);

module.exports = { featuresetRouter };
