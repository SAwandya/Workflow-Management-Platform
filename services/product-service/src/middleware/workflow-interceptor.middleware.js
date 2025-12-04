const axios = require("axios");

const TENANT_MANAGER_URL =
  process.env.TENANT_MANAGER_URL || "http://tenant-manager:3000";
const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL || "http://api-gateway:3000";

class WorkflowInterceptor {
  async checkForWorkflow(tenantId, eventType) {
    try {
      console.log(
        `[WorkflowInterceptor] Checking for workflow: ${tenantId}:${eventType}`
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
        console.log(
          `[WorkflowInterceptor] ✓ Custom workflow found: ${workflow.workflow_id}`
        );
        return workflow;
      }

      console.log("[WorkflowInterceptor] No custom workflow found");
      return null;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(
          "[WorkflowInterceptor] No workflow registered for this event"
        );
        return null;
      }

      console.error(
        "[WorkflowInterceptor] Error checking for workflow:",
        error.message
      );
      return null; // Don't throw - order creation should succeed even if workflow check fails
    }
  }

  async triggerWorkflow(workflowId, tenantId, triggerData) {
    try {
      console.log(`[WorkflowInterceptor] Triggering workflow: ${workflowId}`);
      console.log(`[WorkflowInterceptor] Trigger data:`, triggerData);

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

      console.log("[WorkflowInterceptor] ✓ Workflow triggered successfully");
      return {
        instanceId: response.data.instanceId,
        status: response.data.status,
      };
    } catch (error) {
      console.error(
        "[WorkflowInterceptor] Failed to trigger workflow:",
        error.message
      );

      // Return error but don't throw - order should still be created
      return {
        instanceId: null,
        status: "FAILED",
        error: error.message,
      };
    }
  }
}

module.exports = new WorkflowInterceptor();
