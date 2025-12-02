#!/bin/bash

echo "=== Checking Database Structure ==="
echo ""

echo "1. Checking if PostgreSQL is running..."
docker exec -it wmc-postgresql pg_isready -U wmc_admin -d wmc_platform

echo ""
echo "2. Listing all schemas..."
docker exec -it wmc-postgresql psql -U wmc_admin -d wmc_platform -c "\dn"

echo ""
echo "3. Listing all tables..."
docker exec -it wmc-postgresql psql -U wmc_admin -d wmc_platform -c "\dt *.*"

echo ""
echo "4. Counting records in key tables..."
docker exec -it wmc-postgresql psql -U wmc_admin -d wmc_platform << EOF
SELECT 'tenants' as table_name, COUNT(*) FROM tenant_manager.tenants
UNION ALL
SELECT 'workflows', COUNT(*) FROM workflow_repository.workflows
UNION ALL
SELECT 'workflow_registry', COUNT(*) FROM tenant_manager.workflow_registry
UNION ALL
SELECT 'service_catalog', COUNT(*) FROM workflow_repository.service_catalog
UNION ALL
SELECT 'workflow_instances', COUNT(*) FROM execution_repository.workflow_instances
UNION ALL
SELECT 'orders', COUNT(*) FROM product.orders;
EOF

echo ""
echo "=== Check Complete ==="
