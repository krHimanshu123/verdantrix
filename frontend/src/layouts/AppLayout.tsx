import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const links = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Upload Center", to: "/uploads" },
  { label: "Review Console", to: "/reviews" },
  { label: "Audit Timeline", to: "/audit" }
];

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "Verdantrix User";

  return (
    <div className="h-screen overflow-hidden bg-app text-slate-900">
      <div className="flex h-full">
        <aside className="sidebar hidden h-full w-72 shrink-0 overflow-hidden px-6 py-8 text-white lg:flex lg:flex-col">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Verdantrix</p>
            <h1 className="mt-3 text-2xl font-semibold">Operations Workspace</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">Analyst console for ingestion intake, record review, and audit traceability.</p>
          </div>

          <nav className="mt-10 space-y-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-700 bg-slate-800/80 p-4 shadow-lg">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in</p>
            <p className="mt-2 text-sm font-semibold">{displayName}</p>
            <p className="mt-1 text-xs text-slate-400">{user?.role || "analyst"}{user?.organization_name ? ` • ${user.organization_name}` : ""}</p>
            <button
              type="button"
              className="mt-4 button-secondary w-full border-slate-600 bg-transparent text-white hover:border-slate-500"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className="h-full flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm lg:hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Verdantrix</h2>
                  <p className="mt-1 text-sm text-slate-500">{user?.organization_name || "Operations workspace"}</p>
                  <p className="mt-1 text-xs text-slate-500">Signed in as {displayName}</p>
                </div>
                <button
                  type="button"
                  className="button-secondary shrink-0"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Sign out
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `rounded-xl px-4 py-2 text-sm ${isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
