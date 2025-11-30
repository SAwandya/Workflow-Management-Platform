import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import WorkflowList from "./pages/WorkflowList";
import WorkflowDesigner from "./pages/WorkflowDesigner";
import WorkflowMonitor from "./pages/WorkflowMonitor";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="navbar-brand">
            <h1>WMC Workflow Designer</h1>
          </div>
          <div className="navbar-menu">
            <Link to="/" className="navbar-item">
              Workflows
            </Link>
            <Link to="/designer/new" className="navbar-item">
              New Workflow
            </Link>
            <Link to="/monitor" className="navbar-item">
              Monitor
            </Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<WorkflowList />} />
            <Route path="/designer/new" element={<WorkflowDesigner />} />
            <Route
              path="/designer/:workflowId"
              element={<WorkflowDesigner />}
            />
            <Route path="/monitor" element={<WorkflowMonitor />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
