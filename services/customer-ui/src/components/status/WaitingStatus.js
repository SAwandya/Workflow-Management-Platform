import React from "react";
import "./StatusComponents.css";

function WaitingStatus({ message, description, estimatedTime }) {
  return (
    <div className="status-card status-waiting">
      <div className="status-icon">🕐</div>

      <h3>{message || "Order Under Review"}</h3>
      <p>{description || "Your order is being reviewed by our team."}</p>

      {estimatedTime && (
        <div className="estimated-time">
          <span>
            Expected review time: <strong>{estimatedTime}</strong>
          </span>
        </div>
      )}

      <div className="waiting-indicator">
        <div className="waiting-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div className="info-box">
        <p>
          ✉️ You will receive an email notification once your order is reviewed.
        </p>
      </div>
    </div>
  );
}

export default WaitingStatus;
