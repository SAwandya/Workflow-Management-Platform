const express = require("express");
const axios = require("axios");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();
const WMC_CONTROLLER_URL =
  process.env.WMC_CONTROLLER_URL || "http://wmc-controller:3000";

// Trigger workflow
router.post(
  "/trigger",
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.extractTenantId.bind(authMiddleware),
  async (req, res) => {
    try {
      console.log(`API Gateway: Routing workflow trigger to WMC Controller`);
      console.log(`Tenant ID: ${req.tenantId}`);

      // Forward request to WMC Controller
      const response = await axios.post(
        `${WMC_CONTROLLER_URL}/api/workflows/trigger`,
        req.body,
        {
          headers: {
            "X-Tenant-ID": req.tenantId,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      res.status(response.status).json(response.data);
    } catch (error) {
      console.error("API Gateway: Workflow trigger failed:", error.message);

      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({
          error: "Gateway error",
          details: error.message,
        });
      }
    }
  }
);

// Resume workflow
router.post(
  "/instances/:instanceId/resume",
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.extractTenantId.bind(authMiddleware),
  async (req, res) => {
    try {
      console.log(`API Gateway: Routing workflow resume to WMC Controller`);
      console.log(`Instance ID: ${req.params.instanceId}`);

      const response = await axios.post(
        `${WMC_CONTROLLER_URL}/api/workflows/instances/${req.params.instanceId}/resume`,
        req.body,
        {
          headers: {
            "X-Tenant-ID": req.tenantId,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      res.status(response.status).json(response.data);
    } catch (error) {
      console.error("API Gateway: Workflow resume failed:", error.message);

      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({
          error: "Gateway error",
          details: error.message,
        });
      }
    }
  }
);

// Get workflow status
router.get(
  "/instances/:instanceId/status",
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.extractTenantId.bind(authMiddleware),
  async (req, res) => {
    try {
      const response = await axios.get(
        `${WMC_CONTROLLER_URL}/api/workflows/instances/${req.params.instanceId}/status`,
        {
          params: { tenant_id: req.tenantId },
          timeout: 10000,
        }
      );

      res.json(response.data);
    } catch (error) {
      console.error("API Gateway: Get workflow status failed:", error.message);

      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({
          error: "Gateway error",
          details: error.message,
        });
      }
    }
  }
);

module.exports = router;
