import { ImagePlus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosInstance.js";
import ToastAlert from "../components/common/ToastAlert.jsx";

const emptyForm = {
  name: "",
  sku: "",
  barcode: "",
  category: "",
  brand: "",
  purchasePrice: "",
  sellingPrice: "",
  mrp: "",
  stock: "",
  lowStockLimit: "10",
  unit: "pcs",
  expiryDate: "",
  supplierName: "",
  image: "",
  isActive: true
};

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    api.get(`/products/${id}`)
      .then(({ data }) => {
        const product = data.product;
        setForm({
          ...emptyForm,
          ...product,
          expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : ""
        });
      })
      .catch((error) => setToast({ type: "danger", message: error.response?.data?.message || "Unable to load product." }));
  }, [id, isEdit]);

  const validate = () => {
    const nextErrors = {};
    ["name", "sku", "purchasePrice", "sellingPrice", "mrp"].forEach((field) => {
      if (String(form[field] ?? "").trim() === "") nextErrors[field] = "Required";
    });

    ["purchasePrice", "sellingPrice", "mrp", "stock", "lowStockLimit"].forEach((field) => {
      if (form[field] !== "" && Number(form[field]) < 0) nextErrors[field] = "Cannot be negative";
    });

    if (Number(form.sellingPrice) < Number(form.purchasePrice)) {
      nextErrors.sellingPrice = "Selling price cannot be lower than purchase price";
    }

    if (Number(form.sellingPrice) > Number(form.mrp)) {
      nextErrors.sellingPrice = "Selling price cannot exceed MRP";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      mrp: Number(form.mrp),
      stock: Number(form.stock || 0),
      lowStockLimit: Number(form.lowStockLimit || 0)
    };

    if (isEdit) {
      delete payload.stock;
    }

    setSubmitting(true);
    try {
      const { data } = isEdit ? await api.put(`/products/${id}`, payload) : await api.post("/products", payload);
      setToast({ type: "success", message: data.message || "Product saved successfully." });
      setTimeout(() => navigate(isEdit ? `/products/${id}` : "/products"), 500);
    } catch (error) {
      setToast({ type: "danger", message: error.response?.data?.message || "Unable to save product." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="management-page">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />
      <div className="module-header">
        <div>
          <p className="eyebrow mb-1">{isEdit ? "Edit Product" : "Add Product"}</p>
          <h2>{isEdit ? "Update Inventory Item" : "Create Inventory Item"}</h2>
        </div>
        <Link className="btn btn-outline-secondary" to="/products">Back</Link>
      </div>

      <form className="panel product-form" onSubmit={handleSubmit}>
        <div className="image-preview-box">
          {form.image ? <img src={form.image} alt="Product preview" /> : <ImagePlus size={42} />}
          <label>
            Image URL
            <input className="form-control" name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
          </label>
        </div>

        <div className="form-grid">
          {[
            ["name", "Product Name"],
            ["sku", "SKU"],
            ["barcode", "Barcode"],
            ["category", "Category"],
            ["brand", "Brand"],
            ["supplierName", "Supplier Name"]
          ].map(([name, label]) => (
            <label key={name}>
              {label}
              <input className={`form-control ${errors[name] ? "is-invalid" : ""}`} name={name} value={form[name]} onChange={handleChange} />
              {errors[name] ? <span className="field-error">{errors[name]}</span> : null}
            </label>
          ))}

          {[
            ["purchasePrice", "Purchase Price"],
            ["sellingPrice", "Selling Price"],
            ["mrp", "MRP"],
            ["stock", "Opening Stock"],
            ["lowStockLimit", "Low Stock Limit"]
          ].map(([name, label]) => (
            <label key={name}>
              {label}
              <input
                className={`form-control ${errors[name] ? "is-invalid" : ""}`}
                type="number"
                min="0"
                step="0.01"
                name={name}
                value={form[name]}
                onChange={handleChange}
                disabled={isEdit && name === "stock"}
              />
              {errors[name] ? <span className="field-error">{errors[name]}</span> : null}
            </label>
          ))}

          <label>
            Unit
            <select className="form-select" name="unit" value={form.unit} onChange={handleChange}>
              {["pcs", "kg", "g", "ltr", "ml", "box", "pack", "dozen"].map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </label>
          <label>
            Expiry Date
            <input className="form-control" type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} />
          </label>
          <label className="form-check form-switch align-self-end">
            <input className="form-check-input" type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
            <span className="form-check-label">Active Product</span>
          </label>
        </div>

        <div className="form-actions">
          <button className="btn btn-dark d-inline-flex align-items-center gap-2" type="submit" disabled={submitting}>
            <Save size={18} />
            {submitting ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ProductForm;
