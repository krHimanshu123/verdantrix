import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    organization_name: "",
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = "Verdantrix — Register";
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const clientValidation = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!form.organization_name.trim()) errors.organization_name = "Organization name is required.";
    if (!form.username.trim()) errors.username = "Username is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    if (!form.password) errors.password = "Password is required.";
    if (!form.confirm_password) errors.confirm_password = "Confirm your password.";
    if (form.password && form.confirm_password && form.password !== form.confirm_password) {
      errors.confirm_password = "Passwords do not match.";
    }
    return errors;
  }, [form]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    if (Object.keys(clientValidation).length) {
      setFieldErrors(clientValidation);
      setLoading(false);
      return;
    }

    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      const payload = (err as any)?.response?.data;
      if (payload && typeof payload === "object") {
        const nextFieldErrors: Record<string, string> = {};
        for (const [key, value] of Object.entries(payload)) {
          if (Array.isArray(value) && value[0]) {
            nextFieldErrors[key] = String(value[0]);
          }
        }
        if (Object.keys(nextFieldErrors).length) {
          setFieldErrors(nextFieldErrors);
          setError("Please review the highlighted fields.");
          return;
        }
      }

      const status = (err as any)?.response?.status;
      if (status === 400) {
        setError("Registration could not be completed. Check the details and try again.");
      } else {
        setError("Registration could not be completed. Confirm the backend is running and try again.");
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
          <h1 className="auth-title">Create an account for your organization workspace.</h1>
          <p className="auth-copy">Accounts are local to this environment and stored in the workspace database.</p>
        </div>

        <div className="auth-content">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Create account</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Set up access</h2>
          <p className="mt-3 text-sm text-slate-500">Create a local account and start working in your organization workspace.</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Field label="Organization name" error={fieldErrors.organization_name}>
              <input
                className="input"
                value={form.organization_name}
                onChange={(event) => setForm({ ...form, organization_name: event.target.value })}
                placeholder="e.g., Northwind Manufacturing"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Username" error={fieldErrors.username}>
                <input className="input" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
              </Field>
              <Field label="Email" error={fieldErrors.email}>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </Field>
            </div>

            <Field label="Password" error={fieldErrors.password}>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </Field>

            <Field label="Confirm password" error={fieldErrors.confirm_password}>
              <input
                type="password"
                className="input"
                value={form.confirm_password}
                onChange={(event) => setForm({ ...form, confirm_password: event.target.value })}
              />
            </Field>

            {error ? <div className="alert-banner alert-error">{error}</div> : null}

            <button type="submit" className="button-primary w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-500">
            Already have access?{" "}
            <Link to="/login" className="font-semibold text-slate-900">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
