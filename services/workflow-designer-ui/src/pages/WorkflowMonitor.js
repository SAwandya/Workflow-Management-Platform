import React from "react";
import "./WorkflowMonitor.css";

function WorkflowMonitor() {
  return (
    <div className="workflow-monitor">
      <div className="monitor-header">
        <h2>Workflow Execution Monitor</h2>
        <p>Real-time workflow execution tracking and status monitoring</p>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">📊</div>
        <h3>Coming in Phase 2 - Week 4</h3>
        <p>The Workflow Monitor will display:</p>
        <ul>
          <li>Real-time workflow execution status</li>
          <li>Step-by-step progress tracking</li>
          <li>Dynamic UI state rendering</li>
          <li>Error and warning indicators</li>
          <li>Execution history and logs</li>
        </ul>
        <p className="note">
          For now, you can monitor workflow execution using the API endpoints
          from Phase 1 (Execution Service status endpoints).
        </p>
      </div>
    </div>
  );
}

export default WorkflowMonitor;
