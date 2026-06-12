import {
  AlertTriangle,
  Ban,
  BarChart3,
  Boxes,
  CheckCircle2,
  Crown,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Store,
  UsersRound
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosInstance.js";
import Pagination from "../components/common/Pagination.jsx";
import StatCard from "../components/common/StatCard.jsx";
import ToastAlert from "../components/common/ToastAlert.jsx";
import { formatCurrency } from "../utils/formatters.js";

const AdminPanel = () => {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState({ lowStockProducts: [], outOfStockProducts: [], counts: {} });
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, limit: 8, total: 0 });
  const [userSearch, setUserSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [summaryRes, alertsRes, usersRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/stock-alerts"),
        api.get("/admin/users", { params: { search: userSearch, page: pagination.page, limit: pagination.limit } })
      ]);

      setSummary(summaryRes.data);
      setAlerts(alertsRes.data);
      setUsers(usersRes.data.users || []);
      setPagination((current) => ({ ...current, ...(usersRes.data.pagination || {}) }));
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to load admin panel." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [userSearch, pagination.page]);

  const toggleBlock = async (user) => {
    try {
      const { data } = await api.put(`/admin/users/${user.id}/block`, { isBlocked: !user.isBlocked });
      setToast({ type: "success", message: data.message });
      loadAdminData();
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to update user status." });
    }
  };

  const updateRole = async (user, role) => {
    try {
      await api.put(`/admin/users/${user.id}/role`, { role });
      setToast({ type: "success", message: "User role updated successfully." });
      loadAdminData();
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to update user role." });
    }
  };

  const stats = summary?.summary || {};

  return (
    <section className="management-page admin-panel-page">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
      <div className="module-header">
        <div>
          <p className="eyebrow mb-1">Admin Control Center</p>
          <h2>Smart Admin Panel</h2>
        </div>
        <button className="btn btn-dark d-inline-flex align-items-center gap-2" type="button" onClick={loadAdminData}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <section className="admin-hero panel">
        <div>
          <span className="admin-chip"><Crown size={16} /> Owner Workspace</span>
          <h3>Control products, stock, billing, users, customers, suppliers and reports from one place.</h3>
        </div>
        <div className="admin-health">
          <div><span>API</span><strong>Connected</strong></div>
          <div><span>Mode</span><strong>Admin</strong></div>
        </div>
      </section>

      <section className="row g-3">
        <div className="col-12 col-md-6 col-xl-3"><StatCard title="Products" value={stats.totalProducts || 0} delta="Catalogue control" icon={Boxes} tone="blue" /></div>
        <div className="col-12 col-md-6 col-xl-3"><StatCard title="Customers" value={stats.totalCustomers || 0} delta="Retail audience" icon={UsersRound} tone="green" /></div>
        <div className="col-12 col-md-6 col-xl-3"><StatCard title="Invoices" value={stats.totalInvoices || 0} delta="Billing records" icon={ReceiptText} tone="violet" /></div>
        <div className="col-12 col-md-6 col-xl-3"><StatCard title="Revenue" value={formatCurrency(stats.monthlyRevenue || 0)} delta="This month" icon={BarChart3} tone="amber" /></div>
      </section>

      <section className="admin-control-grid">
        {[
          { title: "Product Control", text: "Add, edit, delete and review catalogue.", to: "/products", icon: Boxes },
          { title: "Inventory Control", text: "Increase, decrease and audit stock.", to: "/inventory", icon: Store },
          { title: "Billing Desk", text: "Create bills and printable invoices.", to: "/billing", icon: ReceiptText },
          { title: "Reports", text: "Track sales, profit and top products.", to: "/reports", icon: BarChart3 },
          { title: "Customers", text: "Manage buyer records and history.", to: "/customers", icon: UsersRound },
          { title: "Suppliers", text: "Manage vendor network and mapping.", to: "/suppliers", icon: ShieldCheck }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link className="admin-control-card" to={item.to} key={item.title}>
              <Icon size={22} />
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </Link>
          );
        })}
      </section>

      <section className="admin-split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow mb-1">Stock Risk</p>
              <h2>Alerts</h2>
            </div>
            <Link className="btn btn-outline-secondary" to="/low-stock">View All</Link>
          </div>
          <div className="admin-alert-list">
            {[...(alerts.outOfStockProducts || []), ...(alerts.lowStockProducts || [])].slice(0, 8).map((product) => (
              <Link className="admin-alert-item" to={`/products/${product._id}`} key={product._id}>
                <AlertTriangle size={17} />
                <span>
                  <strong>{product.name}</strong>
                  <small>{product.stock === 0 ? "Out of stock" : `${product.stock} ${product.unit} left`}</small>
                </span>
              </Link>
            ))}
            {!loading && !(alerts.outOfStockProducts?.length || alerts.lowStockProducts?.length) ? (
              <div className="admin-empty-state"><CheckCircle2 size={22} /> No active stock alerts.</div>
            ) : null}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow mb-1">Users</p>
              <h2>Access Control</h2>
            </div>
          </div>
          <div className="management-toolbar admin-user-toolbar">
            <div className="search-box wide">
              <input
                value={userSearch}
                onChange={(event) => {
                  setPagination((current) => ({ ...current, page: 1 }));
                  setUserSearch(event.target.value);
                }}
                placeholder="Search users by name, email or phone"
              />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table align-middle management-table admin-users-table">
              <thead><tr><th>User</th><th>Role</th><th>Status</th><th className="text-end">Control</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name}</strong><span className="d-block text-secondary">{user.email}</span></td>
                    <td>
                      <select className="form-select mini-select" value={user.role} onChange={(event) => updateRole(user, event.target.value)}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td><span className={`stock-badge ${user.isBlocked ? "stock-out" : "stock-healthy"}`}>{user.isBlocked ? "Blocked" : "Active"}</span></td>
                    <td className="text-end">
                      <button className={`btn btn-sm ${user.isBlocked ? "btn-outline-success" : "btn-outline-danger"} d-inline-flex align-items-center gap-2`} type="button" onClick={() => toggleBlock(user)}>
                        <Ban size={15} />
                        {user.isBlocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!users.length ? <tr><td colSpan="4" className="text-center py-4">No users found.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />
        </article>
      </section>
    </section>
  );
};

export default AdminPanel;
