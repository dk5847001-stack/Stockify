import { LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand-mark">S</div>
        <h2>Join your retail workspace in minutes.</h2>
        <div className="auth-metrics">
          <div><strong>JWT</strong><span>Secure access</span></div>
          <div><strong>User</strong><span>Staff access</span></div>
        </div>
      </section>
      <section className="auth-card">
        <p className="eyebrow mb-2">Start Selling Smarter</p>
        <h1>Create Stockify Account</h1>
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <div className="input-shell">
              <UserRound size={18} />
              <input
                className="form-control"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>
          </label>
          <label>
            Email
            <div className="input-shell">
              <Mail size={18} />
              <input
                className="form-control"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="owner@store.com"
                required
              />
            </div>
          </label>
          <label>
            Phone
            <div className="input-shell">
              <Phone size={18} />
              <input
                className="form-control"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Business phone"
              />
            </div>
          </label>
          <label>
            Password
            <div className="input-shell">
              <LockKeyhole size={18} />
              <input
                className="form-control"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>
          </label>
          <button className="btn btn-dark w-100" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="auth-switch">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
};

export default Register;
