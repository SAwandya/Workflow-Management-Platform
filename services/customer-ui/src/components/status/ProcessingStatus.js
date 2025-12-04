import React from "react";
import "./StatusComponents.css";

function ProcessingStatus({ message, showSpinner = true }) {
  return (
    <div className="status-card status-processing">
      {showSpinner && (
        <div className="status-spinner">
          <div className="spinner"></div>
        </div>
      )}

      <div className="status-icon">⏳</div>
      <h3>{message || "Processing your request..."}</h3>
      <p>Please wait while we process your order.</p>
    </div>
  );
}

export default ProcessingStatus;
