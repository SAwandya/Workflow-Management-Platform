const tenantRepository = require("../repositories/tenant.repository");

class TenantController {
  async createTenant(req, res) {
    try {
      const { tenant_id, name } = req.body;

      if (!tenant_id || !name) {
        return res.status(400).json({
          error: "Missing required fields: tenant_id, name",
        });
      }

      // Check if tenant already exists
      const exists = await tenantRepository.exists(tenant_id);
      if (exists) {
        return res.status(409).json({
          error: "Tenant already exists",
          tenant_id,
        });
      }

      const tenant = await tenantRepository.create(tenant_id, name);

      res.status(201).json({
        message: "Tenant created successfully",
        tenant,
      });
    } catch (error) {
      console.error("Error creating tenant:", error);
      res.status(500).json({
        error: "Failed to create tenant",
        details: error.message,
      });
    }
  }

  async getTenant(req, res) {
    try {
      const { tenantId } = req.params;

      const tenant = await tenantRepository.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          error: "Tenant not found",
          tenant_id: tenantId,
        });
      }

      res.json({ tenant });
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({
        error: "Failed to fetch tenant",
        details: error.message,
      });
    }
  }

  async listTenants(req, res) {
    try {
      const tenants = await tenantRepository.findAll();

      res.json({
        count: tenants.length,
        tenants,
      });
    } catch (error) {
      console.error("Error listing tenants:", error);
      res.status(500).json({
        error: "Failed to list tenants",
        details: error.message,
      });
    }
  }

  async updateTenantStatus(req, res) {
    try {
      const { tenantId } = req.params;
      const { status } = req.body;

      const validStatuses = ["ACTIVE", "SUSPENDED", "INACTIVE"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: "Invalid status",
          validStatuses,
        });
      }

      const tenant = await tenantRepository.updateStatus(tenantId, status);

      if (!tenant) {
        return res.status(404).json({
          error: "Tenant not found",
          tenant_id: tenantId,
        });
      }

      res.json({
        message: "Tenant status updated successfully",
        tenant,
      });
    } catch (error) {
      console.error("Error updating tenant status:", error);
      res.status(500).json({
        error: "Failed to update tenant status",
        details: error.message,
      });
    }
  }

  async deleteTenant(req, res) {
    try {
      const { tenantId } = req.params;

      const tenant = await tenantRepository.delete(tenantId);

      if (!tenant) {
        return res.status(404).json({
          error: "Tenant not found",
          tenant_id: tenantId,
        });
      }

      res.json({
        message: "Tenant deleted successfully",
        tenant,
      });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({
        error: "Failed to delete tenant",
        details: error.message,
      });
    }
  }
}

module.exports = new TenantController();
