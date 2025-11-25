const { v4: uuidv4 } = require("uuid");
const { getWorkflowDefinition } = require("../workflows/hardcoded-workflows");
const workflowInstanceRepository = require("../repositories/workflow-instance.repository");
const executionStateRepository = require("../repositories/execution-state.repository");
const stepHistoryRepository = require("../repositories/step-history.repository");
const stepProcessorService = require("./step-processor.service");

class WorkflowExecutorService {
  async startWorkflow(workflowId, tenantId, triggerData) {
    // Load workflow definition
    const workflowDef = getWorkflowDefinition(workflowId);
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

    // Start execution
    const result = await this.executeWorkflow(
      instanceId,
      workflowDef,
      tenantId
    );

    return {
      instanceId,
      status: result.status,
      message: result.message,
    };
  }

  async executeWorkflow(instanceId, workflowDef, tenantId) {
    try {
      // Get current execution state
      let state = await executionStateRepository.findByInstanceId(instanceId);
      let currentStepId = state.current_step;
      let variables = state.variables;

      // Execute steps sequentially
      while (currentStepId) {
        const step = this.findStep(workflowDef.steps, currentStepId);
        if (!step) {
          throw new Error(`Step not found: ${currentStepId}`);
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
          const result = await stepProcessorService.processStep(
            step,
            variables
          );

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
            await workflowInstanceRepository.updateStatus(
              instanceId,
              "WAITING"
            );
            await executionStateRepository.update(
              instanceId,
              currentStepId,
              variables
            );

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
            await executionStateRepository.update(
              instanceId,
              currentStepId,
              variables
            );

            return {
              status: "COMPLETED",
              message: "Workflow completed successfully",
            };
          }

          // Move to next step
          currentStepId = result.nextStep;
          await executionStateRepository.update(
            instanceId,
            currentStepId,
            variables
          );
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
      }

      // Should not reach here
      throw new Error("Workflow ended without reaching end event");
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
