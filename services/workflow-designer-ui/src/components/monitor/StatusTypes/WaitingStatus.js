import React, { useState, useEffect } from "react";
import "./StatusTypes.css";

function WaitingStatus({ instance, state, uiState }) {
  const message = uiState.message || "Workflow is waiting...";
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (uiState.estimated_time) {
      // Parse estimated time (e.g., "24 hours" or "5 minutes")
      const match = uiState.estimated_time.match(
        /(\d+)\s*(hour|minute|second)/i
      );
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        let seconds = 0;
        if (unit.startsWith("hour")) seconds = value * 3600;
        else if (unit.startsWith("minute")) seconds = value * 60;
        else seconds = value;

        // Calculate elapsed time since step started
        const startedAt = new Date(instance.started_at);
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = Math.max(0, seconds - elapsed);

        setTimeRemaining(remaining);
      }
    }
  }, [uiState.estimated_time, instance.started_at]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    } else if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="status-card status-waiting">
      <div className="status-icon">🕐</div>

      <h3>{message}</h3>

      {timeRemaining !== null && (
        <p className="time-remaining">
          Time remaining: <strong>{formatTime(timeRemaining)}</strong>
        </p>
      )}

      {uiState.estimated_time && (
        <p>Expected wait time: {uiState.estimated_time}</p>
      )}

      <div className="waiting-indicator">
        <div className="waiting-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

export default WaitingStatus;
