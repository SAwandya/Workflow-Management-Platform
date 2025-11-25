const workflowExecutorService = require("../services/workflow-executor.service");

class ExecutionController {
  async triggerWorkflow(req, res) {
    try {
      const { workflow_id, tenant_id, trigger_data } = req.body;

      if (!workflow_id || !tenant_id) {
        return res.status(400).json({
          error: "Missing required fields: workflow_id, tenant_id",
        });
      }

      const result = await workflowExecutorService.startWorkflow(
        workflow_id,
        tenant_id,
        trigger_data || {}
      );

      res.status(201).json({
        message: "Workflow triggered successfully",
        ...result,
      });
    } catch (error) {
      console.error("Error triggering workflow:", error);
      res.status(500).json({
        error: "Failed to trigger workflow",
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

      const result = await workflowExecutorService.resumeWorkflow(
        instanceId,
        tenant_id,
        step_id,
        user_input || {}
      );

      res.json({
        message: "Workflow resumed successfully",
        ...result,
      });
    } catch (error) {
      console.error("Error resuming workflow:", error);
      res.status(500).json({
        error: "Failed to resume workflow",
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

      const status = await workflowExecutorService.getWorkflowStatus(
        instanceId,
        tenant_id
      );

      res.json(status);
    } catch (error) {
      console.error("Error getting workflow status:", error);
      res.status(500).json({
        error: "Failed to get workflow status",
        details: error.message,
      });
    }
  }
}

module.exports = new ExecutionController();
