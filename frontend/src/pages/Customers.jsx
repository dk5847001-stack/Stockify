import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance.js";
import ConfirmModal from "../components/common/ConfirmModal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import ToastAlert from "../components/common/ToastAlert.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatCurrency, formatDate } from "../utils/formatters.js";

const emptyCustomer = { name: "", mobile: "", email: "", address: "" };

const Customers = () => {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get("/customers", { params: { search, page: pagination.page, limit: pagination.limit } });
      setCustomers(data.customers || []);
      setPagination((current) => ({ ...current, ...(data.pagination || {}) }));
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to load customers." });
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, pagination.page]);

  const submitForm = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.mobile.trim()) {
      setToast({ type: "danger", message: "Customer name and mobile are required." });
      return;
    }

    try {
      if (form._id) await api.put(`/customers/${form._id}`, form);
      else await api.post("/customers", form);
      setToast({ type: "success", message: "Customer saved successfully." });
      setForm(null);
      fetchCustomers();
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to save customer." });
    }
  };

  const deleteCustomer = async () => {
    try {
      await api.delete(`/customers/${deleteTarget._id}`);
      setToast({ type: "success", message: "Customer deleted successfully." });
      setDeleteTarget(null);
      fetchCustomers();
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to delete customer." });
    }
  };

  return (
    <section className="management-page">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
      <ConfirmModal open={Boolean(deleteTarget)} title="Delete customer?" message={`Remove ${deleteTarget?.name || "this customer"}?`} confirmText="Delete" onCancel={() => setDeleteTarget(null)} onConfirm={deleteCustomer} />
      {form ? (
        <div className="modal-backdrop-custom" role="dialog" aria-modal="true">
          <form className="confirm-modal data-modal" onSubmit={submitForm}>
            <h2>{form._id ? "Edit Customer" : "Add Customer"}</h2>
            {["name", "mobile", "email", "address"].map((field) => (
              <input key={field} className="form-control" value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} placeholder={field[0].toUpperCase() + field.slice(1)} />
            ))}
            <div className="confirm-actions">
              <button className="btn btn-outline-secondary" type="button" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn btn-dark" type="submit">Save</button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="module-header">
        <div><p className="eyebrow mb-1">Customers</p><h2>Customer Directory</h2></div>
        {isAdmin ? <button className="btn btn-dark d-inline-flex align-items-center gap-2" type="button" onClick={() => setForm(emptyCustomer)}><Plus size={18} /> Add Customer</button> : null}
      </div>
      <div className="panel">
        <div className="management-toolbar">
          <div className="search-box wide"><Search size={18} /><input value={search} onChange={(event) => { setPagination((current) => ({ ...current, page: 1 })); setSearch(event.target.value); }} placeholder="Search by name, mobile or email" /></div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle management-table">
            <thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Total Purchases</th><th>Total Spent</th><th>Last Purchase</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {customers.length ? customers.map((customer) => (
                <tr key={customer._id}>
                  <td><strong>{customer.name}</strong></td>
                  <td>{customer.mobile}</td>
                  <td>{customer.email || "Not set"}</td>
                  <td>{customer.totalPurchases || 0}</td>
                  <td>{formatCurrency(customer.totalSpent)}</td>
                  <td>{formatDate(customer.lastPurchaseDate)}</td>
                  <td><div className="table-actions justify-content-end">
                    <Link className="icon-btn" to={`/customers/${customer._id}`} aria-label="View customer"><Eye size={16} /></Link>
                    {isAdmin ? <>
                      <button className="icon-btn" type="button" aria-label="Edit customer" onClick={() => setForm(customer)}><Pencil size={16} /></button>
                      <button className="icon-btn danger" type="button" aria-label="Delete customer" onClick={() => setDeleteTarget(customer)}><Trash2 size={16} /></button>
                    </> : null}
                  </div></td>
                </tr>
              )) : <tr><td colSpan="7" className="text-center py-4">No customers found.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />
      </div>
    </section>
  );
};

export default Customers;
