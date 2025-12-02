import React from "react";
import "./StatusTypes.css";

function ProcessingStatus({ instance, state, uiState, history }) {
  const message = uiState.message || "Processing your request...";
  const showSpinner = uiState.show_spinner !== false;
  const estimatedTime = uiState.estimated_time;

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!history || history.length === 0) return 0;

    const completedSteps = history.filter(
      (h) => h.status === "COMPLETED"
    ).length;
    const totalSteps = history.length;

    return Math.round((completedSteps / totalSteps) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="status-card status-processing">
      {showSpinner && (
        <div className="status-spinner">
          <div className="spinner"></div>
        </div>
      )}

      <div className="status-icon">⏳</div>

      <h3>{message}</h3>

      {estimatedTime && (
        <p className="estimated-time">Estimated time: {estimatedTime}</p>
      )}

      {state?.current_step && (
        <div className="current-step">
          <span className="step-label">Current Step:</span>
          <span className="step-value">{state.current_step}</span>
        </div>
      )}

      {uiState.show_progress_indicator && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}
    </div>
  );
}

export default ProcessingStatus;
