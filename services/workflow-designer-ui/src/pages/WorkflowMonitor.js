import React, { useState, useEffect } from "react";
import axios from "axios";
import WorkflowStatusDisplay from "../components/monitor/WorkflowStatusDisplay";
import useWorkflowStatus from "../hooks/useWorkflowStatus";
import "./WorkflowMonitor.css";

function WorkflowMonitor() {
  const [instances, setInstances] = useState([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);
  const [role, setRole] = useState("customer"); // customer or manager
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tenantId = process.env.REACT_APP_TENANT_ID || "tenant-a";
  const API_GATEWAY =
    process.env.REACT_APP_API_GATEWAY || "http://localhost:3000";

  // Use the workflow status hook for selected instance
  const {
    instance,
    state,
    history,
    loading: statusLoading,
    error: statusError,
    isPolling,
    startPolling,
    stopPolling,
    refresh,
  } = useWorkflowStatus(selectedInstanceId, tenantId);

  // Fetch recent workflow instances
  useEffect(() => {
    fetchRecentInstances();
  }, []);

  const fetchRecentInstances = async () => {
    try {
      setLoading(true);

      // Query database for recent instances via custom endpoint
      // For now, we'll use a workaround - create orders and track their instances
      const response = await axios
        .get(`${API_GATEWAY}/api/gateway/workflows/instances/recent`, {
          params: { tenant_id: tenantId, limit: 10 },
        })
        .catch(() => {
          // If endpoint doesn't exist, show empty state
          return { data: { instances: [] } };
        });

      const instancesList = response.data.instances || [];
      setInstances(instancesList);

      // Auto-select first instance if available
      if (instancesList.length > 0 && !selectedInstanceId) {
        setSelectedInstanceId(instancesList[0].instance_id);
        startPolling();
      }

      setError(null);
    } catch (err) {
      console.error("Failed to fetch instances:", err);
      setError("Failed to load workflow instances");
    } finally {
      setLoading(false);
    }
  };

  const handleInstanceSelect = (instanceId) => {
    setSelectedInstanceId(instanceId);
    startPolling();
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
  };

  if (loading) {
    return (
      <div className="workflow-monitor">
        <div className="loading">Loading workflow instances...</div>
      </div>
    );
  }

  return (
    <div className="workflow-monitor">
      <div className="monitor-header">
        <div className="header-content">
          <h2>Workflow Execution Monitor</h2>
          <p>Real-time workflow status tracking and monitoring</p>
        </div>

        <div className="header-controls">
          <div className="role-selector">
            <label>View as:</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <button
            className="btn-refresh"
            onClick={refresh}
            disabled={statusLoading}
          >
            🔄 Refresh
          </button>

          <button
            className={`btn-polling ${isPolling ? "active" : ""}`}
            onClick={isPolling ? stopPolling : startPolling}
          >
            {isPolling ? "⏸ Stop Auto-Refresh" : "▶ Start Auto-Refresh"}
          </button>
        </div>
      </div>

      <div className="monitor-content">
        <div className="instances-sidebar">
          <div className="sidebar-header">
            <h3>Recent Workflows</h3>
            <button className="btn-refresh-list" onClick={fetchRecentInstances}>
              🔄
            </button>
          </div>

          {instances.length === 0 ? (
            <div className="empty-instances">
              <p>No workflow instances found</p>
              <small>Create an order to trigger a workflow</small>
            </div>
          ) : (
            <div className="instances-list">
              {instances.map((inst) => (
                <div
                  key={inst.instance_id}
                  className={`instance-item ${
                    selectedInstanceId === inst.instance_id ? "active" : ""
                  }`}
                  onClick={() => handleInstanceSelect(inst.instance_id)}
                >
                  <div className="instance-header">
                    <span
                      className={`instance-status status-${inst.status.toLowerCase()}`}
                    >
                      {inst.status}
                    </span>
                    <span className="instance-time">
                      {new Date(inst.started_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="instance-id">
                    {inst.instance_id.substring(0, 20)}...
                  </div>
                  <div className="instance-workflow">{inst.workflow_id}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="status-main">
          {error && (
            <div className="error-banner">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {statusError && (
            <div className="error-banner">
              {statusError}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {!selectedInstanceId ? (
            <div className="no-selection">
              <div className="no-selection-icon">📊</div>
              <h3>Select a Workflow Instance</h3>
              <p>Choose a workflow from the list to view its status</p>
            </div>
          ) : statusLoading && !instance ? (
            <div className="loading">Loading workflow status...</div>
          ) : (
            <WorkflowStatusDisplay
              instance={instance}
              state={state}
              history={history}
              role={role}
            />
          )}
        </div>
      </div>

      {isPolling && (
        <div className="polling-indicator">
          <span className="polling-dot"></span>
          Auto-refreshing every 5 seconds
        </div>
      )}
    </div>
  );
}

export default WorkflowMonitor;
