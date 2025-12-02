import React from "react";
import "./StatusTypes.css";

function ActionRequiredStatus({ instance, state, uiState }) {
  const message = uiState.message || "Action required to continue";

  return (
    <div className="status-card status-action-required">
      <div className="status-icon warning">⚠️</div>

      <h3>{message}</h3>

      <p>Please take the required action to proceed with the workflow.</p>

      {uiState.action_url && (
        <button
          className="btn-action"
          onClick={() => window.open(uiState.action_url, "_blank")}
        >
          Take Action
        </button>
      )}
    </div>
  );
}

export default ActionRequiredStatus;
