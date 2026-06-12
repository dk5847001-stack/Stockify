import { Download, Mail, MapPin, Phone, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axiosInstance.js";
import ToastAlert from "../components/common/ToastAlert.jsx";
import { formatCurrency, formatDate } from "../utils/formatters.js";

const Invoice = () => {
  const { invoiceNo } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [toast, setToast] = useState(null);
  const invoiceRef = useRef(null);

  useEffect(() => {
    api.get(`/bills/invoice/${invoiceNo}`)
      .then(({ data }) => setInvoice(data.invoice))
      .catch((error) => setToast({ type: "danger", message: error.response?.data?.message || "Unable to load invoice." }));
  }, [invoiceNo]);

  const printInvoice = () => {
    invoiceRef.current?.scrollIntoView({ block: "start" });
    setTimeout(() => window.print(), 100);
  };

  const downloadPdf = () => {
    setToast({ type: "info", message: "Choose Save as PDF in the print dialog to download this invoice." });
    setTimeout(printInvoice, 300);
  };

  if (!invoice) {
    return <section className="panel"><ToastAlert toast={toast} onClose={() => setToast(null)} />Loading invoice...</section>;
  }

  const itemCount = invoice.items.length;
  const densityClass =
    itemCount > 18 ? "invoice-density-ultra" : itemCount > 10 ? "invoice-density-compact" : "";

  return (
    <section className="invoice-page">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
      <div className="module-header no-print">
        <div>
          <p className="eyebrow mb-1">Invoice</p>
          <h2>{invoice.invoiceNo}</h2>
        </div>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary" to="/billing">New Bill</Link>
          <button className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" type="button" onClick={printInvoice}>
            <Printer size={16} /> Print
          </button>
          <button className="btn btn-dark d-inline-flex align-items-center gap-2" type="button" onClick={downloadPdf}>
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      <article className={`invoice-paper premium-invoice ${densityClass}`} ref={invoiceRef}>
        <header className="invoice-head">
          <div className="shop-brand">
            <div className="brand-mark">S</div>
            <div>
              <h1>Stockify Retail</h1>
              <p>Smart Retail Billing and Inventory Management</p>
              <div className="shop-contact">
                <span><Phone size={13} /> +91 96086 96045</span>
                <span><Mail size={13} /> billing@stockify.local</span>
                <span><MapPin size={13} /> Main Market, India</span>
              </div>
            </div>
          </div>
          <div className="invoice-meta">
            <span className="invoice-label">Tax Invoice</span>
            <strong>{invoice.invoiceNo}</strong>
            <span>Issued: {formatDate(invoice.createdAt)}</span>
          </div>
        </header>

        <section className="invoice-status-row">
          <div>
            <span>Payment Mode</span>
            <strong>{invoice.paymentMode}</strong>
          </div>
          <div>
            <span>Payment Status</span>
            <strong>{invoice.paymentStatus}</strong>
          </div>
          <div>
            <span>Grand Total</span>
            <strong>{formatCurrency(invoice.grandTotal)}</strong>
          </div>
        </section>

        <section className="invoice-customer">
          <div>
            <span>Billed To</span>
            <strong>{invoice.customer?.name || "Walk-in Customer"}</strong>
            <p>{invoice.customer?.phone || "No phone"}<br />{invoice.customer?.email || ""}<br />{invoice.customer?.address || ""}</p>
          </div>
          <div>
            <span>Cashier</span>
            <strong>{invoice.cashier?.name || "Stockify User"}</strong>
            <p>{invoice.cashier?.email || ""}</p>
          </div>
        </section>

        <div className="table-responsive">
          <table className="table invoice-table">
            <thead>
              <tr><th>#</th><th>Item</th><th>SKU</th><th>Qty</th><th>Price</th><th>Discount</th><th>Tax</th><th>Total</th></tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={`${item.productId}-${item.sku}`}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatCurrency(item.discount)}</td>
                  <td>{formatCurrency(item.tax)}</td>
                  <td>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="invoice-total-row">
          <div className="invoice-note">
            <strong>Thank you for shopping with Stockify Retail.</strong>
            <span>Goods once sold are subject to store return policy.</span>
            <div className="invoice-signature">
              <span>Authorized Signature</span>
            </div>
          </div>
          <div className="totals-card invoice-totals">
            <div><span>Subtotal</span><strong>{formatCurrency(invoice.subtotal)}</strong></div>
            <div><span>Discount</span><strong>{formatCurrency(invoice.discountAmount)}</strong></div>
            <div><span>Tax</span><strong>{formatCurrency(invoice.taxAmount)}</strong></div>
            <div className="grand"><span>Grand Total</span><strong>{formatCurrency(invoice.grandTotal)}</strong></div>
          </div>
        </footer>

        <div className="invoice-footer-strip">
          <span>Powered by Stockify</span>
          <span>This is a computer generated invoice.</span>
        </div>
      </article>
    </section>
  );
};

export default Invoice;
