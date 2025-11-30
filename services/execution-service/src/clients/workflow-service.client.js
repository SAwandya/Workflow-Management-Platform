const axios = require("axios");

class WorkflowServiceClient {
  constructor() {
    this.baseUrl =
      process.env.WORKFLOW_SERVICE_URL || "http://workflow-service:3000";
  }

  async getWorkflow(workflowId, tenantId) {
    try {
      console.log(
        `[WorkflowServiceClient] Fetching workflow: ${workflowId} for tenant: ${tenantId}`
      );

      const response = await axios.get(
        `${this.baseUrl}/api/workflows/${workflowId}`,
        {
          headers: {
            "X-Tenant-ID": tenantId,
          },
          timeout: 5000,
        }
      );

      console.log(`[WorkflowServiceClient] Workflow fetched successfully`);
      return response.data.workflow;
    } catch (error) {
      console.error(
        "[WorkflowServiceClient] Failed to fetch workflow:",
        error.message
      );
      throw error;
    }
  }
}

module.exports = new WorkflowServiceClient();
