const { v4: uuidv4 } = require("uuid");
const workflowRepository = require("../repositories/workflow.repository");
const versionRepository = require("../repositories/version.repository");
const validationService = require("./validation.service");

class WorkflowService {
  async createWorkflow(workflowData) {
    // Validate workflow data
    const { error } = validationService.validateWorkflow(workflowData);
    if (error) {
      throw new Error(
        `Validation failed: ${error.details.map((d) => d.message).join(", ")}`
      );
    }

    // Validate steps structure
    const stepsValidation = validationService.validateSteps(
      workflowData.steps_json
    );
    if (!stepsValidation.valid) {
      throw new Error(
        `Steps validation failed: ${stepsValidation.errors.join(", ")}`
      );
    }

    // Generate workflow_id if not provided
    if (!workflowData.workflow_id) {
      workflowData.workflow_id = `wf-${uuidv4()}`;
    }

    // Check if workflow_id already exists
    const exists = await workflowRepository.exists(
      workflowData.workflow_id,
      workflowData.tenant_id
    );
    if (exists) {
      throw new Error(
        `Workflow with ID ${workflowData.workflow_id} already exists`
      );
    }

    // Create workflow
    const workflow = await workflowRepository.create(workflowData);

    // Create initial version
    await versionRepository.create({
      workflow_id: workflow.workflow_id,
      version: workflow.version,
      bpmn_xml: workflow.bpmn_xml,
      steps_json: workflow.steps_json,
      changelog: "Initial version",
      created_by: workflowData.created_by,
    });

    return workflow;
  }

  async getWorkflow(workflowId, tenantId) {
    const workflow = await workflowRepository.findById(workflowId, tenantId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    return workflow;
  }

  async listWorkflows(tenantId, status = null, limit = 50) {
    return await workflowRepository.findByTenant(tenantId, status, limit);
  }

  async updateWorkflow(workflowId, tenantId, updateData, updatedBy) {
    // Validate update data
    const { error } = validationService.validateUpdate(updateData);
    if (error) {
      throw new Error(
        `Validation failed: ${error.details.map((d) => d.message).join(", ")}`
      );
    }

    // Validate steps if provided
    if (updateData.steps_json) {
      const stepsValidation = validationService.validateSteps(
        updateData.steps_json
      );
      if (!stepsValidation.valid) {
        throw new Error(
          `Steps validation failed: ${stepsValidation.errors.join(", ")}`
        );
      }
    }

    // Check if workflow exists
    const existing = await workflowRepository.findById(workflowId, tenantId);
    if (!existing) {
      throw new Error("Workflow not found");
    }

    // Can only update workflows in DRAFT or REJECTED status
    if (existing.status !== "DRAFT" && existing.status !== "REJECTED") {
      throw new Error(`Cannot update workflow with status: ${existing.status}`);
    }

    // Update workflow
    const updated = await workflowRepository.update(
      workflowId,
      tenantId,
      updateData
    );

    // Create new version if steps changed
    if (updateData.steps_json || updateData.bpmn_xml) {
      const currentVersion = existing.version;
      const newVersion = this.incrementVersion(currentVersion);

      await versionRepository.create({
        workflow_id: workflowId,
        version: newVersion,
        bpmn_xml: updateData.bpmn_xml || existing.bpmn_xml,
        steps_json: updateData.steps_json || existing.steps_json,
        changelog: `Updated workflow`,
        created_by: updatedBy,
      });

      // Update workflow version
      await workflowRepository.update(workflowId, tenantId, {
        version: newVersion,
      });
    }

    return updated;
  }

  async deleteWorkflow(workflowId, tenantId) {
    const workflow = await workflowRepository.findById(workflowId, tenantId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Can only delete workflows in DRAFT or REJECTED status
    if (workflow.status !== "DRAFT" && workflow.status !== "REJECTED") {
      throw new Error(`Cannot delete workflow with status: ${workflow.status}`);
    }

    return await workflowRepository.delete(workflowId, tenantId);
  }

  async submitForApproval(workflowId, tenantId) {
    const workflow = await workflowRepository.findById(workflowId, tenantId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (workflow.status !== "DRAFT") {
      throw new Error("Only DRAFT workflows can be submitted for approval");
    }

    // Don't pass approvedBy for submit (it's null)
    const query = `
      UPDATE workflow_repository.workflows
      SET 
        status = $3,
        updated_at = NOW()
      WHERE workflow_id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const pool =
      require("../repositories/workflow.repository").pool ||
      require("../config/database");
    const result = await pool.query(query, [
      workflowId,
      tenantId,
      "PENDING_APPROVAL",
    ]);
    return result.rows[0];
  }

  async approveWorkflow(workflowId, tenantId, approvedBy) {
    const workflow = await workflowRepository.findById(workflowId, tenantId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (workflow.status !== "PENDING_APPROVAL") {
      throw new Error("Only PENDING_APPROVAL workflows can be approved");
    }

    const query = `
      UPDATE workflow_repository.workflows
      SET 
        status = $3,
        approved_by = $4,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE workflow_id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const pool =
      require("../repositories/workflow.repository").pool ||
      require("../config/database");
    const result = await pool.query(query, [
      workflowId,
      tenantId,
      "APPROVED",
      approvedBy,
    ]);
    return result.rows[0];
  }

  async rejectWorkflow(workflowId, tenantId, rejectedBy) {
    const workflow = await workflowRepository.findById(workflowId, tenantId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (workflow.status !== "PENDING_APPROVAL") {
      throw new Error("Only PENDING_APPROVAL workflows can be rejected");
    }

    const query = `
      UPDATE workflow_repository.workflows
      SET 
        status = $3,
        approved_by = $4,
        updated_at = NOW()
      WHERE workflow_id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const pool =
      require("../repositories/workflow.repository").pool ||
      require("../config/database");
    const result = await pool.query(query, [
      workflowId,
      tenantId,
      "REJECTED",
      rejectedBy,
    ]);
    return result.rows[0];
  }

  incrementVersion(currentVersion) {
    const parts = currentVersion.split(".");
    const minor = parseInt(parts[1] || 0) + 1;
    return `${parts[0]}.${minor}`;
  }
}

module.exports = new WorkflowService();
