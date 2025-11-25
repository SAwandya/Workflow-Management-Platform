const tenantManagerClient = require("../clients/tenant-manager.client");
const apiGatewayClient = require("../clients/api-gateway.client");

class TenantWorkflowInterceptor {
  /**
   * Intercepts requests and checks if tenant has custom workflow
   * If workflow exists, triggers it; otherwise continues with default flow
   */
  intercept(triggerEvent) {
    // Return middleware function directly (not async)
    return (req, res, next) => {
      this.checkWorkflow(req, res, next, triggerEvent);
    };
  }

  async checkWorkflow(req, res, next, triggerEvent) {
    try {
      // Extract tenant ID from header
      const tenantId = req.headers["x-tenant-id"];

      if (!tenantId) {
        console.warn("No tenant ID in request, skipping workflow check");
        return next();
      }

      console.log(
        `Workflow interceptor: Checking for ${triggerEvent} workflow for tenant ${tenantId}`
      );

      // Query workflow registry
      const workflow = await tenantManagerClient.getWorkflowForEvent(
        tenantId,
        triggerEvent
      );

      if (!workflow) {
        console.log(`No custom workflow found, proceeding with default flow`);
        return next();
      }

      console.log(`Custom workflow found: ${workflow.workflow_id}`);

      // Store workflow info in request for controller to use
      req.customWorkflow = {
        enabled: true,
        workflowId: workflow.workflow_id,
        triggerType: workflow.trigger_type,
      };

      next();
    } catch (error) {
      console.error("Workflow interceptor error:", error);
      // On error, continue with default flow
      next();
    }
  }

  /**
   * Trigger workflow asynchronously (for async workflows)
   */
  async triggerWorkflowAsync(workflowId, tenantId, triggerData) {
    // For Phase 1, we just log this
    // In later phases, this will publish to event bus
    console.log(`[ASYNC] Would trigger workflow: ${workflowId}`);
    console.log(`[ASYNC] Tenant: ${tenantId}`);
    console.log(`[ASYNC] Data:`, triggerData);

    // Simulate async trigger
    setImmediate(async () => {
      try {
        await apiGatewayClient.triggerWorkflow(
          workflowId,
          tenantId,
          triggerData
        );
      } catch (error) {
        console.error("[ASYNC] Workflow trigger failed:", error);
      }
    });
  }

  /**
   * Trigger workflow synchronously (for sync workflows)
   */
  async triggerWorkflowSync(workflowId, tenantId, triggerData) {
    const result = await apiGatewayClient.triggerWorkflow(
      workflowId,
      tenantId,
      triggerData
    );
    return result;
  }
}

module.exports = new TenantWorkflowInterceptor();
