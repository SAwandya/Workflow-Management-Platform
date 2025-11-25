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

    // Extract tenant_id from variables to pass as header
    const headers = config.headers || {};
    if (variables.tenant_id) {
      headers["X-Tenant-ID"] = variables.tenant_id;
    }

    const callConfig = {
      method: config.method,
      endpoint: endpoint,
      body: config.body,
      headers: headers,
      variables: variables,
    };

    const result = await integrationServiceClient.executeApiCall(callConfig);

    // Store output in variable if specified
    let newVariables = {};
    if (config.output_variable && result.success) {
      // Deep clone the data to avoid reference issues
      let outputData = JSON.parse(JSON.stringify(result.data));

      // Convert numeric strings to numbers for comparison operations
      if (outputData && typeof outputData === "object") {
        this.convertNumericStrings(outputData);
      }

      newVariables[config.output_variable] = outputData;
      console.log(
        `[executeApiCall] Stored ${config.output_variable}:`,
        newVariables[config.output_variable]
      );
    }

    return {
      success: result.success,
      nextStep: step.next,
      output: result,
      newVariables,
    };
  }

  // Helper method to convert numeric strings to numbers
  convertNumericStrings(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        // If it's an object, recurse
        if (value && typeof value === "object") {
          this.convertNumericStrings(value);
        }
        // If it's a string that looks like a number, convert it
        else if (typeof value === "string" && /^\d+\.?\d*$/.test(value)) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            console.log(
              `[convertNumericStrings] Converting ${key}: "${value}" (string) → ${numValue} (number)`
            );
            obj[key] = numValue;
          }
        }
      }
    }
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
    console.log("=== Gateway Evaluation ===");
    console.log("Condition:", step.condition);
    console.log("Variables:", JSON.stringify(variables, null, 2));

    const conditionResult = this.evaluateCondition(step.condition, variables);

    console.log("Condition Result:", conditionResult);
    console.log(
      "Branching to:",
      conditionResult ? "TRUE branch" : "FALSE branch"
    );

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
    try {
      console.log("[Condition Evaluator] Input condition:", condition);
      console.log(
        "[Condition Evaluator] Variables:",
        JSON.stringify(variables, null, 2)
      );

      // Replace variable paths with actual values
      let evaluableCondition = condition;

      // Find all variable references (e.g., orderDetails.order_value)
      const varPattern =
        /([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/g;
      const matches = [...new Set(condition.match(varPattern) || [])];

      console.log("[Condition Evaluator] Found variables:", matches);

      if (matches) {
        matches.forEach((match) => {
          // Skip operator keywords
          if (
            ["true", "false", "null", "undefined"].includes(match.toLowerCase())
          ) {
            return;
          }

          const value = this.getNestedValue(variables, match);
          console.log(
            `[Condition Evaluator] ${match} = ${JSON.stringify(
              value
            )} (type: ${typeof value})`
          );

          // Replace with the actual value
          if (value !== undefined) {
            // Use regex with word boundaries to avoid partial matches
            const regex = new RegExp(
              `\\b${match.replace(/\./g, "\\.")}\\b`,
              "g"
            );
            evaluableCondition = evaluableCondition.replace(
              regex,
              JSON.stringify(value)
            );
          }
        });
      }

      console.log(
        "[Condition Evaluator] Evaluable condition:",
        evaluableCondition
      );

      // Evaluate the condition
      const result = eval(evaluableCondition);
      console.log(
        "[Condition Evaluator] Result:",
        result,
        "(type:",
        typeof result,
        ")"
      );

      return Boolean(result);
    } catch (error) {
      console.error("[Condition Evaluator] Evaluation failed:", error);
      console.error("[Condition Evaluator] Condition was:", condition);
      console.error("[Condition Evaluator] Variables were:", variables);
      return false;
    }
  }

  getNestedValue(obj, path) {
    const keys = path.split(".");
    let value = obj;

    console.log(`[getNestedValue] Looking up path: ${path}`);
    console.log(
      `[getNestedValue] Starting object:`,
      JSON.stringify(obj, null, 2)
    );

    for (const key of keys) {
      console.log(
        `[getNestedValue] Current key: ${key}, Current value type: ${typeof value}`
      );

      if (value && typeof value === "object" && key in value) {
        value = value[key];
        console.log(`[getNestedValue] Found ${key}:`, value);
      } else {
        console.log(
          `[getNestedValue] Key "${key}" not found or value is not an object`
        );
        return undefined;
      }
    }

    console.log(
      `[getNestedValue] Final value for ${path}:`,
      value,
      `(type: ${typeof value})`
    );
    return value;
  }
}

module.exports = new StepProcessorService();
