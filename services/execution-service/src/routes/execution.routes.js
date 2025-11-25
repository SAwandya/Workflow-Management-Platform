const express = require("express");
const executionController = require("../controllers/execution.controller");

const router = express.Router();

router.post(
  "/trigger",
  executionController.triggerWorkflow.bind(executionController)
);
router.post(
  "/instances/:instanceId/resume",
  executionController.resumeWorkflow.bind(executionController)
);
router.get(
  "/instances/:instanceId/status",
  executionController.getWorkflowStatus.bind(executionController)
);

module.exports = router;
