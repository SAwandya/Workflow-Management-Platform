import React, { useState, useEffect } from "react";
import { serviceCatalogService } from "../../api/service.api";
import "./ServiceSelector.css";

function ServiceSelector({ onSelect, onClose }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadServices();
  }, []);

  useEffect(() => {
    loadServices();
  }, [selectedCategory, searchTerm]);

  const loadCategories = async () => {
    try {
      const data = await serviceCatalogService.getCategories();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await serviceCatalogService.listServices(
        selectedCategory || null,
        searchTerm || null
      );
      setServices(data.services || []);
    } catch (err) {
      console.error("Failed to load services:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (service) => {
    onSelect(service);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      product_api: "📦",
      external_api: "🔌",
      notification: "📧",
      custom_service: "⚙️",
    };
    return icons[category] || "📝";
  };

  return (
    <div className="service-selector-overlay">
      <div className="service-selector-modal">
        <div className="modal-header">
          <h3>Select Service</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-filters">
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <div className="category-tabs">
            <button
              className={`category-tab ${!selectedCategory ? "active" : ""}`}
              onClick={() => setSelectedCategory("")}
            >
              All ({services.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category}
                className={`category-tab ${
                  selectedCategory === cat.category ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(cat.category)}
              >
                {getCategoryIcon(cat.category)} {cat.category.replace("_", " ")}{" "}
                ({cat.service_count})
              </button>
            ))}
          </div>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="empty-state">
              <p>No services found</p>
            </div>
          ) : (
            <div className="services-grid">
              {services.map((service) => (
                <div
                  key={service.service_id}
                  className="service-card"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="service-icon">
                    {getCategoryIcon(service.category)}
                  </div>
                  <div className="service-content">
                    <h4>{service.name}</h4>
                    <p>{service.description}</p>
                    <span className="service-category-badge">
                      {service.category.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceSelector;
