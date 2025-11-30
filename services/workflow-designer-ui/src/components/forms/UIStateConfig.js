import React from "react";
import "./UIStateConfig.css";

function UIStateConfig({ uiState, onChange }) {
  const handleChange = (key, value) => {
    onChange({
      ...uiState,
      [key]: value,
    });
  };

  const statusOptions = [
    { value: "processing", label: "Processing" },
    { value: "pending_approval", label: "Pending Approval" },
    { value: "action_required", label: "Action Required" },
    { value: "completed", label: "Completed" },
    { value: "waiting", label: "Waiting" },
  ];

  const iconOptions = [
    { value: "clock", label: "🕐 Clock" },
    { value: "spinner", label: "⏳ Spinner" },
    { value: "email", label: "📧 Email" },
    { value: "success", label: "✅ Success" },
    { value: "warning", label: "⚠️ Warning" },
    { value: "error", label: "❌ Error" },
  ];

  return (
    <div className="ui-state-config">
      <div className="form-group">
        <label>Status Type</label>
        <select
          value={uiState.status || ""}
          onChange={(e) => handleChange("status", e.target.value)}
        >
          <option value="">Select status...</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Display Message</label>
        <input
          type="text"
          value={uiState.message || ""}
          onChange={(e) => handleChange("message", e.target.value)}
          placeholder="e.g., Awaiting manager approval"
        />
      </div>

      <div className="form-group">
        <label>Icon</label>
        <select
          value={uiState.icon || ""}
          onChange={(e) => handleChange("icon", e.target.value)}
        >
          <option value="">Select icon...</option>
          {iconOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={uiState.show_spinner || false}
            onChange={(e) => handleChange("show_spinner", e.target.checked)}
          />
          Show Spinner
        </label>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={uiState.show_progress_indicator || false}
            onChange={(e) =>
              handleChange("show_progress_indicator", e.target.checked)
            }
          />
          Show Progress Indicator
        </label>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={uiState.show_cancel_button || false}
            onChange={(e) =>
              handleChange("show_cancel_button", e.target.checked)
            }
          />
          Show Cancel Button
        </label>
      </div>

      <div className="form-group">
        <label>Estimated Time</label>
        <input
          type="text"
          value={uiState.estimated_time || ""}
          onChange={(e) => handleChange("estimated_time", e.target.value)}
          placeholder="e.g., 24 hours"
        />
      </div>
    </div>
  );
}

export default UIStateConfig;
