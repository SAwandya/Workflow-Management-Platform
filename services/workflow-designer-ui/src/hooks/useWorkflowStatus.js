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
      console.log(
        `[useWorkflowStatus] Fetching status for instance: ${instanceId}`
      );

      const response = await axios.get(
        `${API_GATEWAY}/api/gateway/workflows/instances/${instanceId}/status`,
        {
          params: { tenant_id: tenantId },
        }
      );

      console.log(`[useWorkflowStatus] Response received:`, response.data);

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
        console.log(
          `[useWorkflowStatus] Workflow in terminal state, stopping polling`
        );
        setIsPolling(false);
      }
    } catch (err) {
      console.error(
        "[useWorkflowStatus] Failed to fetch workflow status:",
        err
      );
      console.error("[useWorkflowStatus] Error details:", err.response?.data);
      setError(
        err.response?.data?.details || err.response?.data?.error || err.message
      );
    } finally {
      setLoading(false);
    }
  }, [instanceId, tenantId, API_GATEWAY]);

  // Reset state when instanceId changes
  useEffect(() => {
    if (instanceId) {
      setLoading(true);
      setInstance(null);
      setState(null);
      setHistory([]);
      setError(null);
    }
  }, [instanceId]);

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
