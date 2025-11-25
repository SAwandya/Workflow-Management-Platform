const axios = require("axios");

class ExecutionServiceClient {
  constructor() {
    this.baseUrl =
      process.env.EXECUTION_SERVICE_URL || "http://execution-service:3000";
  }

  async triggerWorkflow(workflowId, tenantId, triggerData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/execution/trigger`,
        {
          workflow_id: workflowId,
          tenant_id: tenantId,
          trigger_data: triggerData,
        },
        { timeout: 30000 }
      );
      return response.data;
    } catch (error) {
      console.error("Execution service trigger failed:", error.message);
      throw new Error(`Failed to trigger workflow: ${error.message}`);
    }
  }

  async resumeWorkflow(instanceId, tenantId, stepId, userInput) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/execution/instances/${instanceId}/resume`,
        {
          tenant_id: tenantId,
          step_id: stepId,
          user_input: userInput,
        },
        { timeout: 30000 }
      );
      return response.data;
    } catch (error) {
      console.error("Execution service resume failed:", error.message);
      throw new Error(`Failed to resume workflow: ${error.message}`);
    }
  }

  async getWorkflowStatus(instanceId, tenantId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/execution/instances/${instanceId}/status`,
        {
          params: { tenant_id: tenantId },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Execution service status check failed:", error.message);
      throw new Error(`Failed to get workflow status: ${error.message}`);
    }
  }
}

module.exports = new ExecutionServiceClient();
