import { Minus, Plus, ReceiptText, Search, Trash2, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance.js";
import ToastAlert from "../components/common/ToastAlert.jsx";
import { formatCurrency } from "../utils/formatters.js";

const emptyCustomer = { name: "", mobile: "", email: "", address: "" };

const Billing = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState(emptyCustomer);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/customers", { params: { limit: 100 } })
      .then(({ data }) => setCustomers(data.customers || []))
      .catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      api.get("/products", { params: { search, isActive: true, limit: 12 } })
        .then(({ data }) => setProducts(data.products || []))
        .catch((error) => setToast({ type: "danger", message: error.response?.data?.message || "Unable to search products." }));
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const totals = useMemo(() => {
    return cart.reduce(
      (summary, item) => {
        const subtotal = item.quantity * item.price;
        const discount = Number(item.discount) || 0;
        const tax = Number(item.tax) || 0;
        return {
          subtotal: summary.subtotal + subtotal,
          discountAmount: summary.discountAmount + discount,
          taxAmount: summary.taxAmount + tax,
          grandTotal: summary.grandTotal + Math.max(subtotal - discount, 0) + tax
        };
      },
      { subtotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0 }
    );
  }, [cart]);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      setToast({ type: "danger", message: "This product is out of stock." });
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.productId === product._id);
      if (existing) {
        return current.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }

      return [
        ...current,
        {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          stock: product.stock,
          quantity: 1,
          price: product.sellingPrice,
          discount: 0,
          tax: 0
        }
      ];
    });
  };

  const updateCart = (productId, field, value) => {
    setCart((current) =>
      current.map((item) => {
        if (item.productId !== productId) return item;
        const nextValue = Number(value);
        if (field === "quantity") {
          return { ...item, quantity: Math.min(Math.max(nextValue || 1, 1), item.stock) };
        }
        return { ...item, [field]: Math.max(nextValue || 0, 0) };
      })
    );
  };

  const createCustomerIfNeeded = async () => {
    if (!showCustomerForm) {
      return customers.find((customer) => customer._id === selectedCustomerId) || null;
    }

    if (!newCustomer.name.trim() || !newCustomer.mobile.trim()) {
      throw new Error("Customer name and mobile are required.");
    }

    const { data } = await api.post("/customers", newCustomer);
    return data.customer;
  };

  const generateBill = async () => {
    if (!cart.length) {
      setToast({ type: "danger", message: "Add at least one product to cart." });
      return;
    }

    setSubmitting(true);
    try {
      const customer = await createCustomerIfNeeded();
      const { data } = await api.post("/bills", {
        customer: customer
          ? {
              name: customer.name,
              phone: customer.mobile,
              email: customer.email,
              address: customer.address
            }
          : { name: "Walk-in Customer" },
        paymentMode,
        paymentStatus: paymentMode === "Credit" ? "Pending" : "Paid",
        items: cart.map(({ productId, quantity, price, discount, tax }) => ({
          productId,
          quantity,
          price,
          discount,
          tax
        }))
      });
      setToast({ type: "success", message: "Bill generated successfully." });
      navigate(`/invoice/${data.bill.invoiceNo}`);
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || error.message || "Unable to generate bill." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="billing-page">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
      <div className="module-header">
        <div>
          <p className="eyebrow mb-1">Smart Billing</p>
          <h2>Create Retail Invoice</h2>
        </div>
        <button className="btn btn-dark d-inline-flex align-items-center gap-2" type="button" onClick={generateBill} disabled={submitting}>
          <ReceiptText size={18} />
          {submitting ? "Generating..." : "Generate Bill"}
        </button>
      </div>

      <div className="billing-grid">
        <div className="panel">
          <div className="search-box wide mb-3">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product by name, SKU or barcode" />
          </div>
          <div className="product-pick-grid">
            {products.map((product) => (
              <button className="product-pick" type="button" key={product._id} onClick={() => addToCart(product)}>
                <strong>{product.name}</strong>
                <span>{product.sku} - Stock {product.stock}</span>
                <b>{formatCurrency(product.sellingPrice)}</b>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow mb-1">Customer</p>
              <h2>Buyer Details</h2>
            </div>
            <button className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" type="button" onClick={() => setShowCustomerForm((value) => !value)}>
              <UserPlus size={16} />
              {showCustomerForm ? "Select Existing" : "Add New"}
            </button>
          </div>
          {showCustomerForm ? (
            <div className="form-grid compact-grid">
              {["name", "mobile", "email", "address"].map((field) => (
                <label key={field}>
                  {field[0].toUpperCase() + field.slice(1)}
                  <input className="form-control" value={newCustomer[field]} onChange={(event) => setNewCustomer((current) => ({ ...current, [field]: event.target.value }))} />
                </label>
              ))}
            </div>
          ) : (
            <select className="form-select retail-select" value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)}>
              <option value="">Walk-in Customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>{customer.name} - {customer.mobile}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="table align-middle management-table">
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Price</th><th>Discount</th><th>Tax</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {cart.length ? cart.map((item) => {
                const lineTotal = Math.max(item.quantity * item.price - item.discount, 0) + Number(item.tax || 0);
                return (
                  <tr key={item.productId}>
                    <td><strong>{item.name}</strong><span className="d-block text-secondary">{item.sku}</span></td>
                    <td>
                      <div className="qty-control">
                        <button type="button" onClick={() => updateCart(item.productId, "quantity", item.quantity - 1)}><Minus size={14} /></button>
                        <input type="number" min="1" max={item.stock} value={item.quantity} onChange={(event) => updateCart(item.productId, "quantity", event.target.value)} />
                        <button type="button" onClick={() => updateCart(item.productId, "quantity", item.quantity + 1)}><Plus size={14} /></button>
                      </div>
                    </td>
                    <td><input className="table-input" type="number" min="0" value={item.price} onChange={(event) => updateCart(item.productId, "price", event.target.value)} /></td>
                    <td><input className="table-input" type="number" min="0" value={item.discount} onChange={(event) => updateCart(item.productId, "discount", event.target.value)} /></td>
                    <td><input className="table-input" type="number" min="0" value={item.tax} onChange={(event) => updateCart(item.productId, "tax", event.target.value)} /></td>
                    <td><strong>{formatCurrency(lineTotal)}</strong></td>
                    <td><button className="icon-btn danger" type="button" onClick={() => setCart((current) => current.filter((cartItem) => cartItem.productId !== item.productId))}><Trash2 size={16} /></button></td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="7" className="text-center py-4">Cart is empty.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="billing-footer">
          <div>
            <label>Payment Mode</label>
            <select className="form-select retail-select" value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)}>
              {["Cash", "UPI", "Card", "Credit"].map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </div>
          <div className="totals-card">
            <div><span>Subtotal</span><strong>{formatCurrency(totals.subtotal)}</strong></div>
            <div><span>Discount</span><strong>{formatCurrency(totals.discountAmount)}</strong></div>
            <div><span>Tax</span><strong>{formatCurrency(totals.taxAmount)}</strong></div>
            <div className="grand"><span>Grand Total</span><strong>{formatCurrency(totals.grandTotal)}</strong></div>
            <button className="btn btn-dark w-100 d-inline-flex align-items-center justify-content-center gap-2" type="button" onClick={generateBill} disabled={submitting}>
              <ReceiptText size={18} />
              {submitting ? "Generating..." : "Generate Bill"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Billing;
