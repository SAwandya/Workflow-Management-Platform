import axios from "axios";

const BASE_URL =
  process.env.REACT_APP_WORKFLOW_SERVICE || "http://localhost:3006";
const TENANT_ID = process.env.REACT_APP_TENANT_ID || "tenant-a";

const workflowApi = axios.create({
  baseURL: `${BASE_URL}/api/workflows`,
  headers: {
    "Content-Type": "application/json",
    "X-Tenant-ID": TENANT_ID,
  },
});

export const workflowService = {
  // List workflows
  listWorkflows: async (status = null) => {
    const params = status ? { status } : {};
    const response = await workflowApi.get("/", { params });
    return response.data;
  },

  // Get workflow by ID
  getWorkflow: async (workflowId) => {
    const response = await workflowApi.get(`/${workflowId}`);
    return response.data;
  },

  // Create workflow
  createWorkflow: async (workflowData) => {
    const response = await workflowApi.post("/", workflowData);
    return response.data;
  },

  // Update workflow
  updateWorkflow: async (workflowId, workflowData) => {
    const response = await workflowApi.put(`/${workflowId}`, workflowData);
    return response.data;
  },

  // Delete workflow
  deleteWorkflow: async (workflowId) => {
    const response = await workflowApi.delete(`/${workflowId}`);
    return response.data;
  },

  // Submit for approval
  submitForApproval: async (workflowId) => {
    const response = await workflowApi.post(`/${workflowId}/submit`);
    return response.data;
  },

  // Approve workflow
  approveWorkflow: async (workflowId) => {
    const response = await workflowApi.post(`/${workflowId}/approve`);
    return response.data;
  },

  // Reject workflow
  rejectWorkflow: async (workflowId) => {
    const response = await workflowApi.post(`/${workflowId}/reject`);
    return response.data;
  },
};
