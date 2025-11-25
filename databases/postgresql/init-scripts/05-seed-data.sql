-- Seed Data for Testing

-- Insert test tenants
INSERT INTO tenant_manager.tenants (tenant_id, name, status) VALUES
  ('tenant-a', 'Tenant A Corporation', 'ACTIVE'),
  ('tenant-b', 'Tenant B Enterprises', 'ACTIVE');

-- Register workflows for tenants
INSERT INTO tenant_manager.workflow_registry 
  (tenant_id, workflow_id, workflow_name, trigger_type, trigger_event, extension_point, status) 
VALUES
  ('tenant-a', 'wf-order-approval-email', 'Order Approval with Email', 'sync', 'ORDER_CREATED', 'business_logic', 'ACTIVE'),
  ('tenant-b', 'wf-order-approval-inapp', 'Order Approval In-App', 'sync', 'ORDER_CREATED', 'business_logic', 'ACTIVE');

-- Sample orders (optional)
INSERT INTO product.orders (order_id, tenant_id, customer_id, order_value, status, items) VALUES
  ('ord-001', 'tenant-a', 'cust-123', 5000.00, 'PENDING', '[{"item": "Product A", "qty": 2}]'::jsonb),
  ('ord-002', 'tenant-b', 'cust-456', 15000.00, 'PENDING', '[{"item": "Product B", "qty": 1}]'::jsonb);
