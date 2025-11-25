/**
 * Hardcoded workflow definitions for Phase 1
 * In Phase 2, these will be stored in database and editable via UI
 */

const workflows = {
  "wf-order-approval-email": {
    workflow_id: "wf-order-approval-email",
    tenant_id: "tenant-a",
    name: "Order Approval with Email",
    description: "Email-based order approval workflow",
    steps: [
      {
        step_id: "1",
        step_name: "start",
        type: "start-event",
        next: "2",
      },
      {
        step_id: "2",
        step_name: "check-order-value",
        type: "service-task",
        action: "api-call",
        config: {
          method: "GET",
          endpoint: "/api/orders/{orderId}",
          output_variable: "orderDetails",
        },
        next: "3",
      },
      {
        step_id: "3",
        step_name: "approval-gateway",
        type: "exclusive-gateway",
        condition: "orderDetails.order.order_value > 10000", // FIXED: Added .order
        branches: {
          true: "4",
          false: "6",
        },
      },
      {
        step_id: "4",
        step_name: "send-approval-email",
        type: "service-task",
        action: "send-notification",
        config: {
          channel: "email",
          recipient: "manager@tenant-a.com",
          template: "order-approval-request",
          data_mapping: {
            orderId: "orderDetails.order.order_id", // FIXED
            orderValue: "orderDetails.order.order_value", // FIXED
          },
        },
        next: "5",
      },
      {
        step_id: "5",
        step_name: "wait-for-approval",
        type: "user-task",
        config: {
          timeout: "24h",
          assignment: "manager@tenant-a.com",
        },
        next: "6",
      },
      {
        step_id: "6",
        step_name: "confirm-order",
        type: "service-task",
        action: "api-call",
        config: {
          method: "PATCH",
          endpoint: "/api/orders/{orderId}/confirm",
          body: {
            status: "CONFIRMED",
          },
        },
        next: "7",
      },
      {
        step_id: "7",
        step_name: "end",
        type: "end-event",
      },
    ],
  },

  "wf-order-approval-inapp": {
    workflow_id: "wf-order-approval-inapp",
    tenant_id: "tenant-b",
    name: "Order Approval In-App",
    description: "In-app notification based order approval workflow",
    steps: [
      {
        step_id: "1",
        step_name: "start",
        type: "start-event",
        next: "2",
      },
      {
        step_id: "2",
        step_name: "check-order-value",
        type: "service-task",
        action: "api-call",
        config: {
          method: "GET",
          endpoint: "/api/orders/{orderId}",
          output_variable: "orderDetails",
        },
        next: "3",
      },
      {
        step_id: "3",
        step_name: "approval-gateway",
        type: "exclusive-gateway",
        condition: "orderDetails.order.order_value > 10000", // FIXED
        branches: {
          true: "4",
          false: "6",
        },
      },
      {
        step_id: "4",
        step_name: "send-inapp-notification",
        type: "service-task",
        action: "send-notification",
        config: {
          channel: "inapp",
          recipient: "manager@tenant-b.com",
          template: "order-approval-request",
          data_mapping: {
            orderId: "orderDetails.order.order_id", // FIXED
            orderValue: "orderDetails.order.order_value", // FIXED
          },
        },
        next: "5",
      },
      {
        step_id: "5",
        step_name: "wait-for-approval",
        type: "user-task",
        config: {
          timeout: "24h",
          assignment: "manager@tenant-b.com",
        },
        next: "6",
      },
      {
        step_id: "6",
        step_name: "confirm-order",
        type: "service-task",
        action: "api-call",
        config: {
          method: "PATCH",
          endpoint: "/api/orders/{orderId}/confirm",
          body: {
            status: "CONFIRMED",
          },
        },
        next: "7",
      },
      {
        step_id: "7",
        step_name: "end",
        type: "end-event",
      },
    ],
  },
};

function getWorkflowDefinition(workflowId) {
  return workflows[workflowId] || null;
}

function getAllWorkflows() {
  return Object.values(workflows);
}

module.exports = {
  getWorkflowDefinition,
  getAllWorkflows,
};
