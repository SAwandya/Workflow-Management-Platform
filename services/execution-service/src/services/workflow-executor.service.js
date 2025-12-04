const { v4: uuidv4 } = require("uuid");
const { getWorkflowDefinition } = require("../workflows/hardcoded-workflows");
const workflowServiceClient = require("../clients/workflow-service.client");
const workflowInstanceRepository = require("../repositories/workflow-instance.repository");
const executionStateRepository = require("../repositories/execution-state.repository");
const stepHistoryRepository = require("../repositories/step-history.repository");
const stepProcessorService = require("./step-processor.service");

class WorkflowExecutorService {
  async startWorkflow(workflowId, tenantId, triggerData) {
    // Try to load workflow from Workflow Service (Phase 2)
    let workflowDef;
    try {
      console.log(
        "[WorkflowExecutor] Attempting to load workflow from Workflow Service..."
      );
      const dbWorkflow = await workflowServiceClient.getWorkflow(
        workflowId,
        tenantId
      );

      if (dbWorkflow && dbWorkflow.status === "APPROVED") {
        console.log("[WorkflowExecutor] Using workflow from database");
        workflowDef = {
          workflow_id: dbWorkflow.workflow_id,
          tenant_id: dbWorkflow.tenant_id,
          name: dbWorkflow.name,
          steps: dbWorkflow.steps_json.steps || [],
        };
      } else {
        console.log(
          "[WorkflowExecutor] Workflow not approved or not found, falling back to hardcoded"
        );
        workflowDef = getWorkflowDefinition(workflowId);
      }
    } catch (error) {
      console.log(
        "[WorkflowExecutor] Workflow Service unavailable, using hardcoded definition"
      );
      workflowDef = getWorkflowDefinition(workflowId);
    }

    if (!workflowDef) {
      throw new Error(`Workflow definition not found: ${workflowId}`);
    }

    // Validate tenant ownership
    if (workflowDef.tenant_id !== tenantId) {
      throw new Error(
        `Workflow ${workflowId} does not belong to tenant ${tenantId}`
      );
    }

    // Create workflow instance
    const instanceId = `inst-${uuidv4()}`;
    await workflowInstanceRepository.create(
      instanceId,
      workflowId,
      tenantId,
      triggerData
    );

    // Initialize execution state
    const initialVariables = {
      ...triggerData,
      tenant_id: tenantId, // Add tenant_id to variables
    };
    await executionStateRepository.create(instanceId, "1", initialVariables);

    console.log(`Workflow instance created: ${instanceId}`);

    // Find the start event - flexible search
    const startStep = this.findStartStep(workflowDef.steps);

    if (!startStep) {
      throw new Error("No start event found in workflow");
    }

    console.log(
      `Starting workflow at step: ${startStep.step_id} (${startStep.step_name})`
    );

    // Start executing from start step
    await this.executeNextStep(
      instanceId,
      tenantId,
      startStep.step_id,
      workflowDef,
      initialVariables
    );

    return {
      instanceId,
      status: "RUNNING",
      message: "Workflow started",
    };
  }

  /**
   * Find start step - supports multiple formats
   */
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

