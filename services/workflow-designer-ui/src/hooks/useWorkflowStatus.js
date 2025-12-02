import { useState, useEffect, useCallback } from "react";
import axios from "axios";

function useWorkflowStatus(instanceId, tenantId, pollingInterval = 5000) {
  const [instance, setInstance] = useState(null);
  const [state, setState] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const API_GATEWAY =
    process.env.REACT_APP_API_GATEWAY || "http://localhost:3000";

  const fetchStatus = useCallback(async () => {
    if (!instanceId) return;

    try {
      const response = await axios.get(
        `${API_GATEWAY}/api/gateway/workflows/instances/${instanceId}/status`,
        {
          params: { tenant_id: tenantId },
        }
      );

      setInstance(response.data.instance);
      setState(response.data.state);
      setHistory(response.data.history || []);
      setError(null);

      // Stop polling if workflow is in terminal state
      if (
        ["COMPLETED", "FAILED", "CANCELLED"].includes(
          response.data.instance.status
        )
      ) {
        setIsPolling(false);
      }
    } catch (err) {
      console.error("Failed to fetch workflow status:", err);
      setError(err.response?.data?.details || err.message);
    } finally {
      setLoading(false);
    }
  }, [instanceId, tenantId, API_GATEWAY]);

  // Initial fetch
  useEffect(() => {
    if (instanceId) {
      fetchStatus();
    }
  }, [instanceId, fetchStatus]);

  // Polling effect
  useEffect(() => {
    if (!instanceId || !isPolling) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [instanceId, isPolling, pollingInterval, fetchStatus]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchStatus();
  }, [fetchStatus]);

  return {
    instance,
    state,
    history,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    refresh,
  };
}

export default useWorkflowStatus;
