const axios = require("axios");

const TENANT_MANAGER_URL =
  process.env.TENANT_MANAGER_URL || "http://tenant-manager:3000";
const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL || "http://api-gateway:3000";

class WorkflowInterceptor {
  async checkForWorkflow(tenantId, eventType) {
    try {
      console.log(
        `Workflow interceptor: Checking for ${eventType} workflow for tenant ${tenantId}`
      );

      const response = await axios.get(
        `${TENANT_MANAGER_URL}/api/tenants/${tenantId}/workflows/query`,
        {
          params: { trigger_event: eventType },
          timeout: 5000,
        }
      );

      if (response.data.workflows && response.data.workflows.length > 0) {
        const workflow = response.data.workflows[0];
        console.log(`Custom workflow found: ${workflow.workflow_id}`);
        return workflow;
      }

      console.log("No custom workflow found, will use default behavior");
      return null;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("No workflow registered for this event");
      } else {
        console.error("Error checking for workflow:", error.message);
      }
      return null;
    }
  }

  async triggerWorkflow(workflowId, tenantId, triggerData) {
    try {
      console.log(
        `Triggering custom workflow: ${workflowId} for tenant: ${tenantId}`
      );

      const response = await axios.post(
        `${API_GATEWAY_URL}/api/gateway/workflows/start`,
        {
          workflow_id: workflowId,
          tenant_id: tenantId,
          trigger_data: triggerData,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      console.log("Workflow triggered successfully:", response.data);
      return {
        instanceId: response.data.instanceId,
        status: response.data.status,
      };
    } catch (error) {
      console.error("Failed to trigger workflow:", error.message);
      // Don't throw - order creation should succeed even if workflow fails
      return {
        instanceId: null,
        status: "FAILED",
        error: error.message,
      };
    }
  }
}

module.exports = new WorkflowInterceptor();
