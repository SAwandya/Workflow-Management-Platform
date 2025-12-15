const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const WORKFLOW_SERVICE_URL =
  process.env.WORKFLOW_SERVICE_URL || "http://workflow-service:3000";

class WorkflowExecutorService {
  async startWorkflow(workflowId, tenantId, triggerData) {
    console.log(
      `[WorkflowExecutor] Starting workflow: ${workflowId} for tenant: ${tenantId}`
    );

    try {
      // 1. Load workflow definition
      console.log(
        "[WorkflowExecutor] Attempting to load workflow from Workflow Service..."
      );
      const workflowDef = await this.loadWorkflowFromService(
        workflowId,
        tenantId
      );

      if (!workflowDef) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      console.log("[WorkflowExecutor] Using workflow from database");

      // 2. Generate instance ID
      const instanceId = `inst-${uuidv4()}`;
      console.log(`[WorkflowExecutor] Generated instance ID: ${instanceId}`);

      // 3. Create workflow instance record
      const workflowInstanceRepository = require("../repositories/workflow-instance.repository");
      await workflowInstanceRepository.create({
        instance_id: instanceId,
        workflow_id: workflowId,
        tenant_id: tenantId,
        status: "RUNNING",
        trigger_data: triggerData,
      });
      console.log(`[WorkflowExecutor] ✓ Workflow instance created`);

      // 4. Initialize workflow variables
      const variables = {
        ...triggerData,
        tenant_id: tenantId,
      };

      // 5. Create workflow state
      const workflowStateRepository = require("../repositories/workflow-state.repository");
      await workflowStateRepository.create({
        instance_id: instanceId,
        current_step: null,
        variables: variables,
      });
      console.log(`[WorkflowExecutor] ✓ Workflow state initialized`);

      // 6. Find start step
      const startStep = this.findStartStep(workflowDef.steps_json.steps);
      if (!startStep) {
        throw new Error("No start event found in workflow");
      }

      console.log(
        `[WorkflowExecutor] Starting workflow at step: ${startStep.step_id} (${startStep.step_name})`
      );

      // 7. Start executing from start step (async - don't wait)
      setImmediate(() => {
        this.executeNextStep(
          instanceId,
          tenantId,
          startStep.step_id,
          workflowDef.steps_json,
          variables
        ).catch((error) => {
          console.error("[WorkflowExecutor] Workflow execution failed:", error);
        });
      });

      // 8. Return immediately (for sync trigger)
      return {
        instanceId: instanceId,
        status: "RUNNING",
        workflowId: workflowId,
      };
    } catch (error) {
      console.error("[WorkflowExecutor] Failed to start workflow:", error);
      throw error;
    }
  }

  async loadWorkflowFromService(workflowId, tenantId) {
    try {
      const response = await axios.get(
        `${WORKFLOW_SERVICE_URL}/api/workflows/${workflowId}`,
        {
          headers: { "X-Tenant-ID": tenantId },
          timeout: 5000,
        }
      );

      console.log("[WorkflowServiceClient] Workflow fetched successfully");
      return response.data.workflow;
    } catch (error) {
      console.error(
        "[WorkflowServiceClient] Failed to fetch workflow:",
        error.message
      );
      return null;
    }
  }

  findStartStep(steps) {
    if (!steps || steps.length === 0) {
      return null;
    }

    // Look for explicit start event
    let startStep = steps.find((s) => s.type === "start-event");

    if (startStep) {
      return startStep;
    }

    // If no start event found, look for step with ID "1" or "auto-start"
    startStep = steps.find(
      (s) => s.step_id === "1" || s.step_id === 1 || s.step_id === "auto-start"
    );

    if (startStep) {
      console.log(`Using step ${startStep.step_id} as start event`);
      return startStep;
    }

    // Last resort: use first step
    console.warn("No explicit start event found, using first step");
    return steps[0];
  }

