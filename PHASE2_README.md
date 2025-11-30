# Phase 2 - Visual Workflow Designer

## What's New in Phase 2

Phase 2 adds a visual workflow designer that allows non-technical users to create and manage workflows through a drag-and-drop interface.

### New Services

1. **Workflow Service** (Port 3006)

   - CRUD API for workflow definitions
   - Workflow version management
   - Approval workflow (submit → approve/reject)

2. **Workflow Designer UI** (Port 3007)

   - React-based visual designer
   - BPMN.js integration for drag-and-drop
   - Service catalog browser
   - Properties panel with dynamic forms

3. **Service Catalog API** (in Integration Service)
   - Browse available services
   - Search and filter by category
   - Custom service registration

### New Database Schemas

- `workflow_repository.workflows` - Workflow definitions
- `workflow_repository.workflow_versions` - Version history
- `workflow_repository.service_catalog` - Available services
- `workflow_repository.custom_services` - Tenant-specific services

## Running Phase 2

### Start All Services

```bash
cd c:\Users\sachi\Desktop\WMC2
docker-compose down -v
docker-compose up --build
```

### Access Points

- **Workflow Designer UI**: http://localhost:3007
- **Workflow Service API**: http://localhost:3006
- **Service Catalog API**: http://localhost:3005/api/services/catalog

### Test Workflow Creation

1. Open browser to http://localhost:3007
2. Click "Create New Workflow"
3. Drag BPMN elements onto canvas
4. Click on an element to configure properties
5. Select a service from the catalog
6. Configure service parameters
7. Add UI state configuration
8. Save workflow

### API Testing

```bash
# List workflows
curl http://localhost:3006/api/workflows -H "X-Tenant-ID: tenant-a"

# Get service catalog
curl http://localhost:3005/api/services/catalog

# Search services
curl "http://localhost:3005/api/services/catalog?search=stripe"

# Get service schema
curl http://localhost:3005/api/services/catalog/product.orders.get/schema
```

## Phase 2 Features

### ✅ Implemented

- [x] Workflow CRUD API
- [x] Service catalog with 7+ services
- [x] Visual BPMN designer
- [x] Properties panel
- [x] Service selector with categories
- [x] Dynamic form generation from JSON schema
- [x] UI state configuration
- [x] Workflow list page
- [x] Version management
- [x] Approval workflow (submit/approve/reject)

### 🚧 Partially Implemented

- [ ] Workflow Monitor (placeholder for Week 4)
- [ ] Real-time execution tracking
- [ ] Advanced BPMN elements (parallel gateways, timers)

### 📋 Planned for Week 3-4

- [ ] Complete workflow monitor dashboard
- [ ] Dynamic status rendering based on UI state
- [ ] Workflow validation in designer
- [ ] BPMN XML import/export
- [ ] Workflow templates

## Architecture Changes

### Phase 1 → Phase 2 Migration

**Before (Phase 1):**

- Workflows hardcoded in `execution-service/src/workflows/`
- No visual editing

**After (Phase 2):**

- Workflows stored in database (`workflow_repository.workflows`)
- Visual designer for creating workflows
- Execution Service checks database first, falls back to hardcoded

### Backward Compatibility

Phase 1 hardcoded workflows still work! The Execution Service:

1. First tries to load from Workflow Service (database)
2. If not found or not approved, falls back to hardcoded definitions

## Development Workflow

### Adding New Services to Catalog

```sql
INSERT INTO workflow_repository.service_catalog
  (service_id, name, category, description, parameters_schema)
VALUES (
  'custom.service.id',
  'My Custom Service',
  'external_api',
  'Description of service',
  '{"type":"object","properties":{...}}'::jsonb
);
```

### Creating Custom Services via API

```bash
curl -X POST http://localhost:3005/api/services/custom \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-a" \
  -d '{
    "name": "My API",
    "endpoint_url": "https://api.example.com/endpoint",
    "parameters_schema": {
      "type": "object",
      "properties": {
        "param1": {"type": "string", "title": "Parameter 1"}
      }
    }
  }'
```

## Troubleshooting

### Workflow Designer UI Not Loading

```bash
# Check if service is running
docker ps | grep workflow-designer-ui

# Check logs
docker logs wmc-workflow-designer-ui

# Rebuild if needed
docker-compose build workflow-designer-ui
docker-compose up -d workflow-designer-ui
```

### Service Catalog Empty

```bash
# Check if seed data ran
docker exec -it wmc-postgresql psql -U wmc_admin -d wmc_platform \
  -c "SELECT COUNT(*) FROM workflow_repository.service_catalog;"

# Re-run seed script if needed
docker exec -i wmc-postgresql psql -U wmc_admin -d wmc_platform \
  < databases/postgresql/init-scripts/07-seed-service-catalog.sql
```

### Workflows Not Executing

Check that workflows are APPROVED:

```sql
UPDATE workflow_repository.workflows
SET status = 'APPROVED'
WHERE workflow_id = 'your-workflow-id';
```

## Next Steps: Week 3-4

1. Complete Workflow Monitor dashboard
2. Add real-time status updates
3. Implement advanced BPMN elements
4. Add workflow templates
5. Improve validation and error handling

---

**Phase 2 is now functional! You can visually create workflows that execute in Phase 1's runtime engine.** 🎉
