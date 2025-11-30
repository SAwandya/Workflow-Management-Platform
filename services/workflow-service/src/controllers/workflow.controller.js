const workflowService = require("../services/workflow.service");

class WorkflowController {
  async createWorkflow(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const workflowData = {
        ...req.body,
        tenant_id: tenantId,
        created_by: req.user?.user_id || "system",
      };

      const workflow = await workflowService.createWorkflow(workflowData);

      res.status(201).json({
        message: "Workflow created successfully",
        workflow,
      });
    } catch (error) {
      console.error("Error creating workflow:", error);
      res.status(400).json({
        error: "Failed to create workflow",
        details: error.message,
      });
    }
  }

  async getWorkflow(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { workflowId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const workflow = await workflowService.getWorkflow(workflowId, tenantId);

      res.json({ workflow });
    } catch (error) {
      console.error("Error fetching workflow:", error);
      const statusCode = error.message === "Workflow not found" ? 404 : 500;
      res.status(statusCode).json({
        error: "Failed to fetch workflow",
        details: error.message,
      });
    }
  }

  async listWorkflows(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { status, limit } = req.query;

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const workflows = await workflowService.listWorkflows(
        tenantId,
        status,
        parseInt(limit) || 50
      );

      res.json({
        tenant_id: tenantId,
        count: workflows.length,
        workflows,
      });
    } catch (error) {
      console.error("Error listing workflows:", error);
      res.status(500).json({
        error: "Failed to list workflows",
        details: error.message,
      });
    }
  }

  async updateWorkflow(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { workflowId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const workflow = await workflowService.updateWorkflow(
        workflowId,
        tenantId,
        req.body,
        req.user?.user_id || "system"
      );

      res.json({
        message: "Workflow updated successfully",
        workflow,
      });
    } catch (error) {
      console.error("Error updating workflow:", error);
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        error: "Failed to update workflow",
        details: error.message,
      });
    }
  }

  async deleteWorkflow(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { workflowId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      await workflowService.deleteWorkflow(workflowId, tenantId);

      res.json({
        message: "Workflow deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting workflow:", error);
      const statusCode = error.message.includes("not found") ? 404 : 400;
      res.status(statusCode).json({
        error: "Failed to delete workflow",
        details: error.message,
      });
    }
  }

  async submitForApproval(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { workflowId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const workflow = await workflowService.submitForApproval(
        workflowId,
        tenantId
      );

      res.json({
        message: "Workflow submitted for approval",
        workflow,
      });
    } catch (error) {
      console.error("Error submitting workflow:", error);
      res.status(400).json({
        error: "Failed to submit workflow",
        details: error.message,
      });
    }
  }

  async approveWorkflow(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { workflowId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const workflow = await workflowService.approveWorkflow(
        workflowId,
        tenantId,
        req.user?.user_id || "vendor-admin"
      );

      res.json({
        message: "Workflow approved successfully",
        workflow,
      });
    } catch (error) {
      console.error("Error approving workflow:", error);
      res.status(400).json({
        error: "Failed to approve workflow",
        details: error.message,
      });
    }
  }

  async rejectWorkflow(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { workflowId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const workflow = await workflowService.rejectWorkflow(
        workflowId,
        tenantId,
        req.user?.user_id || "vendor-admin"
      );

      res.json({
        message: "Workflow rejected",
        workflow,
      });
    } catch (error) {
      console.error("Error rejecting workflow:", error);
      res.status(400).json({
        error: "Failed to reject workflow",
        details: error.message,
      });
    }
  }
}

module.exports = new WorkflowController();