    // Last resort: use first step if it doesn't have incoming connections
    // (This would require tracking connections, so just use first step)
    console.warn("No explicit start event found, using first step");
    return steps[0];
  }

  async executeNextStep(instanceId, tenantId, stepId, workflowDef, variables) {
    try {
      // Use step processor's find method
      const step = stepProcessorService.findStep(workflowDef, stepId);

      if (!step) {
        console.error(`Step ${stepId} not found in workflow definition`);
        await this.markWorkflowFailed(instanceId, `Step not found: ${stepId}`);
        return;
      }

      // Log step start
      const stepHistory = await stepHistoryRepository.create(
        instanceId,
        step.step_name,
        step.type,
        "STARTED",
        { variables }
      );

      try {
        // Process step
        const result = await stepProcessorService.processStep(step, variables);

        // Update variables if step produced output
        if (result.newVariables) {
          variables = { ...variables, ...result.newVariables };
        }

        // Log step completion
        await stepHistoryRepository.complete(
          stepHistory.step_id,
          "COMPLETED",
          result.output
        );

        // Check if workflow should wait (user task)
        if (result.waiting) {
          await workflowInstanceRepository.updateStatus(instanceId, "WAITING");
          await executionStateRepository.update(instanceId, stepId, variables);

          return {
            status: "WAITING",
            message: "Workflow waiting for user action",
            currentStep: step.step_name,
          };
        }

        // Check if workflow is completed
        if (result.completed) {
          await workflowInstanceRepository.updateStatus(
            instanceId,
            "COMPLETED"
          );
          await executionStateRepository.update(instanceId, stepId, variables);

          return {
            status: "COMPLETED",
            message: "Workflow completed successfully",
          };
        }

        // Get next step using processor's method
        const nextStepId = stepProcessorService.getNextStepId(step, variables);

        if (nextStepId) {
          // Recursively execute next step
          await this.executeNextStep(
            instanceId,
            tenantId,
            nextStepId,
            workflowDef,
            variables
          );
        } else {
          // No next step found, mark workflow as completed
          await workflowInstanceRepository.updateStatus(
            instanceId,
            "COMPLETED"
          );
          await executionStateRepository.update(instanceId, stepId, variables);
        }
      } catch (stepError) {
        console.error(`Step execution failed: ${step.step_name}`, stepError);

        // Log step failure
        await stepHistoryRepository.complete(
          stepHistory.step_id,
          "FAILED",
          null,
          stepError.message
        );

        // Mark workflow as failed
        await workflowInstanceRepository.updateStatus(
          instanceId,
          "FAILED",
          stepError.message
        );

        throw stepError;
      }
    } catch (error) {
      console.error(`Workflow execution failed: ${instanceId}`, error);

      await workflowInstanceRepository.updateStatus(
        instanceId,
        "FAILED",
        error.message
      );

      return {
        status: "FAILED",
        message: error.message,
      };
    }
  }

  async resumeWorkflow(instanceId, tenantId, stepId, userInput) {
    // Get workflow instance
    const instance = await workflowInstanceRepository.findById(
      instanceId,
      tenantId
    );
    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    if (instance.status !== "WAITING") {
      throw new Error(`Cannot resume workflow with status: ${instance.status}`);
    }

    // Load workflow definition
    const workflowDef = getWorkflowDefinition(instance.workflow_id);
    if (!workflowDef) {
      throw new Error(`Workflow definition not found: ${instance.workflow_id}`);
    }

    // Update workflow status to RUNNING
    await workflowInstanceRepository.updateStatus(instanceId, "RUNNING");

    // Get current state and update with user input
    const state = await executionStateRepository.findByInstanceId(instanceId);
    const variables = { ...state.variables, ...userInput };
    await executionStateRepository.updateVariables(instanceId, userInput);

    // Continue execution from next step
    const currentStep = this.findStep(workflowDef.steps, state.current_step);
    const nextStepId = currentStep.next;

    // Update current step to next
    await executionStateRepository.update(instanceId, nextStepId, variables);

    // Continue execution
    return await this.executeWorkflow(instanceId, workflowDef, tenantId);
  }

  findStep(steps, stepId) {
    return steps.find((s) => s.step_id === stepId);
  }

  async getWorkflowStatus(instanceId, tenantId) {
    const instance = await workflowInstanceRepository.findById(
      instanceId,
      tenantId
    );
    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    const state = await executionStateRepository.findByInstanceId(instanceId);
    const history = await stepHistoryRepository.findByInstanceId(instanceId);

    return {
      instance,
      state,
      history,
    };
  }
}

module.exports = new WorkflowExecutorService();
