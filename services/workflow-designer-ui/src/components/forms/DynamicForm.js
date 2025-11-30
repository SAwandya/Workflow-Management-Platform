import React from "react";
import "./DynamicForm.css";

function DynamicForm({ schema, values, onChange }) {
  const handleChange = (key, value) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  const renderField = (key, fieldSchema) => {
    const value = values[key] || "";
    const uiComponent = fieldSchema.ui_component || "text_input";

    switch (uiComponent) {
      case "text_input":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={fieldSchema.placeholder}
          />
        );

      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={fieldSchema.placeholder}
            rows={fieldSchema.rows || 3}
          />
        );

      case "number_input":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(key, parseFloat(e.target.value))}
            placeholder={fieldSchema.placeholder}
          />
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
          >
            <option value="">Select...</option>
            {fieldSchema.enum?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "variable_selector":
        return (
          <div className="variable-selector">
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={fieldSchema.placeholder || "${variableName}"}
            />
            <small>
              Use $&#123;variableName&#125; to reference workflow variables
            </small>
          </div>
        );

      case "secret_input":
        return (
          <input
            type="password"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={fieldSchema.placeholder}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        );
    }
  };

  if (!schema || !schema.properties) {
    return <p className="form-info">No configuration required</p>;
  }

  return (
    <div className="dynamic-form">
      {Object.keys(schema.properties).map((key) => {
        const fieldSchema = schema.properties[key];

        return (
          <div key={key} className="form-group">
            <label>
              {fieldSchema.title || key}
              {fieldSchema.required && <span className="required">*</span>}
            </label>
            {fieldSchema.description && (
              <small className="field-description">
                {fieldSchema.description}
              </small>
            )}
            {renderField(key, fieldSchema)}
          </div>
        );
      })}
    </div>
  );
}

export default DynamicForm;
