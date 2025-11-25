const integrationServiceClient = require("../clients/integration-service.client");

class StepProcessorService {
  async processStep(step, variables) {
    console.log(`Processing step: ${step.step_name} (type: ${step.type})`);

    switch (step.type) {
      case "start-event":
        return this.processStartEvent(step, variables);
      case "service-task":
        return this.processServiceTask(step, variables);
      case "exclusive-gateway":
        return this.processExclusiveGateway(step, variables);
      case "user-task":
        return this.processUserTask(step, variables);
      case "end-event":
        return this.processEndEvent(step, variables);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  async processStartEvent(step, variables) {
    return {
      success: true,
      nextStep: step.next,
      output: { message: "Workflow started" },
    };
  }

  async processServiceTask(step, variables) {
    const { action, config } = step;

    switch (action) {
      case "api-call":
        return await this.executeApiCall(step, config, variables);
      case "send-notification":
        return await this.sendNotification(step, config, variables);
      default:
        throw new Error(`Unknown service task action: ${action}`);
    }
  }

  async executeApiCall(step, config, variables) {
    // Interpolate variables in endpoint
    let endpoint = config.endpoint;
    Object.keys(variables).forEach((key) => {
      endpoint = endpoint.replace(`{${key}}`, variables[key]);
    });

    const callConfig = {
      method: config.method,
      endpoint: endpoint,
      body: config.body,
      variables: variables,
    };

    const result = await integrationServiceClient.executeApiCall(callConfig);

    // Store output in variable if specified
    let newVariables = {};
    if (config.output_variable && result.success) {
      newVariables[config.output_variable] = result.data;
    }

    return {
      success: result.success,
      nextStep: step.next,
      output: result,
      newVariables,
    };
  }

  async sendNotification(step, config, variables) {
    // Map data from variables
    const notificationData = {};
    if (config.data_mapping) {
      Object.keys(config.data_mapping).forEach((key) => {
        const path = config.data_mapping[key];
        notificationData[key] = this.getNestedValue(variables, path);
      });
    }

    const notificationConfig = {
      channel: config.channel,
      recipient: config.recipient,
      template: config.template,
      data: notificationData,
    };

    const result = await integrationServiceClient.sendNotification(
      notificationConfig
    );

    return {
      success: result.success,
      nextStep: step.next,
      output: result,
    };
  }

  async processExclusiveGateway(step, variables) {
    // Evaluate condition
    const conditionResult = this.evaluateCondition(step.condition, variables);

    const nextStep = conditionResult ? step.branches.true : step.branches.false;

    return {
      success: true,
      nextStep: nextStep,
      output: {
        condition: step.condition,
        result: conditionResult,
        branch: conditionResult ? "true" : "false",
      },
    };
  }

  async processUserTask(step, variables) {
    // For Phase 1, user tasks immediately return WAITING status
    // In later phases, this will integrate with a task management system

    console.log(`User task created: ${step.step_name}`);
    console.log(`Assignment: ${step.config.assignment}`);
    console.log(`Timeout: ${step.config.timeout}`);

    return {
      success: true,
      waiting: true,
      nextStep: step.next,
      output: {
        message: "Waiting for user action",
        assignment: step.config.assignment,
      },
    };
  }

  async processEndEvent(step, variables) {
    return {
      success: true,
      completed: true,
      output: { message: "Workflow completed" },
    };
  }

  evaluateCondition(condition, variables) {
    // Simple condition evaluator
    // Example: "orderDetails.order_value > 10000"

    try {
      // Replace variable paths with actual values
      let evaluableCondition = condition;

      // Find all variable references (e.g., orderDetails.order_value)
      const varPattern =
        /([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/g;
      const matches = condition.match(varPattern);

      if (matches) {
        matches.forEach((match) => {
          const value = this.getNestedValue(variables, match);
          evaluableCondition = evaluableCondition.replace(
            match,
            JSON.stringify(value)
          );
        });
      }

      // Evaluate the condition
      const result = eval(evaluableCondition);
      return Boolean(result);
    } catch (error) {
      console.error("Condition evaluation failed:", error);
      return false;
    }
  }

  getNestedValue(obj, path) {
    const keys = path.split(".");
    let value = obj;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }
}

module.exports = new StepProcessorService();
