const axios = require("axios");

class ApiGatewayClient {
  constructor() {
    this.baseUrl = process.env.API_GATEWAY_URL || "http://api-gateway:3000";
  }

  async triggerWorkflow(workflowId, tenantId, triggerData) {
    try {
      console.log(`Triggering workflow via API Gateway: ${workflowId}`);

      const response = await axios.post(
        `${this.baseUrl}/api/gateway/workflows/trigger`,
        {
          workflow_id: workflowId,
          tenant_id: tenantId,
          trigger_data: triggerData,
          trigger_type: "sync",
        },
        {
          headers: {
            "X-Tenant-ID": tenantId,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("API Gateway workflow trigger failed:", error.message);

      return {
        success: false,
        error: error.message,
        details: error.response?.data,
      };
    }
  }
}

module.exports = new ApiGatewayClient();
