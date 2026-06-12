import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axiosInstance.js";
import ConfirmModal from "../components/common/ConfirmModal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import ToastAlert from "../components/common/ToastAlert.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatCurrency } from "../utils/formatters.js";

const emptySupplier = {
  name: "",
  phone: "",
  email: "",
  companyName: "",
  address: "",
  gstNumber: "",
  totalPurchaseValue: 0,
  suppliedProducts: []
};

const Suppliers = () => {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get("/suppliers", { params: { search, page: pagination.page, limit: pagination.limit } });
      setSuppliers(data.suppliers || []);
      setPagination((current) => ({ ...current, ...(data.pagination || {}) }));
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to load suppliers." });
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search, pagination.page]);

  const showSupplier = async (supplier) => {
    try {
      const { data } = await api.get(`/suppliers/${supplier._id}`);
      setSelectedSupplier(data);
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to load supplier mapping." });
    }
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.companyName.trim()) {
      setToast({ type: "danger", message: "Supplier name, phone and company are required." });
      return;
    }

    try {
      if (form._id) await api.put(`/suppliers/${form._id}`, form);
      else await api.post("/suppliers", form);
      setToast({ type: "success", message: "Supplier saved successfully." });
      setForm(null);
      fetchSuppliers();
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to save supplier." });
    }
  };

  const deleteSupplier = async () => {
    try {
      await api.delete(`/suppliers/${deleteTarget._id}`);
      setToast({ type: "success", message: "Supplier deleted successfully." });
      setDeleteTarget(null);
      fetchSuppliers();
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to delete supplier." });
    }
  };

  return (
    <section className="management-page">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
      <ConfirmModal open={Boolean(deleteTarget)} title="Delete supplier?" message={`Remove ${deleteTarget?.name || "this supplier"}?`} confirmText="Delete" onCancel={() => setDeleteTarget(null)} onConfirm={deleteSupplier} />
      {form ? (
        <div className="modal-backdrop-custom" role="dialog" aria-modal="true">
          <form className="confirm-modal data-modal" onSubmit={submitForm}>
            <h2>{form._id ? "Edit Supplier" : "Add Supplier"}</h2>
            {["name", "phone", "email", "companyName", "gstNumber", "address"].map((field) => (
              <input key={field} className="form-control" value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} placeholder={field === "companyName" ? "Company Name" : field[0].toUpperCase() + field.slice(1)} />
            ))}
            <input className="form-control" type="number" min="0" value={form.totalPurchaseValue || 0} onChange={(event) => setForm((current) => ({ ...current, totalPurchaseValue: Number(event.target.value) }))} placeholder="Total Purchase Value" />
            <div className="confirm-actions">
              <button className="btn btn-outline-secondary" type="button" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn btn-dark" type="submit">Save</button>
            </div>
          </form>
        </div>
      ) : null}

      {selectedSupplier ? (
        <div className="modal-backdrop-custom" role="dialog" aria-modal="true">
          <div className="confirm-modal supplier-map-modal">
            <h2>{selectedSupplier.supplier.name}</h2>
            <p>{selectedSupplier.supplier.companyName} · {selectedSupplier.supplier.phone}</p>
            <div className="detail-list compact">
              <div><span>Total Purchase Value</span><strong>{formatCurrency(selectedSupplier.supplier.totalPurchaseValue)}</strong></div>
              <div><span>Inventory Value</span><strong>{formatCurrency(selectedSupplier.productMapping.inventoryPurchaseValue)}</strong></div>
            </div>
            <div className="table-responsive mt-3">
              <table className="table align-middle management-table">
                <thead><tr><th>Product</th><th>SKU</th><th>Stock</th></tr></thead>
                <tbody>{selectedSupplier.productMapping.productsFromInventory.length ? selectedSupplier.productMapping.productsFromInventory.map((product) => (
                  <tr key={product._id}><td>{product.name}</td><td>{product.sku}</td><td>{product.stock}</td></tr>
                )) : <tr><td colSpan="3" className="text-center py-3">No mapped products found.</td></tr>}</tbody>
              </table>
            </div>
            <div className="confirm-actions"><button className="btn btn-dark" type="button" onClick={() => setSelectedSupplier(null)}>Close</button></div>
          </div>
        </div>
      ) : null}

      <div className="module-header">
        <div><p className="eyebrow mb-1">Suppliers</p><h2>Supplier Network</h2></div>
        {isAdmin ? <button className="btn btn-dark d-inline-flex align-items-center gap-2" type="button" onClick={() => setForm(emptySupplier)}><Plus size={18} /> Add Supplier</button> : null}
      </div>
      <div className="panel">
        <div className="management-toolbar">
          <div className="search-box wide"><Search size={18} /><input value={search} onChange={(event) => { setPagination((current) => ({ ...current, page: 1 })); setSearch(event.target.value); }} placeholder="Search by name, phone, email or company" /></div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle management-table">
            <thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Email</th><th>GST</th><th>Purchase Value</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {suppliers.length ? suppliers.map((supplier) => (
                <tr key={supplier._id}>
                  <td><strong>{supplier.name}</strong></td>
                  <td>{supplier.companyName}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.email || "Not set"}</td>
                  <td>{supplier.gstNumber || "Not set"}</td>
                  <td>{formatCurrency(supplier.totalPurchaseValue)}</td>
                  <td><div className="table-actions justify-content-end">
                    <button className="icon-btn" type="button" aria-label="View supplier" onClick={() => showSupplier(supplier)}><Eye size={16} /></button>
                    {isAdmin ? <>
                      <button className="icon-btn" type="button" aria-label="Edit supplier" onClick={() => setForm(supplier)}><Pencil size={16} /></button>
                      <button className="icon-btn danger" type="button" aria-label="Delete supplier" onClick={() => setDeleteTarget(supplier)}><Trash2 size={16} /></button>
                    </> : null}
                  </div></td>
                </tr>
              )) : <tr><td colSpan="7" className="text-center py-4">No suppliers found.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />
      </div>
    </section>
  );
};

export default Suppliers;
