#!/bin/bash

echo "Creating 10 concurrent orders..."

for i in {1..10}
do
  curl -X POST http://localhost:3001/api/orders \
    -H "Content-Type: application/json" \
    -H "X-Tenant-ID: tenant-a" \
    -d "{
      \"customer_id\": \"cust-load-$i\",
      \"items\": [{\"product\": \"Test Product\", \"quantity\": 1, \"price\": 15000}],
      \"total\": 15000
    }" &
done

wait
echo "All orders created!"

# Check workflow instances
docker exec -it wmc-postgresql psql -U wmc_admin -d wmc_platform -c "SELECT COUNT(*) FROM execution_repository.workflow_instances WHERE tenant_id = 'tenant-a';"
