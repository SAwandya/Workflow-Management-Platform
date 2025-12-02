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

    const workflowInstanceRepository = require("../repositories/workflow-instance.repository");
    const instances = await workflowInstanceRepository.findByTenant(
      tenantId,
      limit
    );

    res.json({
      tenant_id: tenantId,
      count: instances.length,
      instances,
    });
  } catch (error) {
    console.error("Error getting recent instances:", error);
    res.status(500).json({
      error: "Failed to get recent instances",
      details: error.message,
    });
  }
});

module.exports = router;
