const express = require("express");
const integrationController = require("../controllers/integration.controller");

const router = express.Router();

router.post(
  "/api-call",
  integrationController.executeApiCall.bind(integrationController)
);
router.post(
  "/notification",
  integrationController.sendNotification.bind(integrationController)
);
router.post(
  "/test-connection",
  integrationController.testConnection.bind(integrationController)
);

module.exports = router;
