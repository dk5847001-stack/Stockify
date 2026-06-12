import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main className="auth-page">
      <section className="auth-card text-center">
        <p className="eyebrow mb-2">404</p>
        <h1>Page not found</h1>
        <p className="text-secondary">The Stockify page you are looking for is not available yet.</p>
        <Link className="btn btn-dark" to="/dashboard">Back to Dashboard</Link>
      </section>
    </main>
  );
};

export default NotFound;
