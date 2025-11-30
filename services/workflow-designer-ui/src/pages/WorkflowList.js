import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { workflowService } from "../api/workflow.api";
import "./WorkflowList.css";

function WorkflowList() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkflows();
  }, [statusFilter]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowService.listWorkflows(statusFilter || null);
      setWorkflows(data.workflows || []);
      setError(null);
    } catch (err) {
      setError("Failed to load workflows: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (workflowId) => {
    navigate(`/designer/${workflowId}`);
  };

  const handleDelete = async (workflowId) => {
    if (!window.confirm("Are you sure you want to delete this workflow?")) {
      return;
    }

    try {
      await workflowService.deleteWorkflow(workflowId);
      loadWorkflows();
    } catch (err) {
      alert("Failed to delete workflow: " + err.message);
    }
  };

  const handleSubmit = async (workflowId) => {
    try {
      await workflowService.submitForApproval(workflowId);
      alert("Workflow submitted for approval");
      loadWorkflows();
    } catch (err) {
      alert("Failed to submit workflow: " + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: "badge-draft",
      PENDING_APPROVAL: "badge-pending",
      APPROVED: "badge-approved",
      REJECTED: "badge-rejected",
    };
    return colors[status] || "badge-default";
  };

  if (loading) {
    return <div className="loading">Loading workflows...</div>;
  }

  return (
    <div className="workflow-list">
      <div className="list-header">
        <h2>My Workflows</h2>
        <div className="list-actions">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button className="primary" onClick={() => navigate("/designer/new")}>
            Create New Workflow
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="workflow-grid">
        {workflows.length === 0 ? (
          <div className="empty-state">
            <p>No workflows found</p>
            <button
              className="primary"
              onClick={() => navigate("/designer/new")}
            >
              Create Your First Workflow
            </button>
          </div>
        ) : (
          workflows.map((workflow) => (
            <div key={workflow.workflow_id} className="workflow-card">
              <div className="workflow-header">
                <h3>{workflow.name}</h3>
                <span className={`badge ${getStatusBadge(workflow.status)}`}>
                  {workflow.status}
                </span>
              </div>

              <p className="workflow-description">
                {workflow.description || "No description"}
              </p>

              <div className="workflow-meta">
                <span>Version: {workflow.version}</span>
                <span>
                  Updated: {new Date(workflow.updated_at).toLocaleDateString()}
                </span>
              </div>

              <div className="workflow-actions">
                <button
                  className="secondary"
                  onClick={() => handleEdit(workflow.workflow_id)}
                >
                  Edit
                </button>

                {workflow.status === "DRAFT" && (
                  <>
                    <button
                      className="primary"
                      onClick={() => handleSubmit(workflow.workflow_id)}
                    >
                      Submit for Approval
                    </button>
                    <button
                      className="danger"
                      onClick={() => handleDelete(workflow.workflow_id)}
                    >
                      Delete
                    </button>
                  </>
                )}

                {workflow.status === "REJECTED" && (
                  <button
                    className="danger"
                    onClick={() => handleDelete(workflow.workflow_id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WorkflowList;
