import React, { useState } from "react";
import axios from "axios";
import "./AdminActionsPanel.css";

function AdminActionsPanel({ workflow, onWorkflowUpdate }) {
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerData, setRegisterData] = useState({
    trigger_event: "ORDER_CREATED",
    trigger_type: "sync",
  });

  const WORKFLOW_SERVICE =
    process.env.REACT_APP_WORKFLOW_SERVICE || "http://localhost:3006";
  const TENANT_MANAGER = "http://localhost:3002"; // Browser can access this directly
  const TENANT_ID = process.env.REACT_APP_TENANT_ID || "tenant-a";

  const handleSubmitForApproval = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await axios.post(
        `${WORKFLOW_SERVICE}/api/workflows/${workflow.workflow_id}/submit`,
        {},
        { headers: { "X-Tenant-ID": TENANT_ID } }
      );

      setSuccess("Workflow submitted for approval successfully!");
      onWorkflowUpdate && onWorkflowUpdate();
    } catch (err) {
      setError(
        "Failed to submit: " + (err.response?.data?.details || err.message)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      setError(null);
      setSuccess(null);

      await axios.post(
        `${WORKFLOW_SERVICE}/api/workflows/${workflow.workflow_id}/approve`,
        {},
        { headers: { "X-Tenant-ID": TENANT_ID } }
      );

      setSuccess("Workflow approved successfully!");
      onWorkflowUpdate && onWorkflowUpdate();
    } catch (err) {
      setError(
        "Failed to approve: " + (err.response?.data?.details || err.message)
      );
    } finally {
      setApproving(false);
    }
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      setError(null);
      setSuccess(null);

      console.log("Registering workflow:", {
        workflow_id: workflow.workflow_id,
        workflow_name: workflow.name,
        trigger_type: registerData.trigger_type,
        trigger_event: registerData.trigger_event,
      });

      // First, check if already registered for this event
      try {
        const existingResponse = await axios.get(
          `${TENANT_MANAGER}/api/tenants/${TENANT_ID}/workflows/query`,
          {
            params: { trigger_event: registerData.trigger_event },
            timeout: 5000,
          }
        );

        console.log("Existing workflows response:", existingResponse.data);

        if (
          existingResponse.data.workflows &&
          existingResponse.data.workflows.length > 0
        ) {
          const existingWorkflow = existingResponse.data.workflows[0];

          const confirmed = window.confirm(
            `A workflow is already registered for ${registerData.trigger_event}.\n\n` +
              `Current: ${existingWorkflow.workflow_name} (${existingWorkflow.workflow_id})\n` +
              `New: ${workflow.name} (${workflow.workflow_id})\n\n` +
              `Do you want to replace it?`
          );

          if (!confirmed) {
            setRegistering(false);
            return;
          }

          // Delete existing registration
          console.log(
            "Deleting existing registration:",
            existingWorkflow.registry_id
          );
          await axios.delete(
            `${TENANT_MANAGER}/api/tenants/${TENANT_ID}/workflows/${existingWorkflow.registry_id}`
          );
          console.log("Existing registration deleted");
        }
      } catch (checkError) {
        // If it's a 404 or "No workflow found", that's OK - means nothing is registered
        if (
          checkError.response?.status === 404 ||
          checkError.response?.data?.error ===
            "No workflow found for this trigger event"
        ) {
          console.log(
            "No existing workflow for this event, proceeding with registration"
          );
        } else {
          // Other errors should be thrown
          throw checkError;
        }
      }

      // Register new workflow
      const registrationPayload = {
        workflow_id: workflow.workflow_id,
        workflow_name: workflow.name,
        trigger_type: registerData.trigger_type,
        trigger_event: registerData.trigger_event,
      };

      console.log("Registering new workflow:", registrationPayload);

      const response = await axios.post(
        `${TENANT_MANAGER}/api/tenants/${TENANT_ID}/workflows`,
        registrationPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      console.log("Registration successful:", response.data);

      setSuccess(
        `Workflow registered for ${registerData.trigger_event} event successfully!`
      );
      setShowRegisterForm(false);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage =
        err.response?.data?.details || err.response?.data?.error || err.message;
      setError("Failed to register workflow: " + errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  if (!workflow) {
    return null;
  }

  const canSubmit = workflow.status === "DRAFT";
  const canApprove = workflow.status === "PENDING_APPROVAL";
  const canRegister = workflow.status === "APPROVED";

  return (
    <div className="admin-actions-panel">
      <h3>Admin Actions</h3>

      {error && (
        <div className="action-error">
          {error}
          <button onClick={() => setError(null)} className="close-btn">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="action-success">
          {success}
          <button onClick={() => setSuccess(null)} className="close-btn">
            ×
          </button>
        </div>
      )}

      <div className="workflow-status-info">
        <span className="label">Current Status:</span>
        <span
          className={`status-badge status-${workflow.status?.toLowerCase()}`}
        >
          {workflow.status}
        </span>
      </div>

      <div className="actions-grid">
        {/* Submit for Approval */}
        {canSubmit && (
          <div className="action-card">
            <div className="action-icon">📤</div>
            <h4>Submit for Approval</h4>
            <p>Submit this workflow to be reviewed and approved</p>
            <button
              className="action-button primary"
              onClick={handleSubmitForApproval}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        )}

        {/* Approve Workflow */}
        {canApprove && (
          <div className="action-card">
            <div className="action-icon">✅</div>
            <h4>Approve Workflow</h4>
            <p>Approve this workflow to make it ready for use</p>
            <button
              className="action-button success"
              onClick={handleApprove}
              disabled={approving}
            >
              {approving ? "Approving..." : "Approve Workflow"}
            </button>
          </div>
        )}

        {/* Register with Tenant Manager */}
        {canRegister && (
          <div className="action-card full-width">
            <div className="action-icon">🔗</div>
            <h4>Register Event Trigger</h4>
            <p>Register this workflow to trigger on specific events</p>

            {!showRegisterForm ? (
              <button
                className="action-button primary"
                onClick={() => setShowRegisterForm(true)}
              >
                Configure Event Trigger
              </button>
            ) : (
              <div className="register-form">
                <div className="form-group">
                  <label>Trigger Event</label>
                  <select
                    value={registerData.trigger_event}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        trigger_event: e.target.value,
                      })
                    }
                  >
                    <option value="ORDER_CREATED">Order Created</option>
                    <option value="ORDER_UPDATED">Order Updated</option>
                    <option value="ORDER_CANCELLED">Order Cancelled</option>
                    <option value="PAYMENT_RECEIVED">Payment Received</option>
                    <option value="SHIPMENT_CREATED">Shipment Created</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trigger Type</label>
                  <select
                    value={registerData.trigger_type}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        trigger_type: e.target.value,
                      })
                    }
                  >
                    <option value="sync">Synchronous</option>
                    <option value="async">Asynchronous</option>
                  </select>
                  <small>
                    Sync: Wait for workflow to complete. Async: Return
                    immediately.
                  </small>
                </div>

                <div className="form-actions">
                  <button
                    className="action-button secondary"
                    onClick={() => setShowRegisterForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="action-button primary"
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    {registering ? "Registering..." : "Register Workflow"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info for non-actionable states */}
        {!canSubmit && !canApprove && !canRegister && (
          <div className="action-card info full-width">
            <div className="action-icon">ℹ️</div>
            <h4>No Actions Available</h4>
            <p>
              {workflow.status === "APPROVED" &&
                "This workflow is already approved and can be registered."}
              {workflow.status === "REJECTED" &&
                "This workflow was rejected. Please make changes and submit again."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminActionsPanel;
