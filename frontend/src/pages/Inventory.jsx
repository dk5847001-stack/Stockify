import { PackagePlus, Search, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance.js";
import StockBadge from "../components/common/StockBadge.jsx";
import ToastAlert from "../components/common/ToastAlert.jsx";
import { formatCurrency } from "../utils/formatters.js";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [stockForm, setStockForm] = useState({ product: null, type: "increase", quantity: "", note: "" });

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products", { params: { search: query, limit: 50 } });
      setProducts(data.products || []);
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to load inventory." });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [query]);

  const handleStockSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.patch(`/products/${stockForm.product._id}/stock`, {
        type: stockForm.type,
        quantity: Number(stockForm.quantity),
        note: stockForm.note
      });
      setToast({ type: "success", message: "Stock updated successfully." });
      setStockForm({ product: null, type: "increase", quantity: "", note: "" });
      fetchProducts();
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to update stock." });
    }
  };

  return (
    <section className="management-page">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
      {stockForm.product ? (
        <div className="modal-backdrop-custom" role="dialog" aria-modal="true">
          <form className="confirm-modal stock-modal" onSubmit={handleStockSubmit}>
            <h2>Update Stock</h2>
            <p>{stockForm.product.name}</p>
            <select className="form-select" value={stockForm.type} onChange={(event) => setStockForm((current) => ({ ...current, type: event.target.value }))}>
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
              <option value="adjustment">Adjustment</option>
            </select>
            <input className="form-control" type="number" min="0" value={stockForm.quantity} onChange={(event) => setStockForm((current) => ({ ...current, quantity: event.target.value }))} placeholder="Quantity" required />
            <input className="form-control" value={stockForm.note} onChange={(event) => setStockForm((current) => ({ ...current, note: event.target.value }))} placeholder="Note" />
            <div className="confirm-actions">
              <button className="btn btn-outline-secondary" type="button" onClick={() => setStockForm({ product: null, type: "increase", quantity: "", note: "" })}>Cancel</button>
              <button className="btn btn-dark" type="submit">Save</button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="module-header">
        <div>
          <p className="eyebrow mb-1">Inventory</p>
          <h2>Product Stock</h2>
        </div>
        <Link className="btn btn-dark d-inline-flex align-items-center gap-2" to="/products/add">
          <PackagePlus size={18} />
          Add Product
        </Link>
      </div>

      <div className="panel">
        <div className="management-toolbar">
          <div className="search-box wide">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inventory" />
          </div>
          <Link className="btn btn-outline-secondary" to="/low-stock">Low Stock</Link>
        </div>
        <div className="table-responsive">
          <table className="table align-middle management-table">
            <thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th><th className="text-end">Manage</th></tr></thead>
            <tbody>
              {products.length ? products.map((product) => (
                <tr key={product._id}>
                  <td><Link to={`/products/${product._id}`}>{product.name}</Link></td>
                  <td>{product.sku}</td>
                  <td>{formatCurrency(product.sellingPrice)}</td>
                  <td>{product.stock} {product.unit}</td>
                  <td><StockBadge product={product} /></td>
                  <td>
                    <div className="table-actions justify-content-end">
                      <button className="icon-btn" type="button" aria-label="Increase stock" onClick={() => setStockForm({ product, type: "increase", quantity: "", note: "" })}><TrendingUp size={16} /></button>
                      <button className="icon-btn" type="button" aria-label="Decrease stock" onClick={() => setStockForm({ product, type: "decrease", quantity: "", note: "" })}><TrendingDown size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="text-center py-4">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Inventory;
