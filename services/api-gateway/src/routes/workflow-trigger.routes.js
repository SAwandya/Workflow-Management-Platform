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
  async (req, res) => {
    try {
      // Try to extract tenant ID from multiple sources
      let tenantId = req.tenantId; // From JWT

      if (!tenantId) {
        tenantId = req.headers["x-tenant-id"]; // From header
      }

      if (!tenantId) {
        tenantId = req.body.tenant_id; // From body
      }

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing required field: tenant_id",
          message:
            "Please provide tenant ID via header (X-Tenant-ID) or request body",
        });
      }

      console.log(
        `API Gateway: Resuming workflow instance ${req.params.instanceId}, tenant ${tenantId}`
      );

      // Add tenant_id to body if not present
      const requestBody = {
        ...req.body,
        tenant_id: tenantId,
      };

      const response = await axios.post(
        `${WMC_CONTROLLER_URL}/api/workflows/instances/${req.params.instanceId}/resume`,
        requestBody,
        {
          headers: {
            "X-Tenant-ID": tenantId,
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
  async (req, res) => {
    try {
      // Try to extract tenant ID from multiple sources
      let tenantId = req.tenantId; // From JWT

      if (!tenantId) {
        tenantId = req.headers["x-tenant-id"]; // From header
      }

      if (!tenantId) {
        tenantId = req.query.tenant_id; // From query parameter
      }

      if (!tenantId) {
        return res.status(400).json({
          error: "Tenant ID not found",
          message:
            "Please provide tenant ID via header (X-Tenant-ID) or query parameter (tenant_id)",
        });
      }

      console.log(
        `API Gateway: Getting workflow status for instance ${req.params.instanceId}, tenant ${tenantId}`
      );

      const response = await axios.get(
        `${WMC_CONTROLLER_URL}/api/workflows/instances/${req.params.instanceId}/status`,
        {
          params: { tenant_id: tenantId },
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

// Get recent workflow instances
router.get(
  "/instances/recent",
  authMiddleware.authenticate.bind(authMiddleware),
  async (req, res) => {
    try {
      // Try to extract tenant ID from multiple sources
      let tenantId = req.tenantId; // From JWT

      if (!tenantId) {
        tenantId = req.headers["x-tenant-id"]; // From header
      }

      if (!tenantId) {
        tenantId = req.query.tenant_id; // From query parameter
      }

      if (!tenantId) {
        return res.status(400).json({
          error: "Tenant ID not found",
          message:
            "Please provide tenant ID via header (X-Tenant-ID) or query parameter (tenant_id)",
        });
      }

      const limit = parseInt(req.query.limit) || 10;

      console.log(
        `API Gateway: Getting recent workflow instances for tenant ${tenantId}`
      );

      const response = await axios.get(
        `${WMC_CONTROLLER_URL}/api/workflows/instances/recent`,
        {
          params: { tenant_id: tenantId, limit },
          timeout: 10000,
        }
      );

      res.json(response.data);
    } catch (error) {
      console.error("API Gateway: Get recent instances failed:", error.message);

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
