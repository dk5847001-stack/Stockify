import { ArrowLeft, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axiosInstance.js";
import StockBadge from "../components/common/StockBadge.jsx";
import ToastAlert from "../components/common/ToastAlert.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatCurrency, formatDate } from "../utils/formatters.js";

const ProductDetails = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [product, setProduct] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data.product))
      .catch((error) => setToast({ type: "danger", message: error.response?.data?.message || "Unable to load product." }));
  }, [id]);

  if (!product) {
    return (
      <section className="panel">
        <ToastAlert toast={toast} onClose={() => setToast(null)} />
        Loading product details...
      </section>
    );
  }

  return (
    <section className="management-page">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
      <div className="module-header">
        <div>
          <p className="eyebrow mb-1">Product Details</p>
          <h2>{product.name}</h2>
        </div>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" to="/products">
            <ArrowLeft size={16} /> Back
          </Link>
          {isAdmin ? (
            <Link className="btn btn-dark d-inline-flex align-items-center gap-2" to={`/products/${product._id}/edit`}>
              <Pencil size={16} /> Edit
            </Link>
          ) : null}
        </div>
      </div>

      <div className="details-grid">
        <article className="panel product-detail-hero">
          <img src={product.image || "https://placehold.co/420x320?text=Stockify"} alt={product.name} />
          <div>
            <StockBadge product={product} />
            <h3>{product.name}</h3>
            <p>{product.brand || "No brand"} - {product.category}</p>
            <strong>{formatCurrency(product.sellingPrice)}</strong>
          </div>
        </article>
        <article className="panel detail-list">
          {[
            ["SKU", product.sku],
            ["Barcode", product.barcode || "Not set"],
            ["Purchase Price", formatCurrency(product.purchasePrice)],
            ["MRP", formatCurrency(product.mrp)],
            ["Stock", `${product.stock} ${product.unit}`],
            ["Low Stock Limit", product.lowStockLimit],
            ["Supplier", product.supplierName || "Not set"],
            ["Expiry", formatDate(product.expiryDate)],
            ["Created By", product.createdBy?.name || "System"]
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
};

export default ProductDetails;
