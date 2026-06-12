import { MailCheck } from "lucide-react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  return (
    <main className="auth-page compact-auth">
      <section className="auth-card text-center">
        <div className="auth-icon mx-auto">
          <MailCheck size={28} />
        </div>
        <p className="eyebrow mb-2 mt-3">Password Recovery</p>
        <h1>Reset access</h1>
        <p className="text-secondary">
          Enter your registered email and the recovery flow can be connected in a later phase.
        </p>
        <form className="auth-form text-start">
          <label>
            Email
            <input className="form-control" type="email" placeholder="admin@stockify.com" />
          </label>
          <button className="btn btn-dark w-100" type="button">Send reset link</button>
        </form>
        <p className="auth-switch">
          Remembered it? <Link to="/login">Back to login</Link>
        </p>
      </section>
    </main>
  );
};

export default ForgotPassword;
