const express = require("express");
const workflowRegistryController = require("../controllers/workflow-registry.controller");

const router = express.Router();

// Query workflows by trigger event - MUST come BEFORE /:tenantId/workflows
router.get("/:tenantId/workflows/query", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { trigger_event } = req.query;

    console.log(
      `Querying workflows for tenant: ${tenantId}, trigger_event: ${trigger_event}`
    );

    if (!trigger_event) {
      return res.status(400).json({
        error: "Missing trigger_event parameter",
      });
    }

    const workflowRegistryRepository = require("../repositories/workflow-registry.repository");
    const workflows = await workflowRegistryRepository.findByTriggerEvent(
      tenantId,
      trigger_event
    );

    if (!workflows || workflows.length === 0) {
      console.log("No workflows found for this trigger event");
      return res.status(404).json({
        error: "No workflow found for this trigger event",
        tenant_id: tenantId,
        trigger_event: trigger_event,
      });
    }

    res.json({
      tenant_id: tenantId,
      trigger_event: trigger_event,
      workflows: workflows,
    });
  } catch (error) {
    console.error("Error querying workflows:", error);
    res.status(500).json({
      error: "Failed to query workflows",
      details: error.message,
    });
  }
});

// Register workflow
router.post(
  "/:tenantId/workflows",
  workflowRegistryController.registerWorkflow.bind(workflowRegistryController)
);

// Get all workflows for tenant
router.get(
  "/:tenantId/workflows",
  workflowRegistryController.getWorkflowsByTenant.bind(
    workflowRegistryController
  )
);

// Update workflow status
router.patch(
  "/:tenantId/workflows/:workflowId/status",
  workflowRegistryController.updateWorkflowStatus.bind(
    workflowRegistryController
  )
);

// Delete workflow by registry_id
router.delete("/:tenantId/workflows/:registryId", async (req, res) => {
  try {
    const { tenantId, registryId } = req.params;

    console.log(
      `Deleting workflow registry entry: ${registryId} for tenant: ${tenantId}`
    );

    const workflowRegistryRepository = require("../repositories/workflow-registry.repository");

    // Delete by registry_id
    const deleted = await workflowRegistryRepository.deleteById(
      parseInt(registryId)
    );

    if (!deleted) {
      return res.status(404).json({
        error: "Workflow registry entry not found",
      });
    }

    res.json({
      message: "Workflow deleted successfully",
      deleted: deleted,
    });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    res.status(500).json({
      error: "Failed to delete workflow",
      details: error.message,
    });
  }
});

module.exports = router;
