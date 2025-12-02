#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "=== Phase 2 Testing Suite ==="

# Test 1: Create Workflow
echo -e "\n${GREEN}[1] Creating workflow...${NC}"
WF_RESPONSE=$(curl -s -X POST http://localhost:3006/api/workflows \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-a" \
  -d '{"name":"Auto Test","steps_json":{"steps":[{"step_id":"1","type":"start-event","next":"2"},{"step_id":"2","type":"end-event"}]},"created_by":"script"}')

WF_ID=$(echo "$WF_RESPONSE" | jq -r '.workflow.workflow_id')
echo "Workflow ID: $WF_ID"

# Test 2: Approve
echo -e "\n${GREEN}[2] Approving workflow...${NC}"
curl -s -X POST http://localhost:3006/api/workflows/$WF_ID/approve \
  -H "X-Tenant-ID: tenant-a" | jq '.message'

# Test 3: Register
echo -e "\n${GREEN}[3] Registering workflow...${NC}"
curl -s -X POST http://localhost:3002/api/tenants/tenant-a/workflows \
  -H "Content-Type: application/json" \
  -d "{\"workflow_id\":\"$WF_ID\",\"workflow_name\":\"Auto Test\",\"trigger_type\":\"sync\",\"trigger_event\":\"TEST_EVENT\"}" \
  | jq '.message'

# Test 4: Trigger
echo -e "\n${GREEN}[4] Creating order to trigger workflow...${NC}"
ORDER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-a" \
  -d '{"customer_id":"test","items":[],"total":15000}')

INSTANCE_ID=$(echo "$ORDER_RESPONSE" | jq -r '.workflow.instanceId')
echo "Instance ID: $INSTANCE_ID"

# Test 5: Check Status
echo -e "\n${GREEN}[5] Checking workflow status...${NC}"
sleep 2
curl -s "http://localhost:3000/api/gateway/workflows/instances/$INSTANCE_ID/status?tenant_id=tenant-a" \
  | jq '{status: .instance.status, steps: [.history[] | {name: .step_name, status: .status}]}'

echo -e "\n${GREEN}✓ All tests complete!${NC}"
