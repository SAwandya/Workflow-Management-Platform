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
  const [elementProperties, setElementProperties] = useState({}); // Store all element properties
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
    console.log("Saving properties for element:", element.id, properties);

    // Store properties in elementProperties map
    setElementProperties((prev) => ({
      ...prev,
      [element.id]: properties,
    }));

    // Update workflow steps_json
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
      updatedSteps[existingStepIndex] = {
        ...updatedSteps[existingStepIndex],
        ...stepData,
      };
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate
      if (!workflow.name || workflow.name.trim() === "") {
        throw new Error("Workflow name is required");
      }

      // Extract steps from BPMN XML
      let stepsToSave = [];

      if (bpmnXml) {
        console.log("Extracting steps from BPMN XML...");
        stepsToSave = await extractStepsFromBpmn(bpmnXml);
        console.log("Extracted steps:", stepsToSave);
      }

      // If no steps extracted, use minimal valid workflow
      if (stepsToSave.length === 0) {
        console.log("No steps extracted, adding minimal workflow structure");
        stepsToSave = [
          {
            step_id: "1",
            step_name: "start",
            type: "start-event",
            next: "2",
          },
          {
            step_id: "2",
            step_name: "end",
            type: "end-event",
          },
        ];
      }

      // Merge with manually configured steps from properties panel
      const manualSteps = workflow.steps_json.steps || [];
      if (manualSteps.length > 0) {
        stepsToSave = mergeSteps(stepsToSave, manualSteps);
      }

      // Auto-generate workflow_id for new workflows
      const workflowData = {
        ...workflow,
        bpmn_xml: bpmnXml,
        steps_json: {
          steps: stepsToSave,
        },
      };

      // Generate workflow_id if not present (for new workflows)
      if (
        isNewWorkflow &&
        (!workflowData.workflow_id || workflowData.workflow_id === "")
      ) {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        workflowData.workflow_id = `wf-${timestamp}-${randomSuffix}`;
        console.log("Generated workflow_id:", workflowData.workflow_id);
      }

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
      const errorDetails = err.response?.data?.details || err.message;
      setError("Failed to save workflow: " + errorDetails);
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const extractStepsFromBpmn = async (bpmnXml) => {
    if (!bpmnXml) {
      return [];
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(bpmnXml, "text/xml");

      // Check for parse errors
      const parseError = xmlDoc.getElementsByTagName("parsererror");
      if (parseError.length > 0) {
        console.error("XML parse error:", parseError[0].textContent);
        return [];
      }

      // Debug: Log the raw XML to see what we're working with
      console.log("BPMN XML preview:", bpmnXml.substring(0, 500));

      // Get all flow elements from both bpmn: and bpmn2: namespaces
      const process =
        xmlDoc.getElementsByTagName("bpmn:process")[0] ||
        xmlDoc.getElementsByTagName("bpmn2:process")[0];

      if (!process) {
        console.warn("No process found in BPMN XML");
        return [];
      }

      const steps = [];
      const elementMap = {};
      const sequenceFlowMap = {};

      // Collect sequence flows first
      const sequenceFlows = [
        ...xmlDoc.getElementsByTagName("bpmn:sequenceFlow"),
        ...xmlDoc.getElementsByTagName("bpmn2:sequenceFlow"),
      ];

      console.log(`Found ${sequenceFlows.length} sequence flows`);

      sequenceFlows.forEach((flow) => {
        const id = flow.getAttribute("id");
        const sourceRef = flow.getAttribute("sourceRef");
        const targetRef = flow.getAttribute("targetRef");
        const name = flow.getAttribute("name") || "";

        if (!sequenceFlowMap[sourceRef]) {
          sequenceFlowMap[sourceRef] = [];
        }
        sequenceFlowMap[sourceRef].push({
          id,
          target: targetRef,
          name,
        });
      });

      console.log("Sequence flow map:", sequenceFlowMap);

      // Collect all BPMN elements
      const startEvents = [
        ...xmlDoc.getElementsByTagName("bpmn:startEvent"),
        ...xmlDoc.getElementsByTagName("bpmn2:startEvent"),
      ];
      const endEvents = [
        ...xmlDoc.getElementsByTagName("bpmn:endEvent"),
        ...xmlDoc.getElementsByTagName("bpmn2:endEvent"),
      ];
      const tasks = [
        ...xmlDoc.getElementsByTagName("bpmn:task"),
        ...xmlDoc.getElementsByTagName("bpmn2:task"),
      ];
      const serviceTasks = [
        ...xmlDoc.getElementsByTagName("bpmn:serviceTask"),
        ...xmlDoc.getElementsByTagName("bpmn2:serviceTask"),
      ];
      const userTasks = [
        ...xmlDoc.getElementsByTagName("bpmn:userTask"),
        ...xmlDoc.getElementsByTagName("bpmn2:userTask"),
      ];
      const gateways = [
        ...xmlDoc.getElementsByTagName("bpmn:exclusiveGateway"),
        ...xmlDoc.getElementsByTagName("bpmn2:exclusiveGateway"),
      ];

      console.log(
        `Found: ${startEvents.length} start events, ${endEvents.length} end events, ${tasks.length} tasks, ${serviceTasks.length} service tasks, ${userTasks.length} user tasks, ${gateways.length} gateways`
      );

      const allElements = [
        ...startEvents,
        ...endEvents,
        ...tasks,
        ...serviceTasks,
        ...userTasks,
        ...gateways,
      ];

      console.log(`Total ${allElements.length} BPMN elements found`);

      allElements.forEach((element) => {
        const id = element.getAttribute("id");
        const name = element.getAttribute("name") || id;
        const tagName = element.tagName.replace("bpmn2:", "bpmn:");

        console.log(`Processing element: ${id} (${tagName}) - name: ${name}`);

        elementMap[id] = {
          id,
          name,
          type: tagName,
          outgoing: sequenceFlowMap[id] || [],
        };
      });

      console.log("Element map:", elementMap);

      // Validate we have start and end events
      const hasStartEvent = Object.values(elementMap).some(
        (e) => e.type === "bpmn:startEvent" || e.type === "bpmn2:startEvent"
      );
      const hasEndEvent = Object.values(elementMap).some(
        (e) => e.type === "bpmn:endEvent" || e.type === "bpmn2:endEvent"
      );

      console.log(
        `Has start event: ${hasStartEvent}, Has end event: ${hasEndEvent}`
      );

      // If no start/end events, add them automatically
      if (!hasStartEvent) {
        console.warn("No start event found, adding one automatically");
        elementMap["auto-start"] = {
          id: "auto-start",
          name: "Start",
          type: "bpmn:startEvent",
          outgoing:
            Object.keys(elementMap).length > 0
              ? [{ target: Object.keys(elementMap)[0] }]
              : [],
        };
      }

      if (!hasEndEvent) {
        console.warn("No end event found, adding one automatically");
        elementMap["auto-end"] = {
          id: "auto-end",
          name: "End",
          type: "bpmn:endEvent",
          outgoing: [],
        };

        // Connect last element to end
        const elementsArray = Object.values(elementMap);
        const lastElementWithNoNext = elementsArray.find(
          (e) =>
            e.id !== "auto-end" &&
            e.type !== "bpmn:endEvent" &&
            (!e.outgoing || e.outgoing.length === 0)
        );

        if (lastElementWithNoNext) {
          lastElementWithNoNext.outgoing = [{ target: "auto-end" }];
        }
      }

      // Create step definitions with NUMERIC IDs
      let stepIdCounter = 1;
      const stepIdMap = {}; // Map BPMN IDs to numeric IDs

      // First pass: assign numeric IDs
      Object.keys(elementMap).forEach((bpmnId) => {
        stepIdMap[bpmnId] = stepIdCounter.toString();
        stepIdCounter++;
      });

      // Second pass: create steps with numeric IDs and mapped next references
      Object.values(elementMap).forEach((element) => {
        const stepType = convertBpmnTypeToStepType(element.type);
        const numericId = stepIdMap[element.id];

        const step = {
          step_id: numericId, // Use numeric ID instead of BPMN ID
          step_name: element.name,
          type: stepType,
        };

        // Handle different step types
        if (stepType === "start-event") {
          if (element.outgoing.length > 0) {
            const targetBpmnId = element.outgoing[0].target;
            step.next = stepIdMap[targetBpmnId]; // Map to numeric ID
          } else {
            const firstOtherElement = Object.values(elementMap).find(
              (e) => e.id !== element.id && e.type !== "bpmn:startEvent"
            );
            if (firstOtherElement) {
              step.next = stepIdMap[firstOtherElement.id];
            }
          }
        } else if (stepType === "end-event") {
          // End event doesn't need next
        } else if (stepType === "exclusive-gateway") {
          step.condition = "true";

          if (element.outgoing.length >= 2) {
            step.branches = {
              true: stepIdMap[element.outgoing[0].target],
              false: stepIdMap[element.outgoing[1].target],
            };
          } else if (element.outgoing.length === 1) {
            const targetId = stepIdMap[element.outgoing[0].target];
            step.branches = {
              true: targetId,
              false: targetId,
            };
          } else {
            step.branches = {
              true: stepIdMap["auto-end"] || "2",
              false: stepIdMap["auto-end"] || "2",
            };
          }
        } else {
          // Service task, user task
          step.action = "api-call";
          step.config = {
            method: "GET",
            endpoint: "/api/placeholder",
          };

          if (element.outgoing.length > 0) {
            step.next = stepIdMap[element.outgoing[0].target];
          } else {
            step.next = stepIdMap["auto-end"] || "2";
          }
        }

        steps.push(step);
      });

      console.log("Final extracted steps:", steps);

      // Final validation
      const finalHasStart = steps.some((s) => s.type === "start-event");
      const finalHasEnd = steps.some((s) => s.type === "end-event");
      console.log(
        `Final validation - Has start: ${finalHasStart}, Has end: ${finalHasEnd}`
      );

      return steps;
    } catch (err) {
      console.error("Error extracting steps from BPMN:", err);
      return [];
    }
  };

  const convertBpmnTypeToStepType = (bpmnType) => {
    const typeMap = {
      "bpmn:startEvent": "start-event",
      "bpmn:endEvent": "end-event",
      "bpmn:task": "service-task",
      "bpmn:Task": "service-task",
      "bpmn:serviceTask": "service-task",
      "bpmn:userTask": "user-task",
      "bpmn:exclusiveGateway": "exclusive-gateway",
      "bpmn:parallelGateway": "parallel-gateway",
    };
    return typeMap[bpmnType] || "service-task";
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

  const mergeSteps = (extractedSteps, manualSteps) => {
    // Merge manually configured properties with extracted steps
    const merged = [...extractedSteps];

    manualSteps.forEach((manualStep) => {
      const index = merged.findIndex((s) => s.step_id === manualStep.step_id);
      if (index >= 0) {
        // Merge properties, keeping manual config
        merged[index] = {
          ...merged[index],
          ...manualStep,
          // Preserve structural properties from extracted
          step_id: merged[index].step_id,
          type: merged[index].type,
          next: manualStep.next || merged[index].next,
          branches: manualStep.branches || merged[index].branches,
        };
      }
    });

    return merged;
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
          savedProperties={
            selectedElement ? elementProperties[selectedElement.id] : null
          }
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
