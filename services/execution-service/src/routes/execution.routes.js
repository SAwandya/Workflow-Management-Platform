const express = require("express");
const executionController = require("../controllers/execution.controller");
const workflowExecutorService = require("../services/workflow-executor.service");

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

// Start workflow execution
router.post("/start", async (req, res) => {
  try {
    const { workflow_id, tenant_id, trigger_data } = req.body;

    console.log(
      `[ExecutionService] Starting workflow: ${workflow_id} for tenant: ${tenant_id}`
    );

    if (!workflow_id || !tenant_id) {
      return res.status(400).json({
        error: "Missing required fields: workflow_id, tenant_id",
      });
    }

    // Start workflow execution
    const result = await workflowExecutorService.startWorkflow(
      workflow_id,
      tenant_id,
      trigger_data || {}
    );

    console.log(
      `[ExecutionService] ✓ Workflow instance created: ${result.instanceId}`
    );

    res.json(result);
  } catch (error) {
    console.error("[ExecutionService] Workflow start failed:", error);
    res.status(500).json({
      error: "Failed to start workflow",
      details: error.message,
    });
  }
});

module.exports = router;
