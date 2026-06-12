import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axiosInstance.js";
import ToastAlert from "../components/common/ToastAlert.jsx";
import { formatCurrency, formatDate } from "../utils/formatters.js";

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.get(`/customers/${id}`)
      .then(({ data }) => {
        setCustomer(data.customer);
        setHistory(data.purchaseHistory || []);
      })
      .catch((error) => setToast({ type: "danger", message: error.response?.data?.message || "Unable to load customer." }));
  }, [id]);

  if (!customer) return <section className="panel"><ToastAlert toast={toast} onClose={() => setToast(null)} />Loading customer...</section>;

  return (
    <section className="management-page">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
      <div className="module-header">
        <div><p className="eyebrow mb-1">Customer Details</p><h2>{customer.name}</h2></div>
        <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" to="/customers"><ArrowLeft size={16} /> Back</Link>
      </div>
      <div className="details-grid">
        <article className="panel detail-list">
          {[["Mobile", customer.mobile], ["Email", customer.email || "Not set"], ["Address", customer.address || "Not set"], ["Total Purchases", customer.totalPurchases || 0], ["Total Spent", formatCurrency(customer.totalSpent)], ["Last Purchase", formatDate(customer.lastPurchaseDate)]].map(([label, value]) => (
            <div key={label}><span>{label}</span><strong>{value}</strong></div>
          ))}
        </article>
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow mb-1">Purchase History</p><h2>Recent Bills</h2></div></div>
          <div className="table-responsive">
            <table className="table align-middle management-table">
              <thead><tr><th>Invoice</th><th>Amount</th><th>Payment</th><th>Date</th></tr></thead>
              <tbody>{history.length ? history.map((bill) => (
                <tr key={bill._id}><td>{bill.invoiceNo}</td><td>{formatCurrency(bill.grandTotal)}</td><td>{bill.paymentMode}</td><td>{formatDate(bill.createdAt)}</td></tr>
              )) : <tr><td colSpan="4" className="text-center py-4">No purchase history found.</td></tr>}</tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
};

export default CustomerDetails;
