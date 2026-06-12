import { Eye, PackagePlus, Pencil, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance.js";
import ConfirmModal from "../components/common/ConfirmModal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import StockBadge from "../components/common/StockBadge.jsx";
import ToastAlert from "../components/common/ToastAlert.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatCurrency } from "../utils/formatters.js";

const ProductsList = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [filters, setFilters] = useState({ search: "", category: "", stockStatus: "", isActive: "" });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""))
    }),
    [filters, pagination.page, pagination.limit]
  );

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", { params: queryParams });
      setProducts(data.products || []);
      setPagination((current) => ({ ...current, ...(data.pagination || {}) }));
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to load products." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [queryParams]);

  const handleFilterChange = (event) => {
    setPagination((current) => ({ ...current, page: 1 }));
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteTarget._id}`);
      setToast({ type: "success", message: "Product deleted successfully." });
      setDeleteTarget(null);
      fetchProducts();
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to delete product." });
    }
  };

  return (
    <section className="management-page">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete product?"
        message={`This will permanently remove ${deleteTarget?.name || "this product"}.`}
        confirmText="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <div className="module-header">
        <div>
          <p className="eyebrow mb-1">Products</p>
          <h2>Product Catalogue</h2>
        </div>
        {isAdmin ? (
          <Link className="btn btn-dark d-inline-flex align-items-center gap-2" to="/products/add">
            <PackagePlus size={18} />
            Add Product
          </Link>
        ) : null}
      </div>

      <div className="panel">
        <div className="management-toolbar">
          <div className="search-box wide">
            <Search size={18} />
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, SKU or barcode"
            />
          </div>
          <input
            className="form-control"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            placeholder="Category"
          />
          <select className="form-select" name="stockStatus" value={filters.stockStatus} onChange={handleFilterChange}>
            <option value="">All stock</option>
            <option value="available">Available</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
          <select className="form-select" name="isActive" value={filters.isActive} onChange={handleFilterChange}>
            <option value="">All status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="table-responsive">
          <table className="table align-middle management-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-4">Loading products...</td></tr>
              ) : products.length ? (
                products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-cell">
                        <img src={product.image || "https://placehold.co/80x80?text=S"} alt={product.name} />
                        <div>
                          <strong>{product.name}</strong>
                          <span>{product.brand || "No brand"}</span>
                        </div>
                      </div>
                    </td>
                    <td>{product.sku}</td>
                    <td>{product.category}</td>
                    <td>{formatCurrency(product.sellingPrice)}</td>
                    <td>{product.stock} {product.unit}</td>
                    <td><StockBadge product={product} /></td>
                    <td>
                      <div className="table-actions justify-content-end">
                        <Link className="icon-btn" to={`/products/${product._id}`} aria-label="View product"><Eye size={16} /></Link>
                        {isAdmin ? (
                          <>
                            <Link className="icon-btn" to={`/products/${product._id}/edit`} aria-label="Edit product"><Pencil size={16} /></Link>
                            <button className="icon-btn danger" type="button" aria-label="Delete product" onClick={() => setDeleteTarget(product)}>
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="text-center py-4">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />
      </div>
    </section>
  );
};

export default ProductsList;
