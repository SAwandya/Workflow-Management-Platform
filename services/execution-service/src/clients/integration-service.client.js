const axios = require("axios");

class IntegrationServiceClient {
  constructor() {
    this.baseUrl =
      process.env.INTEGRATION_SERVICE_URL || "http://integration-service:3000";
  }

  async executeApiCall(config) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/integration/api-call`,
        config,
        { timeout: 10000 }
      );
      return response.data.result;
    } catch (error) {
      console.error("Integration service API call failed:", error.message);
      throw error;
    }
  }

  async sendNotification(config) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/integration/notification`,
        config,
        { timeout: 10000 }
      );
      return response.data.result;
    } catch (error) {
      console.error("Integration service notification failed:", error.message);
      throw error;
    }
  }
}

module.exports = new IntegrationServiceClient();
