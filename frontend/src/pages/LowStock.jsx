import { AlertTriangle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance.js";
import StockBadge from "../components/common/StockBadge.jsx";
import ToastAlert from "../components/common/ToastAlert.jsx";

const LowStock = () => {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.get("/products/low-stock")
      .then(({ data }) => setProducts(data.products || []))
      .catch((error) => setToast({ type: "danger", message: error.response?.data?.message || "Unable to load stock alerts." }));
  }, []);

  const visibleProducts = useMemo(() => {
    const text = query.toLowerCase();
    return products.filter((product) =>
      [product.name, product.sku, product.category].some((value) => String(value || "").toLowerCase().includes(text))
    );
  }, [products, query]);

  return (
    <section className="management-page">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
      <div className="module-header">
        <div>
          <p className="eyebrow mb-1">Stock Alerts</p>
          <h2>Low Stock Products</h2>
        </div>
        <div className="alert-pill"><AlertTriangle size={18} /> {visibleProducts.length} alerts</div>
      </div>
      <div className="panel">
        <div className="management-toolbar">
          <div className="search-box wide">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search low stock products" />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle management-table">
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Limit</th><th>Status</th></tr></thead>
            <tbody>
              {visibleProducts.length ? visibleProducts.map((product) => (
                <tr key={product._id}>
                  <td><Link to={`/products/${product._id}`}>{product.name}</Link></td>
                  <td>{product.sku}</td>
                  <td>{product.category}</td>
                  <td>{product.stock} {product.unit}</td>
                  <td>{product.lowStockLimit}</td>
                  <td><StockBadge product={product} /></td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="text-center py-4">No low stock products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default LowStock;
