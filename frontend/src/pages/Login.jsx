import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to login. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand-mark">S</div>
        <h2>Run billing, stock and sales from one calm command center.</h2>
        <div className="auth-metrics">
          <div><strong>24/7</strong><span>Retail visibility</span></div>
          <div><strong>Live</strong><span>Inventory sync</span></div>
        </div>
      </section>
      <section className="auth-card">
        <p className="eyebrow mb-2">Welcome Back</p>
        <h1>Login to Stockify</h1>
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}
        <form className="auth-form" onSubmit={handleSubmit}>
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
                placeholder="admin@stockify.com"
                required
              />
            </div>
          </label>
          <label>
            Password
            <div className="input-shell">
              <LockKeyhole size={18} />
              <input
                className="form-control"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
              <button type="button" aria-label="Toggle password" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <div className="auth-row">
            <label className="mini-check">
              <input type="checkbox" />
              Remember me
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <button className="btn btn-dark w-100" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>
        <p className="auth-switch">
          New store setup? <Link to="/register">Create account</Link>
        </p>
      </section>
    </main>
  );
};

export default Login;
