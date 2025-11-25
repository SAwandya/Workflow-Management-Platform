const workflowRegistryRepository = require("../repositories/workflow-registry.repository");
const tenantRepository = require("../repositories/tenant.repository");

class WorkflowRegistryController {
  async registerWorkflow(req, res) {
    try {
      const { tenantId } = req.params;
      const workflowData = req.body;

      // Validate tenant exists
      const tenantExists = await tenantRepository.exists(tenantId);
      if (!tenantExists) {
        return res.status(404).json({
          error: "Tenant not found",
          tenant_id: tenantId,
        });
      }

      // Validate required fields
      const requiredFields = [
        "workflow_id",
        "workflow_name",
        "trigger_type",
        "trigger_event",
      ];
      const missingFields = requiredFields.filter(
        (field) => !workflowData[field]
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: "Missing required fields",
          missing: missingFields,
        });
      }

      // Check if workflow already exists
      const exists = await workflowRegistryRepository.exists(
        tenantId,
        workflowData.workflow_id
      );
      if (exists) {
        return res.status(409).json({
          error: "Workflow already registered for this tenant",
          workflow_id: workflowData.workflow_id,
        });
      }

      const workflow = await workflowRegistryRepository.register(
        tenantId,
        workflowData
      );

      res.status(201).json({
        message: "Workflow registered successfully",
        workflow,
      });
    } catch (error) {
      console.error("Error registering workflow:", error);
      res.status(500).json({
        error: "Failed to register workflow",
        details: error.message,
      });
    }
  }

  async getWorkflowsByTenant(req, res) {
    try {
      const { tenantId } = req.params;

      const workflows = await workflowRegistryRepository.findByTenantId(
        tenantId
      );

      res.json({
        tenant_id: tenantId,
        count: workflows.length,
        workflows,
      });
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({
        error: "Failed to fetch workflows",
        details: error.message,
      });
    }
  }

  async getWorkflowByEvent(req, res) {
    try {
      const { tenantId } = req.params;
      const { trigger_event } = req.query;

      if (!trigger_event) {
        return res.status(400).json({
          error: "Missing required query parameter: trigger_event",
        });
      }

      const workflow = await workflowRegistryRepository.findByTenantAndEvent(
        tenantId,
        trigger_event
      );

      if (!workflow) {
        return res.status(404).json({
          error: "No workflow found for this trigger event",
          tenant_id: tenantId,
          trigger_event,
        });
      }

      res.json({ workflow });
    } catch (error) {
      console.error("Error fetching workflow by event:", error);
      res.status(500).json({
        error: "Failed to fetch workflow",
        details: error.message,
      });
    }
  }

  async updateWorkflowStatus(req, res) {
    try {
      const { tenantId, workflowId } = req.params;
      const { status } = req.body;

      const validStatuses = ["ACTIVE", "INACTIVE"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: "Invalid status",
          validStatuses,
        });
      }

      const workflow = await workflowRegistryRepository.updateStatus(
        tenantId,
        workflowId,
        status
      );

      if (!workflow) {
        return res.status(404).json({
          error: "Workflow not found",
          tenant_id: tenantId,
          workflow_id: workflowId,
        });
      }

      res.json({
        message: "Workflow status updated successfully",
        workflow,
      });
    } catch (error) {
      console.error("Error updating workflow status:", error);
      res.status(500).json({
        error: "Failed to update workflow status",
        details: error.message,
      });
    }
  }

  async deleteWorkflow(req, res) {
    try {
      const { tenantId, workflowId } = req.params;

      const workflow = await workflowRegistryRepository.delete(
        tenantId,
        workflowId
      );

      if (!workflow) {
        return res.status(404).json({
          error: "Workflow not found",
          tenant_id: tenantId,
          workflow_id: workflowId,
        });
      }

      res.json({
        message: "Workflow deleted successfully",
        workflow,
      });
    } catch (error) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({
        error: "Failed to delete workflow",
        details: error.message,
      });
    }
  }
}

module.exports = new WorkflowRegistryController();
