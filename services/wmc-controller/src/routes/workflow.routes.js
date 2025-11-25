const express = require("express");
const workflowTriggerController = require("../controllers/workflow-trigger.controller");

const router = express.Router();

router.post(
  "/trigger",
  workflowTriggerController.triggerWorkflow.bind(workflowTriggerController)
);
router.post(
  "/instances/:instanceId/resume",
  workflowTriggerController.resumeWorkflow.bind(workflowTriggerController)
);
router.get(
  "/instances/:instanceId/status",
  workflowTriggerController.getWorkflowStatus.bind(workflowTriggerController)
);

module.exports = router;
