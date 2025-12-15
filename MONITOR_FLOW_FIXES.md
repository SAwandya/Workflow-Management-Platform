# Monitor Section Flow Fixes

## Issues Identified and Fixed

### 1. **Backend: Missing tenantId Parameter in getWorkflowStatus**

**File:** `services/execution-service/src/services/workflow-executor.service.js`

**Issue:** The `getWorkflowStatus` method was calling `findById(instanceId)` with only one parameter, but the repository expects `findById(instanceId, tenantId)`.

**Fix:** Updated line 246 to pass both parameters:

```javascript
const instance = await workflowInstanceRepository.findById(
  instanceId,
  tenantId
);
```

**Impact:** This was causing database queries to fail or return no results, preventing workflow status from loading.

---

### 2. **Frontend: State Not Resetting Between Instance Selections**

**File:** `services/workflow-designer-ui/src/hooks/useWorkflowStatus.js`

**Issue:** When clicking on a different workflow instance in the "Recent Workflows" list, the previous instance's data was still displayed until the new data loaded, causing confusion.

**Fix:** Added a new useEffect to reset state when instanceId changes:

```javascript
useEffect(() => {
  if (instanceId) {
    setLoading(true);
    setInstance(null);
    setState(null);
    setHistory([]);
    setError(null);
  }
}, [instanceId]);
```

**Impact:** Now when selecting a different workflow, the old data is immediately cleared and shows loading state.

---

### 3. **Frontend: Error State Not Properly Handled in UI**

**File:** `services/workflow-designer-ui/src/pages/WorkflowMonitor.js`

**Issue:** When there was an error fetching workflow status, the error banner was shown BUT the component still tried to render WorkflowStatusDisplay with null data, causing the status section to appear empty/broken.

**Fix:** Improved the conditional rendering logic to properly handle error states:

```javascript
{
  !selectedInstanceId ? (
    <div className="no-selection">...</div>
  ) : statusError ? (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <h3>Failed to Load Workflow Status</h3>
      <p>{statusError}</p>
      <button className="btn-retry" onClick={refresh}>
        Retry
      </button>
    </div>
  ) : statusLoading && !instance ? (
    <div className="loading">Loading workflow status...</div>
  ) : instance ? (
    <WorkflowStatusDisplay
      instance={instance}
      state={state}
      history={history}
      role={role}
    />
  ) : (
    <div className="no-data">No workflow data available</div>
  );
}
```

**Impact:** Errors are now shown clearly with a retry button instead of a confusing empty state.

---

### 4. **Frontend: Better Error Logging and Debugging**

**File:** `services/workflow-designer-ui/src/hooks/useWorkflowStatus.js`

**Issue:** When API calls failed, there wasn't enough information in the console to debug what went wrong.

**Fix:** Added comprehensive console logging:

```javascript
console.log(`[useWorkflowStatus] Fetching status for instance: ${instanceId}`);
console.log(`[useWorkflowStatus] Response received:`, response.data);
console.error("[useWorkflowStatus] Error details:", err.response?.data);
```

**Impact:** Developers can now see exactly what's happening in the network flow.

---

## Complete Monitor Flow

### 1. **Recent Workflows Section (Left Sidebar)**

```
WorkflowMonitor.js
  ↓ fetchRecentInstances()
  ↓ GET /api/gateway/workflows/instances/recent?tenant_id=X&limit=10
  ↓
API Gateway (port 3000)
  ↓ routes to
WMC Controller (port 3003)
  ↓ calls executionServiceClient.getRecentInstances()
  ↓
Execution Service (port 3004)
  ↓ GET /api/execution/instances/recent
  ↓ workflowInstanceRepository.findByTenant()
  ↓
Database: execution_repository.workflow_instances
  ↓ ORDER BY started_at DESC LIMIT 10
  ↓
Returns list of instances ✓
```

**Result:** Shows all workflows (RUNNING, WAITING, COMPLETED, FAILED) in the sidebar.

---

### 2. **Workflow Status Section (Main Panel)**

```
WorkflowMonitor.js
  ↓ selectedInstanceId set
  ↓ useWorkflowStatus hook activated
  ↓
useWorkflowStatus.js
  ↓ fetchStatus()
  ↓ GET /api/gateway/workflows/instances/{instanceId}/status?tenant_id=X
  ↓
API Gateway (port 3000)
  ↓ routes to
WMC Controller (port 3003)
  ↓ workflowTriggerController.getWorkflowStatus()
  ↓ calls executionServiceClient
  ↓
Execution Service (port 3004)
  ↓ GET /api/execution/instances/{instanceId}/status
  ↓ executionController.getWorkflowStatus()
  ↓ workflowExecutorService.getWorkflowStatus()
  ↓
Queries 3 repositories:
  1. workflowInstanceRepository.findById(instanceId, tenantId) → instance data
  2. workflowStateRepository.findByInstanceId(instanceId) → current step, variables
  3. stepHistoryRepository.findByInstanceId(instanceId) → execution timeline
  ↓
Returns { instance, state, history } ✓
  ↓
WorkflowStatusDisplay.js
  ↓ checks instance.status
  ↓
Renders appropriate status component:
  - RUNNING → ProcessingStatus
  - WAITING → PendingApprovalStatus (if user-task) or WaitingStatus
  - COMPLETED → CompletedStatus ✓
  - FAILED → Failed status card
```

