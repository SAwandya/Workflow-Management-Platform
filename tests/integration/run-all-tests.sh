#!/bin/bash

echo "========================================"
echo "WMC Platform Phase 1 - Integration Tests"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test 1: Health Checks
echo "Test 1: Health Checks"
if curl -s http://localhost:3001/health | grep -q "healthy"; then
  echo -e "${GREEN}✓ Product Service is healthy${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Product Service failed${NC}"
  ((FAILED++))
fi

if curl -s http://localhost:3002/health | grep -q "healthy"; then
  echo -e "${GREEN}✓ Tenant Manager is healthy${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Tenant Manager failed${NC}"
  ((FAILED++))
fi

echo ""

# Test 2: Seed Data
echo "Test 2: Verify Seed Data"
TENANT_COUNT=$(curl -s http://localhost:3002/api/tenants | grep -o "tenant-" | wc -l)
if [ "$TENANT_COUNT" -ge 2 ]; then
  echo -e "${GREEN}✓ Tenants exist (count: $TENANT_COUNT)${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Tenants not found${NC}"
  ((FAILED++))
fi

echo ""

# Test 3: High-Value Order (Main Workflow Test)
echo "Test 3: High-Value Order Workflow"
RESPONSE=$(curl -s -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-a" \
  -d '{
    "customer_id": "test-cust-001",
    "items": [{"product": "Test Product", "quantity": 1, "price": 15000}],
    "total": 15000
  }')

if echo "$RESPONSE" | grep -q "workflow triggered"; then
  echo -e "${GREEN}✓ Workflow triggered successfully${NC}"
  ((PASSED++))
  
  # Extract instance ID
  INSTANCE_ID=$(echo "$RESPONSE" | grep -o '"instanceId":"[^"]*' | cut -d'"' -f4)
  echo "  Instance ID: $INSTANCE_ID"
  
  # Check status
  STATUS_RESPONSE=$(curl -s "http://localhost:3000/api/gateway/workflows/instances/$INSTANCE_ID/status?tenant_id=tenant-a")
  if echo "$STATUS_RESPONSE" | grep -q "WAITING"; then
    echo -e "${GREEN}✓ Workflow status is WAITING${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ Workflow status incorrect${NC}"
    ((FAILED++))
  fi
else
  echo -e "${RED}✗ Workflow trigger failed${NC}"
  ((FAILED++))
fi

echo ""

# Test 4: Low-Value Order
echo "Test 4: Low-Value Order (Auto-Approved)"
RESPONSE=$(curl -s -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-a" \
  -d '{
    "customer_id": "test-cust-002",
    "items": [{"product": "Mouse", "quantity": 1, "price": 50}],
    "total": 50
  }')

if echo "$RESPONSE" | grep -q "COMPLETED"; then
  echo -e "${GREEN}✓ Low-value order completed immediately${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Low-value order test failed${NC}"
  ((FAILED++))
fi

echo ""

# Test 5: Tenant B Different Workflow
echo "Test 5: Tenant B (Different Workflow)"
RESPONSE=$(curl -s -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-b" \
  -d '{
    "customer_id": "test-cust-003",
    "items": [{"product": "Server", "quantity": 1, "price": 20000}],
    "total": 20000
  }')

if echo "$RESPONSE" | grep -q "workflow triggered"; then
  echo -e "${GREEN}✓ Tenant B workflow triggered${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Tenant B workflow failed${NC}"
  ((FAILED++))
fi

echo ""
echo "========================================"
echo "Test Results"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
