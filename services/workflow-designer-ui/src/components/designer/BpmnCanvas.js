import React, { useEffect, useRef } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "./BpmnCanvas.css";

const emptyBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="159" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

function BpmnCanvas({ bpmnXml, onBpmnChange, onElementSelect }) {
  const containerRef = useRef(null);
  const modelerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize BPMN modeler
    modelerRef.current = new BpmnModeler({
      container: containerRef.current,
      keyboard: {
        bindTo: window,
      },
    });

    const modeler = modelerRef.current;

    // Load BPMN diagram
    const xmlToLoad = bpmnXml || emptyBpmn;
    modeler
      .importXML(xmlToLoad)
      .then(({ warnings }) => {
        if (warnings.length) {
          console.warn("BPMN import warnings:", warnings);
        }

        const canvas = modeler.get("canvas");
        canvas.zoom("fit-viewport");
      })
      .catch((err) => {
        console.error("Error loading BPMN diagram:", err);
      });

    // Listen for element selection
    const eventBus = modeler.get("eventBus");
    eventBus.on("element.click", (event) => {
      const element = event.element;
      if (element.type !== "label") {
        onElementSelect && onElementSelect(element);
      }
    });

    // Listen for changes
    eventBus.on("commandStack.changed", () => {
      modeler.saveXML({ format: true }).then(({ xml }) => {
        onBpmnChange && onBpmnChange(xml);
      });
    });

    // Cleanup
    return () => {
      modeler.destroy();
    };
  }, []);

  // Reload diagram when bpmnXml prop changes externally
  useEffect(() => {
    if (modelerRef.current && bpmnXml) {
      modelerRef.current.importXML(bpmnXml).catch((err) => {
        console.error("Error reloading BPMN diagram:", err);
      });
    }
  }, [bpmnXml]);

  return (
    <div className="bpmn-canvas-container">
      <div ref={containerRef} className="bpmn-canvas" />
    </div>
  );
}

export default BpmnCanvas;