**Result:** Shows detailed status for selected workflow with appropriate UI component.

---

## Testing Steps

### Test 1: View Completed Workflow

1. Open browser console (F12) to see debug logs
2. Navigate to Monitor page: `http://localhost:3007/monitor`
3. You should see workflows in "Recent Workflows" section
4. Click on a COMPLETED workflow in the list
5. **Expected:**
   - Console shows: `[useWorkflowStatus] Fetching status for instance: inst-XXX`
   - Console shows: `[useWorkflowStatus] Response received:` with data
   - Status section shows green checkmark ✓
   - Shows "Workflow Completed Successfully"
   - Shows duration and completion time
   - Shows execution timeline with all completed steps

### Test 2: Switch Between Workflows

1. Click on a WAITING workflow
2. **Expected:** Status section clears and shows loading, then displays approval UI
3. Click on a COMPLETED workflow
4. **Expected:** Status section clears and shows loading, then displays completed status
5. No stale data from previous workflow should appear

### Test 3: Error Handling

1. Stop the execution-service: `docker-compose stop execution-service`
2. Try to select a workflow
3. **Expected:**
   - Console shows error log
   - Status section shows error state with ⚠️ icon
   - "Failed to Load Workflow Status" message appears
   - "Retry" button is visible
4. Start service: `docker-compose start execution-service`
5. Click "Retry" button
6. **Expected:** Status loads successfully

### Test 4: Auto-Refresh (Polling)

1. Click "▶ Start Auto-Refresh" button
2. Select a RUNNING workflow
3. **Expected:**
   - Console shows fetch requests every 5 seconds
   - Status updates automatically as workflow progresses
   - When workflow reaches COMPLETED/FAILED, polling stops automatically
   - Indicator shows "Auto-refreshing every 5 seconds"

---

## Files Changed

1. ✅ `services/execution-service/src/services/workflow-executor.service.js` - Fixed findById call
2. ✅ `services/workflow-designer-ui/src/hooks/useWorkflowStatus.js` - Added state reset and logging
3. ✅ `services/workflow-designer-ui/src/pages/WorkflowMonitor.js` - Improved error handling UI

---

## Restart Required

After these changes, you need to restart the affected services:

```bash
docker-compose restart execution-service
docker-compose restart workflow-designer-ui
```

Or just restart all services:

```bash
docker-compose restart
```

---

## Expected Behavior After Fixes

### ✅ Recent Workflows Section

- Shows all workflow instances for the tenant
- Displays status badge (RUNNING, WAITING, COMPLETED, FAILED)
- Shows instance ID (truncated) and workflow ID
- Shows start time
- Highlights selected instance

### ✅ Workflow Status Section

- **For COMPLETED workflows:**
  - Green checkmark icon ✓
  - "Workflow Completed Successfully" message
  - Duration calculation
  - Completion timestamp
  - View Results (variables) dropdown
  - Execution timeline with all steps marked as completed
- **For WAITING workflows:**
  - Shows current step name
  - Shows approve/reject buttons (for managers)
  - Shows "Waiting for approval" message (for customers)
- **For RUNNING workflows:**

  - Shows progress indicator
  - Shows current executing step
  - Updates in real-time if polling enabled

- **For FAILED workflows:**
  - Red X icon
  - Error message
  - Step where failure occurred

### ✅ Error States

- Clear error message when API fails
- Retry button to refetch
- No broken/empty UI states

---

## Debug Checklist

If monitor still doesn't work:

1. **Check console for errors:**

   - Look for `[useWorkflowStatus]` logs
   - Check for network errors in Network tab

2. **Check backend logs:**

   ```bash
   docker-compose logs -f execution-service
   docker-compose logs -f wmc-controller
   ```

3. **Verify database has data:**

   ```bash
   docker-compose exec postgresql psql -U wmcuser -d wmcdb -c "SELECT instance_id, workflow_id, status, started_at FROM execution_repository.workflow_instances ORDER BY started_at DESC LIMIT 5;"
   ```

4. **Test API directly:**

   ```bash
   curl "http://localhost:3000/api/gateway/workflows/instances/recent?tenant_id=tenant-a&limit=5"
   curl "http://localhost:3000/api/gateway/workflows/instances/{INSTANCE_ID}/status?tenant_id=tenant-a"
   ```

5. **Check tenant_id matches:**
   - Frontend uses: `process.env.REACT_APP_TENANT_ID` or defaults to "tenant-a"
   - Make sure workflows were created with the same tenant_id
