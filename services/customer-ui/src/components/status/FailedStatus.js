import React from "react";
import "./StatusComponents.css";

function FailedStatus({ message, description }) {
  return (
    <div className="status-card status-failed">
      <div className="status-icon">❌</div>

      <h3>{message || "Order Failed"}</h3>
      <p>{description || "There was an issue processing your order."}</p>

      <div className="failed-actions">
        <button
          className="primary"
          onClick={() => (window.location.href = "/")}
        >
          Try Again
        </button>
        <button
          className="secondary"
          onClick={() => alert("Support: support@example.com")}
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}

export default FailedStatus;
