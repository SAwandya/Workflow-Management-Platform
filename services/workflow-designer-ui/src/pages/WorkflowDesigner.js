import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BpmnCanvas from "../components/designer/BpmnCanvas";
import PropertiesPanel from "../components/designer/PropertiesPanel";
import { workflowService } from "../api/workflow.api";
import "./WorkflowDesigner.css";

function WorkflowDesigner() {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const isNewWorkflow = workflowId === "new" || !workflowId;

  const [workflow, setWorkflow] = useState({
    workflow_id: "",
    name: "New Workflow",
    description: "",
    bpmn_xml: "",
    steps_json: { steps: [] },
    version: "1.0",
  });

  const [bpmnXml, setBpmnXml] = useState("");
  const [selectedElement, setSelectedElement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!isNewWorkflow) {
      loadWorkflow();
    }
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getWorkflow(workflowId);
      setWorkflow(data.workflow);
      setBpmnXml(data.workflow.bpmn_xml || "");
      setError(null);
    } catch (err) {
      setError("Failed to load workflow: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBpmnChange = (xml) => {
    setBpmnXml(xml);
    setWorkflow((prev) => ({
      ...prev,
      bpmn_xml: xml,
    }));
  };

  const handleElementSelect = (element) => {
    setSelectedElement(element);
  };

  const handlePropertiesChange = (element, properties) => {
    // Update workflow steps_json with element properties
    const steps = workflow.steps_json.steps || [];
    const existingStepIndex = steps.findIndex((s) => s.step_id === element.id);

    const stepData = {
      step_id: element.id,
      step_name: properties.name || element.id,
      type: convertBpmnTypeToStepType(element.type),
      ...properties,
    };

    let updatedSteps;
    if (existingStepIndex >= 0) {
      updatedSteps = [...steps];
      updatedSteps[existingStepIndex] = stepData;
    } else {
      updatedSteps = [...steps, stepData];
    }

    setWorkflow((prev) => ({
      ...prev,
      steps_json: {
        ...prev.steps_json,
        steps: updatedSteps,
      },
    }));
  };

  const convertBpmnTypeToStepType = (bpmnType) => {
    const typeMap = {
      "bpmn:StartEvent": "start-event",
      "bpmn:EndEvent": "end-event",
      "bpmn:Task": "service-task",
      "bpmn:ServiceTask": "service-task",
      "bpmn:UserTask": "user-task",
      "bpmn:ExclusiveGateway": "exclusive-gateway",
      "bpmn:ParallelGateway": "parallel-gateway",
    };
    return typeMap[bpmnType] || "service-task";
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate
      if (!workflow.name || workflow.name.trim() === "") {
        throw new Error("Workflow name is required");
      }

      const workflowData = {
        ...workflow,
        bpmn_xml: bpmnXml,
      };

      let result;
      if (isNewWorkflow) {
        result = await workflowService.createWorkflow(workflowData);
        setSuccess("Workflow created successfully!");
        // Navigate to edit mode
        navigate(`/designer/${result.workflow.workflow_id}`, { replace: true });
      } else {
        result = await workflowService.updateWorkflow(workflowId, workflowData);
        setSuccess("Workflow saved successfully!");
      }

      setWorkflow(result.workflow);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save workflow: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleNameChange = (name) => {
    setWorkflow((prev) => ({
      ...prev,
      name,
    }));
  };

  const handleDescriptionChange = (description) => {
    setWorkflow((prev) => ({
      ...prev,
      description,
    }));
  };

  if (loading) {
    return <div className="loading">Loading workflow...</div>;
  }

  return (
    <div className="workflow-designer">
      <div className="designer-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back
          </button>
          <div className="workflow-title">
            <input
              type="text"
              value={workflow.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Workflow Name"
              className="name-input"
            />
            <input
              type="text"
              value={workflow.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Description (optional)"
              className="description-input"
            />
          </div>
        </div>

        <div className="header-actions">
          <span className="version-badge">v{workflow.version}</span>
          <button className="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Workflow"}
          </button>
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError(null)} className="close-alert">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="success">
          {success}
          <button onClick={() => setSuccess(null)} className="close-alert">
            ×
          </button>
        </div>
      )}

      <div className="designer-workspace">
        <BpmnCanvas
          bpmnXml={bpmnXml}
          onBpmnChange={handleBpmnChange}
          onElementSelect={handleElementSelect}
        />

        <PropertiesPanel
          selectedElement={selectedElement}
          onPropertiesChange={handlePropertiesChange}
        />
      </div>

      <div className="designer-footer">
        <div className="footer-info">
          <span>Total Steps: {workflow.steps_json.steps?.length || 0}</span>
          <span>Status: {workflow.status || "DRAFT"}</span>
        </div>
        <div className="footer-help">
          <span>
            💡 Tip: Drag elements from the palette to create your workflow
          </span>
        </div>
      </div>
    </div>
  );
}

export default WorkflowDesigner;
