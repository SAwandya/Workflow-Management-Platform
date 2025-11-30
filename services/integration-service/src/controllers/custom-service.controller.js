const { v4: uuidv4 } = require("uuid");
const customServiceRepository = require("../repositories/custom-service.repository");

class CustomServiceController {
  async createCustomService(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const {
        service_id,
        name,
        description,
        endpoint_url,
        authentication_type,
        authentication_config,
        parameters_schema,
        response_schema,
      } = req.body;

      // Validate required fields
      if (!name || !endpoint_url || !parameters_schema) {
        return res.status(400).json({
          error:
            "Missing required fields: name, endpoint_url, parameters_schema",
        });
      }

      // Generate service_id if not provided
      const finalServiceId = service_id || `custom.${tenantId}.${uuidv4()}`;

      // Check if service_id already exists
      const exists = await customServiceRepository.exists(finalServiceId);
      if (exists) {
        return res.status(409).json({
          error: "Service ID already exists",
          service_id: finalServiceId,
        });
      }

      const serviceData = {
        tenant_id: tenantId,
        service_id: finalServiceId,
        name,
        description,
        endpoint_url,
        authentication_type,
        authentication_config,
        parameters_schema,
        response_schema,
      };

      const customService = await customServiceRepository.create(serviceData);

      res.status(201).json({
        message: "Custom service created successfully",
        service: customService,
      });
    } catch (error) {
      console.error("Error creating custom service:", error);
      res.status(500).json({
        error: "Failed to create custom service",
        details: error.message,
      });
    }
  }

  async listCustomServices(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const services = await customServiceRepository.findByTenant(tenantId);

      res.json({
        tenant_id: tenantId,
        count: services.length,
        services,
      });
    } catch (error) {
      console.error("Error listing custom services:", error);
      res.status(500).json({
        error: "Failed to list custom services",
        details: error.message,
      });
    }
  }

  async getCustomService(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { customServiceId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const service = await customServiceRepository.findById(
        customServiceId,
        tenantId
      );

      if (!service) {
        return res.status(404).json({
          error: "Custom service not found",
          custom_service_id: customServiceId,
        });
      }

      res.json({ service });
    } catch (error) {
      console.error("Error fetching custom service:", error);
      res.status(500).json({
        error: "Failed to fetch custom service",
        details: error.message,
      });
    }
  }

  async updateCustomService(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { customServiceId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const service = await customServiceRepository.update(
        customServiceId,
        tenantId,
        req.body
      );

      if (!service) {
        return res.status(404).json({
          error: "Custom service not found",
          custom_service_id: customServiceId,
        });
      }

      res.json({
        message: "Custom service updated successfully",
        service,
      });
    } catch (error) {
      console.error("Error updating custom service:", error);
      res.status(500).json({
        error: "Failed to update custom service",
        details: error.message,
      });
    }
  }

  async deleteCustomService(req, res) {
    try {
      const tenantId = req.headers["x-tenant-id"];
      const { customServiceId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          error: "Missing X-Tenant-ID header",
        });
      }

      const service = await customServiceRepository.delete(
        customServiceId,
        tenantId
      );

      if (!service) {
        return res.status(404).json({
          error: "Custom service not found",
          custom_service_id: customServiceId,
        });
      }

      res.json({
        message: "Custom service deleted successfully",
        service,
      });
    } catch (error) {
      console.error("Error deleting custom service:", error);
      res.status(500).json({
        error: "Failed to delete custom service",
        details: error.message,
      });
    }
  }
}

module.exports = new CustomServiceController();
