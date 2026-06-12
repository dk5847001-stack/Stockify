import { CalendarDays, CreditCard, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from "recharts";
import api from "../api/axiosInstance.js";
import StatCard from "../components/common/StatCard.jsx";
import ToastAlert from "../components/common/ToastAlert.jsx";
import { formatCurrency, formatDate } from "../utils/formatters.js";

const colors = ["#0f766e", "#2563eb", "#d97706", "#7c3aed"];

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [bills, setBills] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", paymentMode: "" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/summary"),
      api.get("/dashboard/sales-chart"),
      api.get("/dashboard/top-products", { params: { limit: 8 } }),
      api.get("/bills", { params: { limit: 100 } })
    ])
      .then(([summaryRes, chartRes, topRes, billsRes]) => {
        setSummary(summaryRes.data);
        setSalesChart(chartRes.data.chartData || []);
        setTopProducts(topRes.data.products || []);
        setBills(billsRes.data.bills || []);
      })
      .catch((error) => setToast({ type: "danger", message: error.response?.data?.message || "Unable to load reports." }));
  }, []);

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const billDate = new Date(bill.createdAt);
      const fromOk = filters.from ? billDate >= new Date(filters.from) : true;
      const toOk = filters.to ? billDate <= new Date(`${filters.to}T23:59:59`) : true;
      const paymentOk = filters.paymentMode ? bill.paymentMode === filters.paymentMode : true;
      return fromOk && toOk && paymentOk;
    });
  }, [bills, filters]);

  const reportTotals = useMemo(() => {
    return filteredBills.reduce(
      (total, bill) => ({
        sales: total.sales + bill.grandTotal,
        invoices: total.invoices + 1
      }),
      { sales: 0, invoices: 0 }
    );
  }, [filteredBills]);

  const paymentData = summary?.paymentModeWiseSales || [];

  return (
    <section className="management-page reports-page">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
      <div className="module-header">
        <div>
          <p className="eyebrow mb-1">Reports</p>
          <h2>Sales and Performance</h2>
        </div>
      </div>

      <div className="report-filter panel">
        <label>From<input className="form-control" type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
        <label>To<input className="form-control" type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
        <label>Payment Mode
          <select className="form-select" value={filters.paymentMode} onChange={(event) => setFilters((current) => ({ ...current, paymentMode: event.target.value }))}>
            <option value="">All</option>
            {["Cash", "UPI", "Card", "Credit"].map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </label>
      </div>

      <section className="row g-3">
        <div className="col-12 col-md-4"><StatCard title="Daily Sales" value={formatCurrency(summary?.summary?.todaySales || 0)} delta="Today's billed revenue" icon={CalendarDays} tone="green" /></div>
        <div className="col-12 col-md-4"><StatCard title="Monthly Sales" value={formatCurrency(summary?.summary?.monthlyRevenue || 0)} delta={`${summary?.summary?.totalInvoices || 0} total invoices`} icon={TrendingUp} tone="blue" /></div>
        <div className="col-12 col-md-4"><StatCard title="Filtered Sales" value={formatCurrency(reportTotals.sales)} delta={`${reportTotals.invoices} invoices in range`} icon={CreditCard} tone="violet" /></div>
      </section>

      <section className="report-grid">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow mb-1">Monthly Chart</p><h2>Revenue and Profit</h2></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={3} />
                <Line type="monotone" dataKey="profit" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow mb-1">Payment Modes</p><h2>Mode-wise Sales</h2></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentData} dataKey="sales" nameKey="paymentMode" outerRadius={110} label>
                  {paymentData.map((entry, index) => <Cell key={entry.paymentMode} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="report-grid">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow mb-1">Top Products</p><h2>Best Sellers</h2></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantitySold" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow mb-1">Filtered Bills</p><h2>Date Range Results</h2></div></div>
          <div className="table-responsive">
            <table className="table align-middle management-table">
              <thead><tr><th>Invoice</th><th>Customer</th><th>Payment</th><th>Total</th><th>Date</th></tr></thead>
              <tbody>
                {filteredBills.slice(0, 8).map((bill) => (
                  <tr key={bill._id}>
                    <td>{bill.invoiceNo}</td>
                    <td>{bill.customer?.name || "Walk-in"}</td>
                    <td>{bill.paymentMode}</td>
                    <td>{formatCurrency(bill.grandTotal)}</td>
                    <td>{formatDate(bill.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </section>
  );
};

export default Reports;
