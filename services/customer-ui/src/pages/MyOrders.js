import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./MyOrders.css";

function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const PRODUCT_SERVICE =
    process.env.REACT_APP_PRODUCT_SERVICE || "http://localhost:3001";
  const TENANT_ID = process.env.REACT_APP_TENANT_ID || "tenant-a";

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${PRODUCT_SERVICE}/api/orders`, {
        headers: { "X-Tenant-ID": TENANT_ID },
      });

      setOrders(response.data.orders || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "status-confirmed";
      case "PENDING":
        return "status-pending";
      case "PROCESSING":
        return "status-processing";
      case "CANCELLED":
        return "status-cancelled";
      default:
        return "status-default";
    }
  };

  if (loading) {
    return (
      <div className="my-orders-page">
        <div className="loading">Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <div className="page-header">
        <h2>My Orders</h2>
        <p>View and track all your orders</p>
      </div>

      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError(null)} className="close-btn">
            ×
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">📦</div>
          <h3>No Orders Yet</h3>
          <p>You haven't placed any orders yet.</p>
          <button className="primary" onClick={() => navigate("/")}>
            Place Your First Order
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.order_id} className="order-card card">
              <div className="order-header">
                <div className="order-id">
                  <span className="label">Order #</span>
                  <span className="value">
                    {order.order_id.substring(0, 20)}...
                  </span>
                </div>
                <span
                  className={`status-badge ${getStatusColor(order.status)}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="order-details">
                <div className="detail">
                  <span className="label">Customer</span>
                  <span className="value">{order.customer_id}</span>
                </div>
                <div className="detail">
                  <span className="label">Total</span>
                  <span className="value">${order.order_value}</span>
                </div>
                <div className="detail">
                  <span className="label">Date</span>
                  <span className="value">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="order-actions">
                <button
                  className="primary"
                  onClick={() => navigate(`/order/${order.order_id}`)}
                >
                  View Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
