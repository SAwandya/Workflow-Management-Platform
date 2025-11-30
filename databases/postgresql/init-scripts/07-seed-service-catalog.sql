-- Seed Service Catalog with common services

-- Product API Services
INSERT INTO workflow_repository.service_catalog (service_id, name, category, description, icon, endpoint_url, authentication_type, parameters_schema, response_schema) VALUES
(
  'product.orders.get',
  'Get Order Details',
  'product_api',
  'Retrieve order information from product database',
  'file-text',
  '/api/orders/{orderId}',
  'jwt',
  '{
    "type": "object",
    "properties": {
      "orderId": {
        "type": "string",
        "title": "Order ID",
        "description": "The unique order identifier",
        "required": true,
        "ui_component": "variable_selector",
        "placeholder": "${orderId}"
      }
    }
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "order_id": {"type": "string"},
      "order_value": {"type": "number"},
      "status": {"type": "string"},
      "customer_id": {"type": "string"}
    }
  }'::jsonb
),
(
  'product.orders.update',
  'Update Order Status',
  'product_api',
  'Update order status in product database',
  'edit',
  '/api/orders/{orderId}/confirm',
  'jwt',
  '{
    "type": "object",
    "properties": {
      "orderId": {
        "type": "string",
        "title": "Order ID",
        "required": true,
        "ui_component": "variable_selector"
      },
      "status": {
        "type": "string",
        "title": "New Status",
        "required": true,
        "ui_component": "select",
        "enum": ["CONFIRMED", "REJECTED", "CANCELLED"],
        "default": "CONFIRMED"
      }
    }
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "success": {"type": "boolean"},
      "order": {"type": "object"}
    }
  }'::jsonb
);

-- External API Services
INSERT INTO workflow_repository.service_catalog (service_id, name, category, description, icon, endpoint_url, authentication_type, parameters_schema) VALUES
(
  'stripe.payment.charge',
  'Stripe - Create Charge',
  'external_api',
  'Charge a credit card via Stripe API',
  'credit-card',
  'https://api.stripe.com/v1/charges',
  'api_key',
  '{
    "type": "object",
    "properties": {
      "api_key": {
        "type": "string",
        "title": "Stripe API Key",
        "description": "Your Stripe secret key",
        "required": true,
        "ui_component": "secret_input",
        "sensitive": true
      },
      "amount": {
        "type": "number",
        "title": "Amount (cents)",
        "description": "Amount to charge in cents",
        "required": true,
        "ui_component": "variable_selector",
        "placeholder": "${order_value}"
      },
      "currency": {
        "type": "string",
        "title": "Currency",
        "required": true,
        "ui_component": "select",
        "enum": ["usd", "eur", "gbp", "aud"],
        "default": "usd"
      },
      "description": {
        "type": "string",
        "title": "Description",
        "ui_component": "text_input",
        "placeholder": "Payment for order ${orderId}"
      }
    }
  }'::jsonb
),
(
  'paypal.payment.create',
  'PayPal - Create Payment',
  'external_api',
  'Create a PayPal payment',
  'credit-card',
  'https://api.paypal.com/v1/payments/payment',
  'oauth',
  '{
    "type": "object",
    "properties": {
      "client_id": {
        "type": "string",
        "title": "PayPal Client ID",
        "required": true,
        "ui_component": "secret_input",
        "sensitive": true
      },
      "amount": {
        "type": "number",
        "title": "Amount",
        "required": true,
        "ui_component": "variable_selector"
      },
      "currency": {
        "type": "string",
        "title": "Currency",
        "required": true,
        "ui_component": "select",
        "enum": ["USD", "EUR", "GBP"],
        "default": "USD"
      }
    }
  }'::jsonb
);

-- Notification Services
INSERT INTO workflow_repository.service_catalog (service_id, name, category, description, icon, authentication_type, parameters_schema) VALUES
(
  'notification.email.send',
  'Send Email',
  'notification',
  'Send email notification',
  'mail',
  'none',
  '{
    "type": "object",
    "properties": {
      "recipient": {
        "type": "string",
        "title": "Recipient Email",
        "required": true,
        "ui_component": "text_input",
        "format": "email"
      },
      "template": {
        "type": "string",
        "title": "Email Template",
        "required": true,
        "ui_component": "select",
        "enum": ["order-approval-request", "order-confirmed", "order-rejected"]
      },
      "data": {
        "type": "object",
        "title": "Template Data",
        "ui_component": "variable_mapper",
        "description": "Map workflow variables to template variables"
      }
    }
  }'::jsonb
),
(
  'notification.sms.send',
  'Send SMS',
  'notification',
  'Send SMS via Twilio',
  'message-square',
  'api_key',
  '{
    "type": "object",
    "properties": {
      "api_key": {
        "type": "string",
        "title": "Twilio API Key",
        "required": true,
        "ui_component": "secret_input",
        "sensitive": true
      },
      "phone_number": {
        "type": "string",
        "title": "Recipient Phone",
        "required": true,
        "ui_component": "variable_selector"
      },
      "message": {
        "type": "string",
        "title": "Message Text",
        "required": true,
        "ui_component": "textarea",
        "maxLength": 160
      }
    }
  }'::jsonb
),
(
  'notification.push.send',
  'Send Push Notification',
  'notification',
  'Send push notification to mobile app',
  'bell',
  'none',
  '{
    "type": "object",
    "properties": {
      "user_id": {
        "type": "string",
        "title": "User ID",
        "required": true,
        "ui_component": "variable_selector"
      },
      "title": {
        "type": "string",
        "title": "Notification Title",
        "required": true,
        "ui_component": "text_input"
      },
      "message": {
        "type": "string",
        "title": "Message",
        "required": true,
        "ui_component": "textarea"
      },
      "action_url": {
        "type": "string",
        "title": "Action URL",
        "ui_component": "text_input"
      }
    }
  }'::jsonb
);
