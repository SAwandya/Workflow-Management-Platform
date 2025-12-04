import React from "react";
import "./StatusComponents.css";

function CompletedStatus({ message, description, orderDetails }) {
  return (
    <div className="status-card status-completed">
      <div className="status-icon success">✓</div>

      <h3>{message || "Order Confirmed!"}</h3>
      <p>
        {description ||
          "Your order has been successfully placed and confirmed."}
      </p>

      <div className="success-actions">
        <button
          className="primary"
          onClick={() => (window.location.href = "/orders")}
        >
          View All Orders
        </button>
        <button
          className="secondary"
          onClick={() => (window.location.href = "/")}
        >
          Place Another Order
        </button>
      </div>

      {orderDetails && (
        <div className="order-reference">
          <p>
            Order Reference: <strong>{orderDetails.order_id}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export default CompletedStatus;
