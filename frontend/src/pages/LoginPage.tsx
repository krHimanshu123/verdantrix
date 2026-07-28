import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Icon from "../components/Icon";

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
          <div className="relative flex items-center gap-3"><div className="brand-mark"><Icon name="leaf" className="h-5 w-5" /></div><div><p className="text-lg font-bold">Verdantrix</p><p className="text-[10px] uppercase tracking-[.18em] text-emerald-300">Carbon intelligence</p></div></div>
          <h1 className="auth-title">Turn operational data into audit-ready climate intelligence.</h1>
          <p className="auth-copy">A single workspace to ingest, validate, review, and trace every emissions record with confidence.</p>
          <div className="auth-proof">
            <div><Icon name="database" className="h-5 w-5 text-emerald-300"/><strong className="mt-3 block text-lg">3</strong><span className="text-[10px] text-slate-400">Data sources</span></div>
            <div><Icon name="shield" className="h-5 w-5 text-emerald-300"/><strong className="mt-3 block text-lg">100%</strong><span className="text-[10px] text-slate-400">Traceable</span></div>
            <div><Icon name="trend" className="h-5 w-5 text-emerald-300"/><strong className="mt-3 block text-lg">Live</strong><span className="text-[10px] text-slate-400">Insights</span></div>
          </div>
        </div>

        <div className="auth-content">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Welcome back</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Sign in to your workspace</h2>
          <p className="mt-3 text-sm text-slate-500">Continue managing your organization’s sustainability data.</p>

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
