const express = require("express");
const workflowTriggerController = require("../controllers/workflow-trigger.controller");
const executionServiceClient = require("../clients/execution-service.client");

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

// Get recent workflow instances
router.get("/instances/recent", async (req, res) => {
  try {
    const tenantId = req.query.tenant_id;
    const limit = parseInt(req.query.limit) || 10;

    if (!tenantId) {
      return res.status(400).json({
        error: "Missing tenant_id parameter",
      });
    }

    console.log(`Getting recent instances for tenant: ${tenantId}`);

    const response = await executionServiceClient.getRecentInstances(
      tenantId,
      limit
    );

    res.json(response);
  } catch (error) {
    console.error("Failed to get recent instances:", error.message);
    res.status(500).json({
      error: "Failed to get recent instances",
      details: error.message,
    });
  }
});

module.exports = router;
