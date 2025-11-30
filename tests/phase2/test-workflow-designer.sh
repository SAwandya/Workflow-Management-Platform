#!/bin/bash

echo "=== Phase 2 - Workflow Designer Testing ==="
echo ""

BASE_URL="http://localhost:3006"
TENANT_ID="tenant-a"

# Test 1: Create a new workflow
echo "1. Creating new workflow..."
WORKFLOW_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/workflows \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: ${TENANT_ID}" \
  -d '{
    "workflow_id": "wf-test-designer-001",
    "name": "Test Designer Workflow",
    "description": "Created from workflow designer",
    "steps_json": {
      "steps": [
        {
          "step_id": "1",
          "step_name": "start",
          "type": "start-event",
          "next": "2"
        },
        {
          "step_id": "2",
          "step_name": "process-order",
          "type": "service-task",
          "action": "api-call",
          "config": {
            "method": "GET",
            "endpoint": "/api/orders/{orderId}"
          },
          "next": "3"
        },
        {
          "step_id": "3",
          "step_name": "end",
          "type": "end-event"
        }
      ]
    },
    "created_by": "test-user"
  }')

echo "$WORKFLOW_RESPONSE" | jq '.'
echo ""

# Test 2: List workflows
echo "2. Listing workflows..."
curl -s ${BASE_URL}/api/workflows \
  -H "X-Tenant-ID: ${TENANT_ID}" | jq '.'
echo ""

# Test 3: Get service catalog
echo "3. Fetching service catalog..."
curl -s http://localhost:3005/api/services/catalog | jq '.services[] | {service_id, name, category}'
echo ""

# Test 4: Get categories
echo "4. Fetching service categories..."
curl -s http://localhost:3005/api/services/catalog/categories | jq '.'
echo ""

echo "=== Tests Complete ==="
echo ""
echo "Access the Workflow Designer UI at: http://localhost:3007"
