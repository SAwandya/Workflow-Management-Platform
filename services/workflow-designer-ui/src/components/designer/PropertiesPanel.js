import React, { useState, useEffect } from "react";
import ServiceSelector from "./ServiceSelector";
import DynamicForm from "../forms/DynamicForm";
import UIStateConfig from "../forms/UIStateConfig";
import "./PropertiesPanel.css";

function PropertiesPanel({ selectedElement, onPropertiesChange }) {
  const [properties, setProperties] = useState({});
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceSelector, setShowServiceSelector] = useState(false);

  useEffect(() => {
    if (selectedElement) {
      // Initialize properties from element
      const businessObject = selectedElement.businessObject;
      setProperties({
        id: selectedElement.id,
        name: businessObject.name || "",
        type: selectedElement.type,
        ...businessObject.$attrs,
      });
    }
  }, [selectedElement]);

  const handlePropertyChange = (key, value) => {
    const updatedProperties = {
      ...properties,
      [key]: value,
    };
    setProperties(updatedProperties);
    onPropertiesChange &&
      onPropertiesChange(selectedElement, updatedProperties);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowServiceSelector(false);
    handlePropertyChange("service_id", service.service_id);
  };

  if (!selectedElement) {
    return (
      <div className="properties-panel">
        <div className="panel-empty">
          <p>Select an element to view properties</p>
        </div>
      </div>
    );
  }

  const isTask = selectedElement.type.includes("Task");
  const isGateway = selectedElement.type.includes("Gateway");
  const isEvent = selectedElement.type.includes("Event");

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>Properties</h3>
        <span className="element-type">{selectedElement.type}</span>
      </div>

      <div className="panel-content">
        {/* Basic Properties */}
        <div className="property-section">
          <h4>Basic Information</h4>

          <div className="form-group">
            <label>ID</label>
            <input
              type="text"
              value={properties.id || ""}
              disabled
              className="readonly"
            />
          </div>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={properties.name || ""}
              onChange={(e) => handlePropertyChange("name", e.target.value)}
              placeholder="Enter step name"
            />
          </div>
        </div>

        {/* Service Task Configuration */}
        {isTask && (
          <div className="property-section">
            <h4>Service Configuration</h4>

            {!selectedService && (
              <button
                className="primary"
                onClick={() => setShowServiceSelector(true)}
              >
                Select Service
              </button>
            )}

            {selectedService && (
              <>
                <div className="selected-service">
                  <div className="service-info">
                    <strong>{selectedService.name}</strong>
                    <span className="service-category">
                      {selectedService.category}
                    </span>
                  </div>
                  <button
                    className="secondary small"
                    onClick={() => setShowServiceSelector(true)}
                  >
                    Change
                  </button>
                </div>

                <DynamicForm
                  schema={selectedService.parameters_schema}
                  values={properties.serviceConfig || {}}
                  onChange={(config) =>
                    handlePropertyChange("serviceConfig", config)
                  }
                />
              </>
            )}

            {showServiceSelector && (
              <ServiceSelector
                onSelect={handleServiceSelect}
                onClose={() => setShowServiceSelector(false)}
              />
            )}
          </div>
        )}

        {/* Gateway Configuration */}
        {isGateway && (
          <div className="property-section">
            <h4>Gateway Configuration</h4>

            <div className="form-group">
              <label>Condition</label>
              <textarea
                value={properties.condition || ""}
                onChange={(e) =>
                  handlePropertyChange("condition", e.target.value)
                }
                placeholder="e.g., orderValue > 10000"
                rows={3}
              />
              <small>Use workflow variables in your condition</small>
            </div>
          </div>
        )}

        {/* UI State Configuration */}
        {isTask && (
          <div className="property-section">
            <h4>UI State Configuration</h4>
            <UIStateConfig
              uiState={properties.uiState || {}}
              onChange={(uiState) => handlePropertyChange("uiState", uiState)}
            />
          </div>
        )}

        {/* Documentation */}
        <div className="property-section">
          <h4>Documentation</h4>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={properties.documentation || ""}
              onChange={(e) =>
                handlePropertyChange("documentation", e.target.value)
              }
              placeholder="Describe what this step does"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertiesPanel;
