const axios = require("axios");
const redisClient = require("../config/redis");

class TenantManagerClient {
  constructor() {
    this.baseUrl =
      process.env.TENANT_MANAGER_URL || "http://tenant-manager:3000";
    this.cachePrefix = "workflow_registry:";
    this.cacheTTL = 300; // 5 minutes
  }

  async getWorkflowForEvent(tenantId, triggerEvent) {
    try {
      // Check cache first
      const cacheKey = `${this.cachePrefix}${tenantId}:${triggerEvent}`;
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        console.log(
          `Cache hit for workflow registry: ${tenantId}:${triggerEvent}`
        );
        return JSON.parse(cached);
      }

      // Query tenant manager
      console.log(
        `Querying tenant manager for workflow: ${tenantId}:${triggerEvent}`
      );
      const response = await axios.get(
        `${this.baseUrl}/api/tenants/${tenantId}/workflows/query`,
        {
          params: { trigger_event: triggerEvent },
          timeout: 5000,
        }
      );

      const workflow = response.data.workflow;

      // Cache the result
      await redisClient.setEx(
        cacheKey,
        this.cacheTTL,
        JSON.stringify(workflow)
      );

      return workflow;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`No workflow found for ${tenantId}:${triggerEvent}`);
        return null;
      }

      console.error("Tenant manager query failed:", error.message);
      throw error;
    }
  }

  async invalidateCache(tenantId, triggerEvent) {
    const cacheKey = `${this.cachePrefix}${tenantId}:${triggerEvent}`;
    await redisClient.del(cacheKey);
  }
}

module.exports = new TenantManagerClient();
