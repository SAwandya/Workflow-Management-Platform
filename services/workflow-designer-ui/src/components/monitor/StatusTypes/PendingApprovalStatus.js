import React, { useState } from "react";
import axios from "axios";
import "./StatusTypes.css";

function PendingApprovalStatus({ instance, state, uiState, role }) {
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState(null);

  // Get role-specific UI configuration
  const roleConfig =
    role === "manager" ? uiState.manager_ui || {} : uiState.customer_ui || {};

  const message =
    roleConfig.message || uiState.message || "Awaiting approval...";
  const showApprovalButton =
    role === "manager" && roleConfig.show_approval_button !== false;
  const showRejectionButton =
    role === "manager" && roleConfig.show_rejection_button !== false;

  const handleApprove = async () => {
    try {
      setApproving(true);
      setError(null);

      const apiGateway =
        process.env.REACT_APP_API_GATEWAY || "http://localhost:3000";
      const tenantId = process.env.REACT_APP_TENANT_ID || "tenant-a";

      await axios.post(
        `${apiGateway}/api/gateway/workflows/instances/${instance.instance_id}/resume`,
        {
          step_id: state.current_step,
          user_input: {
            approved: true,
            approver: `${role}@example.com`,
            approved_at: new Date().toISOString(),
          },
        },
        {
          headers: {
            "X-Tenant-ID": tenantId,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Workflow approved successfully!");
      window.location.reload();
    } catch (err) {
      setError(
        "Failed to approve workflow: " +
          (err.response?.data?.details || err.message)
      );
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Are you sure you want to reject this workflow?")) {
      return;
    }

    try {
      setApproving(true);
      setError(null);

      const apiGateway =
        process.env.REACT_APP_API_GATEWAY || "http://localhost:3000";
      const tenantId = process.env.REACT_APP_TENANT_ID || "tenant-a";

      await axios.post(
        `${apiGateway}/api/gateway/workflows/instances/${instance.instance_id}/resume`,
        {
          step_id: state.current_step,
          user_input: {
            approved: false,
            approver: `${role}@example.com`,
            rejected_at: new Date().toISOString(),
          },
        },
        {
          headers: {
            "X-Tenant-ID": tenantId,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Workflow rejected");
      window.location.reload();
    } catch (err) {
      setError(
        "Failed to reject workflow: " +
          (err.response?.data?.details || err.message)
      );
    } finally {
      setApproving(false);
    }
  };

  return (
    <div
      className={`status-card status-pending ${
        roleConfig.highlight ? "highlighted" : ""
      }`}
    >
      <div className="status-icon">📧</div>

      <h3>{message}</h3>

      {error && <div className="error-message">{error}</div>}

      {role === "customer" && (
        <p className="info-message">
          Your request is being reviewed. You will be notified once a decision
          is made.
        </p>
      )}

      {role === "manager" && (
        <div className="approval-section">
          <p className="approval-details">
            Instance ID: <code>{instance.instance_id}</code>
          </p>

          {state?.variables?.orderDetails && (
            <div className="order-details">
              <h4>Order Details:</h4>
              <p>Order ID: {state.variables.orderDetails.order?.order_id}</p>
              <p>Value: ${state.variables.orderDetails.order?.order_value}</p>
              <p>Customer: {state.variables.orderDetails.order?.customer_id}</p>
            </div>
          )}

          <div className="approval-actions">
            {showApprovalButton && (
              <button
                className="btn-approve"
                onClick={handleApprove}
                disabled={approving}
              >
                {approving ? "Processing..." : "✓ Approve"}
              </button>
            )}

            {showRejectionButton && (
              <button
                className="btn-reject"
                onClick={handleReject}
                disabled={approving}
              >
                {approving ? "Processing..." : "✗ Reject"}
              </button>
            )}
          </div>
        </div>
      )}

      {uiState.show_progress_indicator && (
        <div className="waiting-indicator">
          <div className="waiting-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingApprovalStatus;
