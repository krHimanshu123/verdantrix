import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Verdantrix — Sign in";
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      const status = (err as any)?.response?.status;
      if (status === 401) {
        setError("Invalid username or password.");
      } else {
        setError("Unable to sign in. Confirm the backend is running and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-aside">
          <p className="auth-eyebrow">Verdantrix</p>
          <h1 className="auth-title">Operational console for ingestion, review, and audit history.</h1>
          <p className="auth-copy">Sign in with your organization account to continue.</p>
        </div>

        <div className="auth-content">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Sign in</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Access Verdantrix Workspace</h2>
          <p className="mt-3 text-sm text-slate-500">Sign in to continue to your organization workspace.</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
              <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? <div className="alert-banner alert-error">{error}</div> : null}
            <button type="submit" className="button-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in to Verdantrix"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-4 text-sm text-slate-500">
            <span>Need an account?</span>
            <Link to="/register" className="font-semibold text-slate-900">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
