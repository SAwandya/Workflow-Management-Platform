import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ProcessingStatus from "../components/status/ProcessingStatus";
import WaitingStatus from "../components/status/WaitingStatus";
import CompletedStatus from "../components/status/CompletedStatus";
import FailedStatus from "../components/status/FailedStatus";
import "./OrderStatus.css";

function OrderStatus() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [workflowInstance, setWorkflowInstance] = useState(null);
  const [workflowState, setWorkflowState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(true);

  const PRODUCT_SERVICE =
    process.env.REACT_APP_PRODUCT_SERVICE || "http://localhost:3001";
  const API_GATEWAY =
    process.env.REACT_APP_API_GATEWAY || "http://localhost:3000";
  const TENANT_ID = process.env.REACT_APP_TENANT_ID || "tenant-a";

  useEffect(() => {
    fetchOrderStatus();
  }, [orderId]);

  // Polling effect
  useEffect(() => {
    if (!polling || !workflowInstance) return;

    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [polling, workflowInstance]);

  const fetchOrderStatus = async () => {
    try {
      // Fetch order details
      const orderResponse = await axios.get(
        `${PRODUCT_SERVICE}/api/orders/${orderId}`,
        {
          headers: { "X-Tenant-ID": TENANT_ID },
        }
      );

      setOrder(orderResponse.data.order);

      // Try to fetch workflow instance
      // We need to get the instance ID somehow - for now, we'll get it from the order response
      // In a real system, the order would store the workflow_instance_id

      // For now, we'll make a simplification: check if workflow is in terminal state
      const orderStatus = orderResponse.data.order.status;

      if (orderStatus === "CONFIRMED") {
        setWorkflowInstance({ status: "COMPLETED" });
        setPolling(false);
      } else if (orderStatus === "PENDING") {
        setWorkflowInstance({ status: "WAITING" });
      } else if (orderStatus === "PROCESSING") {
        setWorkflowInstance({ status: "RUNNING" });
      }

      setError(null);
    } catch (err) {
      console.error("Failed to fetch order status:", err);
      setError("Failed to load order status");
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = () => {
    if (!workflowInstance) {
      return (
        <ProcessingStatus
          message="Processing your order..."
          showSpinner={true}
        />
      );
    }

    switch (workflowInstance.status) {
      case "RUNNING":
      case "PROCESSING":
        return (
          <ProcessingStatus
            message="Processing your order..."
            showSpinner={true}
          />
        );

      case "WAITING":
        return (
          <WaitingStatus
            message="Your order is under review"
            description="Our team is reviewing your order. You will be notified once it's approved."
            estimatedTime="24 hours"
          />
        );

      case "COMPLETED":
        return (
          <CompletedStatus
            message="Order Confirmed!"
            description="Your order has been successfully placed and confirmed."
            orderDetails={order}
          />
        );

      case "FAILED":
        return (
          <FailedStatus
            message="Order Failed"
            description="There was an issue processing your order. Please contact support."
          />
        );

      default:
        return (
          <ProcessingStatus
            message="Processing your order..."
            showSpinner={true}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="order-status-page">
        <div className="loading">Loading order status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-status-page">
        <div className="error-container">
          <div className="error">{error}</div>
          <button onClick={() => navigate("/orders")} className="secondary">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-status-page">
      <div className="page-header">
        <button onClick={() => navigate("/orders")} className="back-button">
          ← Back to Orders
        </button>
        <h2>Order Status</h2>
        <p>Track your order in real-time</p>
      </div>

      {order && (
        <div className="order-info-card card">
          <h3>Order Details</h3>
          <div className="order-details-grid">
            <div className="detail-item">
              <span className="detail-label">Order ID</span>
              <span className="detail-value">{order.order_id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Customer</span>
              <span className="detail-value">{order.customer_id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Amount</span>
              <span className="detail-value">${order.order_value}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Order Date</span>
              <span className="detail-value">
                {new Date(order.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="order-items">
              <h4>Items</h4>
              {order.items.map((item, index) => (
                <div key={index} className="item-row">
                  <span>{item.product}</span>
                  <span>Qty: {item.quantity}</span>
                  <span>${item.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="status-container">{renderStatus()}</div>

      {polling && workflowInstance?.status !== "COMPLETED" && (
        <div className="polling-indicator">
          <span className="polling-dot"></span>
          Auto-refreshing every 5 seconds
        </div>
      )}
    </div>
  );
}

export default OrderStatus;
