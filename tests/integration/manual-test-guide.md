# Phase 1 Manual Testing Guide

## Prerequisites

1. Start all services:

```bash
cd c:\Users\sachi\Desktop\WMC2
docker-compose up --build
```

2. Wait for all services to be healthy (check logs)

## Test Scenarios

### Scenario 1: High-Value Order (Tenant A - Email Workflow)

**Expected Behavior**: Order triggers email approval workflow, waits for approval

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-a" \
  -d '{
    "customer_id": "cust-123",
    "items": [{"product": "Laptop", "quantity": 1}],
    "total": 15000
  }'
```

**Expected Response**:

```json
{
  "message": "Order created and workflow triggered",
  "order": { ... },
  "workflow": {
    "triggered": true,
    "instanceId": "inst-...",
    "status": "WAITING"
  }
}
```

**Verify**:

1. Check execution_repository.workflow_instances table - status should be WAITING
2. Check execution_repository.step_history - should show completed steps
3. Check logs for "[EMAIL]" notification

### Scenario 2: Low-Value Order (Auto-Approved)

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-a" \
  -d '{
    "customer_id": "cust-789",
    "items": [{"product": "Mouse", "quantity": 1}],
    "total": 50
  }'
```

**Expected**: Order auto-confirmed, workflow completes immediately

### Scenario 3: Resume Workflow

Get instance ID from Scenario 1, then:

```bash
curl -X POST http://localhost:3000/api/gateway/workflows/instances/{instanceId}/resume \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-a" \
  -d '{
    "step_id": "5",
    "user_input": {
      "approved": true,
      "approver": "manager@tenant-a.com"
    }
  }'
```

**Expected**: Workflow continues and completes

## Verification Queries

```sql
-- Check workflow instances
SELECT * FROM execution_repository.workflow_instances
WHERE tenant_id = 'tenant-a'
ORDER BY started_at DESC;

-- Check execution state
SELECT * FROM execution_repository.execution_state
WHERE instance_id = 'inst-...';

-- Check step history
SELECT * FROM execution_repository.step_history
WHERE instance_id = 'inst-...'
ORDER BY started_at ASC;

-- Check orders
SELECT * FROM product.orders
WHERE tenant_id = 'tenant-a'
ORDER BY created_at DESC;
```

## Success Criteria

✅ High-value order triggers workflow
✅ Low-value order auto-approved
✅ Tenant A uses email workflow
✅ Tenant B uses in-app workflow
✅ Workflow state persisted correctly
✅ Step history logged
✅ Tenant isolation verified
