const Joi = require("joi");

class ValidationService {
  /**
   * Validate workflow structure
   */
  validateWorkflow(workflowData) {
    const schema = Joi.object({
      workflow_id: Joi.string().required(),
      tenant_id: Joi.string().required(),
      name: Joi.string().min(3).max(255).required(),
      description: Joi.string().allow("", null),
      bpmn_xml: Joi.string().allow("", null),
      steps_json: Joi.object().required(),
      version: Joi.string().default("1.0"),
      created_by: Joi.string().required(),
    });

    return schema.validate(workflowData);
  }

  /**
   * Validate steps_json structure
   */
  validateSteps(stepsJson) {
    const errors = [];

    // Check if steps is an array
    if (!Array.isArray(stepsJson.steps)) {
      errors.push('steps_json must contain a "steps" array');
      return { valid: false, errors };
    }

    const steps = stepsJson.steps;

    // Check for start and end events
    const hasStart = steps.some((step) => step.type === "start-event");
    const hasEnd = steps.some((step) => step.type === "end-event");

    if (!hasStart) {
      errors.push("Workflow must have at least one start-event");
    }

    if (!hasEnd) {
      errors.push("Workflow must have at least one end-event");
    }

    // Validate each step
    steps.forEach((step, index) => {
      if (!step.step_id) {
        errors.push(`Step at index ${index} is missing step_id`);
      }

      if (!step.step_name) {
        errors.push(`Step ${step.step_id || index} is missing step_name`);
      }

      if (!step.type) {
        errors.push(`Step ${step.step_id || index} is missing type`);
      }

      // Validate step type
      const validTypes = [
        "start-event",
        "end-event",
        "service-task",
        "user-task",
        "exclusive-gateway",
      ];
      if (step.type && !validTypes.includes(step.type)) {
        errors.push(`Step ${step.step_id} has invalid type: ${step.type}`);
      }

      // Validate next step references (except for end-event)
      if (step.type !== "end-event" && step.type !== "exclusive-gateway") {
        if (!step.next) {
          errors.push(`Step ${step.step_id} is missing "next" property`);
        }
      }

      // Validate gateway branches
      if (step.type === "exclusive-gateway") {
        if (!step.branches || !step.branches.true || !step.branches.false) {
          errors.push(
            `Gateway ${step.step_id} must have branches.true and branches.false`
          );
        }
        if (!step.condition) {
          errors.push(`Gateway ${step.step_id} is missing condition`);
        }
      }

      // Validate service-task configuration
      if (step.type === "service-task") {
        if (!step.action) {
          errors.push(`Service task ${step.step_id} is missing action`);
        }
        if (!step.config) {
          errors.push(`Service task ${step.step_id} is missing config`);
        }
      }
    });

    // Check for orphaned steps
    const stepIds = steps.map((s) => s.step_id);
    steps.forEach((step) => {
      if (step.next && !stepIds.includes(step.next)) {
        errors.push(
          `Step ${step.step_id} references non-existent next step: ${step.next}`
        );
      }

      if (step.type === "exclusive-gateway") {
        if (step.branches.true && !stepIds.includes(step.branches.true)) {
          errors.push(
            `Gateway ${step.step_id} references non-existent branch: ${step.branches.true}`
          );
        }
        if (step.branches.false && !stepIds.includes(step.branches.false)) {
          errors.push(
            `Gateway ${step.step_id} references non-existent branch: ${step.branches.false}`
          );
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate workflow update data
   */
  validateUpdate(updateData) {
    const schema = Joi.object({
      name: Joi.string().min(3).max(255),
      description: Joi.string().allow("", null),
      bpmn_xml: Joi.string().allow("", null),
      steps_json: Joi.object(),
    }).min(1); // At least one field must be provided

    return schema.validate(updateData);
  }
}

module.exports = new ValidationService();
