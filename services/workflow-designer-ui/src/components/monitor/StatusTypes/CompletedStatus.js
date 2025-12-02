import React from "react";
import "./StatusTypes.css";

function CompletedStatus({ instance, state }) {
  const duration =
    instance.completed_at && instance.started_at
      ? (
          (new Date(instance.completed_at) - new Date(instance.started_at)) /
          1000
        ).toFixed(2)
      : null;

  return (
    <div className="status-card status-completed">
      <div className="status-icon success">✓</div>

      <h3>Workflow Completed Successfully</h3>

      <p>Your workflow has been executed successfully.</p>

      <div className="completion-details">
        {duration && (
          <div className="detail-item">
            <span className="detail-label">Duration:</span>
            <span className="detail-value">{duration}s</span>
          </div>
        )}

        {instance.completed_at && (
          <div className="detail-item">
            <span className="detail-label">Completed At:</span>
            <span className="detail-value">
              {new Date(instance.completed_at).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {state?.variables && (
        <details className="result-details">
          <summary>View Results</summary>
          <pre>{JSON.stringify(state.variables, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

export default CompletedStatus;
