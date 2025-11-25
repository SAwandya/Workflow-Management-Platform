const workflowOrchestrationService = require("../services/workflow-orchestration.service");

class WorkflowTriggerController {
  async triggerWorkflow(req, res) {
    try {
      const { workflow_id, tenant_id, trigger_data, trigger_type } = req.body;

      // Validate required fields
      if (!workflow_id || !tenant_id) {
        return res.status(400).json({
          error: "Missing required fields: workflow_id, tenant_id",
        });
      }

      // Extract tenant from header if present (additional validation)
      const headerTenantId = req.headers["x-tenant-id"];
      if (headerTenantId && headerTenantId !== tenant_id) {
        return res.status(403).json({
          error: "Tenant ID mismatch between header and body",
        });
      }

      const result = await workflowOrchestrationService.handleWorkflowTrigger(
        workflow_id,
        tenant_id,
        trigger_data || {},
        trigger_type || "sync"
      );

      if (result.success) {
        res.status(201).json({
          message: "Workflow triggered successfully",
          instanceId: result.instanceId,
          status: result.status,
        });
      } else {
        res.status(500).json({
          error: "Workflow trigger failed",
          details: result.error,
          fallback: result.fallback,
        });
      }
    } catch (error) {
      console.error("Error in triggerWorkflow controller:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  async resumeWorkflow(req, res) {
    try {
      const { instanceId } = req.params;
      const { tenant_id, step_id, user_input } = req.body;

      if (!tenant_id) {
        return res.status(400).json({
          error: "Missing required field: tenant_id",
        });
      }

      const result = await workflowOrchestrationService.handleWorkflowResume(
        instanceId,
        tenant_id,
        step_id,
        user_input || {}
      );

      if (result.success) {
        res.json({
          message: "Workflow resumed successfully",
          status: result.status,
        });
      } else {
        res.status(500).json({
          error: "Workflow resume failed",
          details: result.error,
        });
      }
    } catch (error) {
      console.error("Error in resumeWorkflow controller:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }

  async getWorkflowStatus(req, res) {
    try {
      const { instanceId } = req.params;
      const { tenant_id } = req.query;

      if (!tenant_id) {
        return res.status(400).json({
          error: "Missing required query parameter: tenant_id",
        });
      }

      const result = await workflowOrchestrationService.getWorkflowStatus(
        instanceId,
        tenant_id
      );

      if (result.success) {
        res.json(result.data);
      } else {
        res.status(500).json({
          error: "Failed to get workflow status",
          details: result.error,
        });
      }
    } catch (error) {
      console.error("Error in getWorkflowStatus controller:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }
}

module.exports = new WorkflowTriggerController();
