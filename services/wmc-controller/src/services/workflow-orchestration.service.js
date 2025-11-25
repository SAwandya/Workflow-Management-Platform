const executionServiceClient = require("../clients/execution-service.client");

class WorkflowOrchestrationService {
  async handleWorkflowTrigger(
    workflowId,
    tenantId,
    triggerData,
    triggerType = "sync"
  ) {
    console.log(
      `Orchestrating workflow trigger: ${workflowId} for tenant: ${tenantId}`
    );
    console.log(`Trigger type: ${triggerType}`);

    try {
      // Validate input
      if (!workflowId || !tenantId) {
        throw new Error("Missing required parameters: workflowId, tenantId");
      }

      // For Phase 1, we only support synchronous triggers
      if (triggerType === "async") {
        console.warn(
          "Async triggers not yet implemented in Phase 1, treating as sync"
        );
      }

      // Delegate to execution service
      const result = await executionServiceClient.triggerWorkflow(
        workflowId,
        tenantId,
        triggerData
      );

      console.log(
        `Workflow triggered successfully. Instance ID: ${result.instanceId}`
      );

      return {
        success: true,
        instanceId: result.instanceId,
        status: result.status,
        message: result.message,
      };
    } catch (error) {
      console.error("Workflow orchestration failed:", error);

      return {
        success: false,
        error: error.message,
        fallback: "Execute default product flow",
      };
    }
  }

  async handleWorkflowResume(instanceId, tenantId, stepId, userInput) {
    console.log(
      `Orchestrating workflow resume: ${instanceId} for tenant: ${tenantId}`
    );

    try {
      const result = await executionServiceClient.resumeWorkflow(
        instanceId,
        tenantId,
        stepId,
        userInput
      );

      console.log(`Workflow resumed successfully. Status: ${result.status}`);

      return {
        success: true,
        status: result.status,
        message: result.message,
      };
    } catch (error) {
      console.error("Workflow resume failed:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getWorkflowStatus(instanceId, tenantId) {
    try {
      const status = await executionServiceClient.getWorkflowStatus(
        instanceId,
        tenantId
      );
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      console.error("Get workflow status failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new WorkflowOrchestrationService();
