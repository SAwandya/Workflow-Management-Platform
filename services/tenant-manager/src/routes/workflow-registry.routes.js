const express = require("express");
const workflowRegistryController = require("../controllers/workflow-registry.controller");

const router = express.Router();

router.post(
  "/:tenantId/workflows",
  workflowRegistryController.registerWorkflow.bind(workflowRegistryController)
);
router.get(
  "/:tenantId/workflows",
  workflowRegistryController.getWorkflowsByTenant.bind(
    workflowRegistryController
  )
);
router.get(
  "/:tenantId/workflows/query",
  workflowRegistryController.getWorkflowByEvent.bind(workflowRegistryController)
);
router.patch(
  "/:tenantId/workflows/:workflowId/status",
  workflowRegistryController.updateWorkflowStatus.bind(
    workflowRegistryController
  )
);
router.delete(
  "/:tenantId/workflows/:workflowId",
  workflowRegistryController.deleteWorkflow.bind(workflowRegistryController)
);

module.exports = router;
