import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import OrderForm from "./pages/OrderForm";
import OrderStatus from "./pages/OrderStatus";
import MyOrders from "./pages/MyOrders";
import "./App.css";

function Navigation() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>🛒 Customer Portal</h1>
      </div>
      <div className="navbar-menu">
        <Link
          to="/"
          className={`navbar-item ${location.pathname === "/" ? "active" : ""}`}
        >
          New Order
        </Link>
        <Link
          to="/orders"
          className={`navbar-item ${
            location.pathname === "/orders" ? "active" : ""
          }`}
        >
          My Orders
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<OrderForm />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/order/:orderId" element={<OrderStatus />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>© 2025 Customer Portal - Powered by WMC Platform</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
