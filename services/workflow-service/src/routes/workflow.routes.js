const express = require("express");
const workflowController = require("../controllers/workflow.controller");

const router = express.Router();

// CRUD operations
router.post("/", workflowController.createWorkflow.bind(workflowController));
router.get("/", workflowController.listWorkflows.bind(workflowController));
router.get(
  "/:workflowId",
  workflowController.getWorkflow.bind(workflowController)
);
router.put(
  "/:workflowId",
  workflowController.updateWorkflow.bind(workflowController)
);
router.delete(
  "/:workflowId",
  workflowController.deleteWorkflow.bind(workflowController)
);

// Lifecycle operations
router.post(
  "/:workflowId/submit",
  workflowController.submitForApproval.bind(workflowController)
);
router.post(
  "/:workflowId/approve",
  workflowController.approveWorkflow.bind(workflowController)
);
router.post(
  "/:workflowId/reject",
  workflowController.rejectWorkflow.bind(workflowController)
);

module.exports = router;
