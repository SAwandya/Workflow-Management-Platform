#!/bin/bash

echo "Resetting WMC Database..."
echo "=========================="

# Stop and remove volumes
echo "Stopping containers and removing volumes..."
docker-compose down -v

# Wait a moment
sleep 2

# Start fresh
echo "Starting with fresh database..."
docker-compose up -d postgresql redis

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to initialize..."
sleep 10

# Check if tables exist
echo "Verifying tables..."
docker exec -it wmc-postgresql psql -U wmc_admin -d wmc_platform -c "\dt tenant_manager.*"

# Start other services
echo "Starting remaining services..."
docker-compose up -d

echo ""
echo "✓ Database reset complete!"
echo "Run: curl http://localhost:3002/api/tenants to verify"
