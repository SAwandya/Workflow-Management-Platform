const apiCallerService = require("../services/api-caller.service");
const notificationService = require("../services/notification.service");

class IntegrationController {
  async executeApiCall(req, res) {
    try {
      const { method, endpoint, body, headers, variables } = req.body;

      if (!method || !endpoint) {
        return res.status(400).json({
          error: "Missing required fields: method, endpoint",
        });
      }

      // Interpolate variables in endpoint if provided
      let finalEndpoint = endpoint;
      if (variables && Object.keys(variables).length > 0) {
        finalEndpoint = apiCallerService.interpolateVariables(
          endpoint,
          variables
        );
      }

      const result = await apiCallerService.callApi({
        method,
        endpoint: finalEndpoint,
        body,
        headers,
      });

      res.json({
        message: "API call executed",
        result,
      });
    } catch (error) {
      console.error("Error executing API call:", error);
      res.status(500).json({
        error: "Failed to execute API call",
        details: error.message,
      });
    }
  }

  async sendNotification(req, res) {
    try {
      const { channel, recipient, template, data } = req.body;

      if (!channel || !recipient || !template) {
        return res.status(400).json({
          error: "Missing required fields: channel, recipient, template",
        });
      }

      const result = await notificationService.sendNotification({
        channel,
        recipient,
        template,
        data: data || {},
      });

      res.json({
        message: "Notification sent",
        result,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({
        error: "Failed to send notification",
        details: error.message,
      });
    }
  }

  async testConnection(req, res) {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({
          error: "Missing required field: endpoint",
        });
      }

      const result = await apiCallerService.callApi({
        method: "GET",
        endpoint,
      });

      res.json({
        message: "Connection test completed",
        result,
      });
    } catch (error) {
      console.error("Error testing connection:", error);
      res.status(500).json({
        error: "Failed to test connection",
        details: error.message,
      });
    }
  }
}

module.exports = new IntegrationController();
