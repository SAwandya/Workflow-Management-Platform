import React from "react";
import ProcessingStatus from "./StatusTypes/ProcessingStatus";
import PendingApprovalStatus from "./StatusTypes/PendingApprovalStatus";
import ActionRequiredStatus from "./StatusTypes/ActionRequiredStatus";
import CompletedStatus from "./StatusTypes/CompletedStatus";
import WaitingStatus from "./StatusTypes/WaitingStatus";
import "./WorkflowStatusDisplay.css";

function WorkflowStatusDisplay({
  instance,
  state,
  history,
  role = "customer",
}) {
  if (!instance) {
    return (
      <div className="status-display empty">
        <p>No workflow instance selected</p>
      </div>
    );
  }

  // Get current step details
  const currentStep = state?.current_step;
  const currentStepHistory = history?.find(
    (h) => h.step_id.toString() === currentStep?.toString()
  );

  // Extract UI state from step configuration (if available)
  const uiState = currentStepHistory?.input_data?.step_config?.uiState || {};
  const status = instance.status || "RUNNING";

  // Render appropriate status component based on workflow status
  const renderStatusComponent = () => {
    switch (status) {
      case "RUNNING":
      case "PROCESSING":
        return (
          <ProcessingStatus
            instance={instance}
            state={state}
            uiState={uiState}
          />
        );

      case "WAITING":
        // Check if it's approval or general waiting
        if (currentStepHistory?.step_type === "user-task") {
          return (
            <PendingApprovalStatus
              instance={instance}
              state={state}
              uiState={uiState}
              role={role}
            />
          );
        }
        return (
          <WaitingStatus instance={instance} state={state} uiState={uiState} />
        );

      case "ACTION_REQUIRED":
        return (
          <ActionRequiredStatus
            instance={instance}
            state={state}
            uiState={uiState}
            role={role}
          />
        );

      case "COMPLETED":
        return <CompletedStatus instance={instance} state={state} />;

      case "FAILED":
        return (
          <div className="status-card status-failed">
            <div className="status-icon">❌</div>
            <h3>Workflow Failed</h3>
            <p>
              {instance.error_message || "An error occurred during execution"}
            </p>
          </div>
        );

      default:
        return (
          <div className="status-card">
            <p>Status: {status}</p>
          </div>
        );
    }
  };

  return (
    <div className="workflow-status-display">
      <div className="status-header">
        <div className="header-info">
          <h2>Workflow Status</h2>
          <span className={`status-badge status-${status.toLowerCase()}`}>
            {status}
          </span>
        </div>
        <div className="header-meta">
          <span>Instance: {instance.instance_id}</span>
          <span>Started: {new Date(instance.started_at).toLocaleString()}</span>
        </div>
      </div>

      <div className="status-content">{renderStatusComponent()}</div>

      {/* Step History Timeline */}
      {history && history.length > 0 && (
        <div className="step-timeline">
          <h3>Execution Timeline</h3>
          <div className="timeline">
            {history.map((step, index) => (
              <div
                key={step.step_id}
                className={`timeline-item ${
                  step.status === "COMPLETED"
                    ? "completed"
                    : step.status === "STARTED"
                    ? "active"
                    : "pending"
                }`}
              >
                <div className="timeline-marker">
                  {step.status === "COMPLETED"
                    ? "✓"
                    : step.status === "STARTED"
                    ? "○"
                    : "○"}
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">{step.step_name}</div>
                  <div className="timeline-meta">
                    <span>{step.step_type}</span>
                    {step.completed_at && (
                      <span>
                        {(
                          (new Date(step.completed_at) -
                            new Date(step.started_at)) /
                          1000
                        ).toFixed(2)}
                        s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowStatusDisplay;
