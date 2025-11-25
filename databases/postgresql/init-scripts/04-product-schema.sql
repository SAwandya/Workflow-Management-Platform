-- Product Database Schema

CREATE TABLE product.orders (
  order_id VARCHAR(100) PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL,
  customer_id VARCHAR(100) NOT NULL,
  order_value DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CONFIRMED', 'CANCELLED')),
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_tenant ON product.orders(tenant_id);
CREATE INDEX idx_orders_status ON product.orders(status);
CREATE INDEX idx_orders_customer ON product.orders(customer_id);

-- Audit trigger
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON product.orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
