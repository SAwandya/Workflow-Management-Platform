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
      console.log(
        `[TenantManagerClient] Querying workflow for ${tenantId}:${triggerEvent}`
      );

      // Check cache first
      const cacheKey = `${this.cachePrefix}${tenantId}:${triggerEvent}`;
      console.log(`[TenantManagerClient] Cache key: ${cacheKey}`);

      const cached = await redisClient.get(cacheKey);

      if (cached) {
        console.log(
          `[TenantManagerClient] Cache hit for workflow registry: ${tenantId}:${triggerEvent}`
        );
        return JSON.parse(cached);
      }

      // Query tenant manager
      console.log(
        `[TenantManagerClient] Cache miss, querying tenant manager...`
      );
      console.log(
        `[TenantManagerClient] URL: ${this.baseUrl}/api/tenants/${tenantId}/workflows/query?trigger_event=${triggerEvent}`
      );

      const response = await axios.get(
        `${this.baseUrl}/api/tenants/${tenantId}/workflows/query`,
        {
          params: { trigger_event: triggerEvent },
          timeout: 5000,
        }
      );

      console.log(`[TenantManagerClient] Response:`, response.data);

      const workflow = response.data.workflow;

      // Cache the result
      await redisClient.setEx(
        cacheKey,
        this.cacheTTL,
        JSON.stringify(workflow)
      );
      console.log(
        `[TenantManagerClient] Cached workflow for ${tenantId}:${triggerEvent}`
      );

      return workflow;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(
          `[TenantManagerClient] No workflow found for ${tenantId}:${triggerEvent}`
        );
        return null;
      }

      console.error("[TenantManagerClient] Query failed:", error.message);
      if (error.response) {
        console.error(
          "[TenantManagerClient] Response status:",
          error.response.status
        );
        console.error(
          "[TenantManagerClient] Response data:",
          error.response.data
        );
      }
      throw error;
    }
  }

  async invalidateCache(tenantId, triggerEvent) {
    const cacheKey = `${this.cachePrefix}${tenantId}:${triggerEvent}`;
    await redisClient.del(cacheKey);
  }
}

module.exports = new TenantManagerClient();
