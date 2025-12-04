import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./OrderForm.css";

function OrderForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    customer_id: "",
    product: "",
    quantity: 1,
    price: "",
    notes: "",
  });

  const PRODUCT_SERVICE =
    process.env.REACT_APP_PRODUCT_SERVICE || "http://localhost:3001";
  const TENANT_ID = process.env.REACT_APP_TENANT_ID || "tenant-a";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTotal = () => {
    return (
      (parseFloat(formData.price) || 0) * (parseInt(formData.quantity) || 0)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.customer_id || !formData.product || !formData.price) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const total = calculateTotal();
      const orderData = {
        customer_id: formData.customer_id,
        items: [
          {
            product: formData.product,
            quantity: parseInt(formData.quantity),
            price: parseFloat(formData.price),
          },
        ],
        total: total,
        notes: formData.notes || undefined,
      };

      console.log("Creating order:", orderData);

      const response = await axios.post(
        `${PRODUCT_SERVICE}/api/orders`,
        orderData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-ID": TENANT_ID,
          },
        }
      );

      console.log("Order created:", response.data);

      // Get order ID and workflow instance ID
      const orderId = response.data.order.order_id;

      // Show success and redirect to status page
      alert("Order placed successfully!");
      navigate(`/order/${orderId}`);
    } catch (err) {
      console.error("Order creation failed:", err);
      setError(
        "Failed to place order: " + (err.response?.data?.details || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  return (
    <div className="order-form-page">
      <div className="page-header">
        <h2>Place New Order</h2>
        <p>Fill in the details below to place your order</p>
      </div>

      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError(null)} className="close-btn">
            ×
          </button>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="order-form">
          <div className="form-section">
            <h3>Customer Information</h3>

            <div className="form-group">
              <label htmlFor="customer_id">
                Customer ID <span className="required">*</span>
              </label>
              <input
                type="text"
                id="customer_id"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                placeholder="e.g., cust-john-001"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Product Details</h3>

            <div className="form-group">
              <label htmlFor="product">
                Product Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="product"
                name="product"
                value={formData.product}
                onChange={handleChange}
                placeholder="e.g., Dell PowerEdge Server"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">
                  Quantity <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">
                  Unit Price ($) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any special instructions or notes..."
              />
            </div>
          </div>

          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Product:</span>
              <strong>{formData.product || "N/A"}</strong>
            </div>
            <div className="summary-row">
              <span>Quantity:</span>
              <strong>{formData.quantity}</strong>
            </div>
            <div className="summary-row">
              <span>Unit Price:</span>
              <strong>${formData.price || "0.00"}</strong>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            {total > 10000 && (
              <div className="approval-notice">
                ⚠️ Orders over $10,000 require manager approval
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setFormData({
                  customer_id: "",
                  product: "",
                  quantity: 1,
                  price: "",
                  notes: "",
                })
              }
              disabled={loading}
            >
              Clear Form
            </button>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OrderForm;
