#!/bin/bash

echo "Starting WMC Platform - Phase 1"
echo "================================"

# Build and start all services
docker-compose up --build -d

echo ""
echo "Waiting for services to start..."
sleep 10

# Check service health
echo ""
echo "Checking service health..."
curl -s http://localhost:3002/health | jq '.'
curl -s http://localhost:3001/health | jq '.'
curl -s http://localhost:3000/health | jq '.'
curl -s http://localhost:3003/health | jq '.'
curl -s http://localhost:3004/health | jq '.'
curl -s http://localhost:3005/health | jq '.'

echo ""
echo "================================"
echo "Platform started successfully!"
echo ""
echo "Services:"
echo "  - Product Service:     http://localhost:3001"
echo "  - Tenant Manager:      http://localhost:3002"
echo "  - API Gateway:         http://localhost:3000"
echo "  - WMC Controller:      http://localhost:3003"
echo "  - Execution Service:   http://localhost:3004"
echo "  - Integration Service: http://localhost:3005"
echo ""
echo "Test with:"
echo "  bash tests/integration/test-order-workflow.sh"