  async executeNextStep(instanceId, tenantId, stepId, workflowDef, variables) {
    try {
      const stepProcessorService = require("./step-processor.service");
      const step = stepProcessorService.findStep(workflowDef, stepId);

      if (!step) {
        console.error(`Step ${stepId} not found in workflow definition`);
        await this.markWorkflowFailed(instanceId, `Step not found: ${stepId}`);
        return;
      }

      console.log(
        `Executing step: ${step.step_id} (${step.step_name}) - Type: ${step.type}`
      );

      // Check if this is a user task - PAUSE execution and set WAITING status
      if (step.type === "user-task") {
        console.log(
          `✓ User task detected: ${step.step_id}. Setting workflow to WAITING status.`
        );

        const workflowInstanceRepository = require("../repositories/workflow-instance.repository");
        await workflowInstanceRepository.updateStatus(instanceId, "WAITING");

        const workflowStateRepository = require("../repositories/workflow-state.repository");
        await workflowStateRepository.update(instanceId, {
          current_step: step.step_id,
          variables,
        });

        // Log step as started (waiting for user input)
        await stepProcessorService.processStep(
          instanceId,
          tenantId,
          stepId,
          workflowDef,
          variables
        );

        console.log(
          `✓ Workflow ${instanceId} is now WAITING for user input at step ${step.step_id}`
        );
        return; // STOP execution here - wait for resume
      }

      // For other step types, process normally
      const result = await stepProcessorService.processStep(
        instanceId,
        tenantId,
        stepId,
        workflowDef,
        variables
      );

      // Update variables with step result
      if (result && result.output) {
        variables = { ...variables, ...result.output };

        const workflowStateRepository = require("../repositories/workflow-state.repository");
        await workflowStateRepository.update(instanceId, { variables });
      }

      // Get next step
      const nextStepId = stepProcessorService.getNextStepId(step, variables);

      if (nextStepId) {
        await this.executeNextStep(
          instanceId,
          tenantId,
          nextStepId,
          workflowDef,
          variables
        );
      } else {
        console.log(`Workflow ${instanceId} completed successfully`);
        const workflowInstanceRepository = require("../repositories/workflow-instance.repository");
        await workflowInstanceRepository.updateStatus(instanceId, "COMPLETED");
      }
    } catch (error) {
      console.error("Step execution error:", error);
      await this.markWorkflowFailed(instanceId, error.message);
    }
  }

  async markWorkflowFailed(instanceId, errorMessage) {
    try {
      const workflowInstanceRepository = require("../repositories/workflow-instance.repository");
      await workflowInstanceRepository.updateStatus(
        instanceId,
        "FAILED",
        errorMessage
      );
      console.log(`Workflow ${instanceId} marked as FAILED`);
    } catch (error) {
      console.error("Failed to mark workflow as failed:", error);
    }
  }

  async getWorkflowStatus(instanceId, tenantId) {
    try {
      console.log(
        `[WorkflowExecutor] Getting status for workflow instance: ${instanceId}, tenant: ${tenantId}`
      );

      // Get workflow instance
      const workflowInstanceRepository = require("../repositories/workflow-instance.repository");
      const instance = await workflowInstanceRepository.findById(
        instanceId,
        tenantId
      );

      if (!instance) {
        throw new Error(`Workflow instance ${instanceId} not found`);
      }

      // Get workflow state
      const workflowStateRepository = require("../repositories/workflow-state.repository");
      const state = await workflowStateRepository.findByInstanceId(instanceId);

      // Get step history
      const stepHistoryRepository = require("../repositories/step-history.repository");
      const history = await stepHistoryRepository.findByInstanceId(instanceId);

      return {
        instance,
        state,
        history: history || [],
      };
    } catch (error) {
      console.error(`[WorkflowExecutor] Failed to get workflow status:`, error);
      throw error;
    }
  }
}

module.exports = new WorkflowExecutorService();
