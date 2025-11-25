#!/bin/bash

echo "=== WMC Phase 1 Integration Test ==="
echo ""

BASE_URL="http://localhost:3001"
GATEWAY_URL="http://localhost:3000"

echo "1. Testing Tenant A - High Value Order (triggers email approval workflow)"
echo "-------------------------------------------------------------------"
curl -X POST ${BASE_URL}/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-a" \
  -d '{
    "customer_id": "cust-123",
    "items": [{"product": "Laptop", "quantity": 1}],
    "total": 15000
  }' | jq '.'

echo ""
echo ""

echo "2. Testing Tenant B - High Value Order (triggers in-app approval workflow)"
echo "-------------------------------------------------------------------"
curl -X POST ${BASE_URL}/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-b" \
  -d '{
    "customer_id": "cust-456",
    "items": [{"product": "Server", "quantity": 1}],
    "total": 20000
  }' | jq '.'

echo ""
echo ""

echo "3. Testing Tenant A - Low Value Order (auto-approved, no workflow)"
echo "-------------------------------------------------------------------"
curl -X POST ${BASE_URL}/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-a" \
  -d '{
    "customer_id": "cust-789",
    "items": [{"product": "Mouse", "quantity": 1}],
    "total": 50
  }' | jq '.'

echo ""
echo "=== Test Complete ==="
