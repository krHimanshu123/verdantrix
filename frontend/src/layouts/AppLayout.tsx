import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Icon from "../components/Icon";

const links = [
  { label: "Overview", to: "/dashboard", icon: "grid", hint: "Performance snapshot" },
  { label: "Data ingestion", to: "/uploads", icon: "upload", hint: "Connect source data" },
  { label: "Review queue", to: "/reviews", icon: "review", hint: "Resolve exceptions" },
  { label: "Audit trail", to: "/audit", icon: "history", hint: "Track every change" }
];

const pageNames: Record<string, string> = {
  "/dashboard": "Executive overview",
  "/uploads": "Data ingestion",
  "/reviews": "Review queue",
  "/audit": "Audit trail"
};

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "Verdantrix User";
  const initials = displayName.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon name="leaf" className="h-5 w-5" /></div>
          <div>
            <div className="brand-name">Verdantrix</div>
            <div className="brand-subtitle">Carbon intelligence</div>
          </div>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-logo">{(user?.organization_name || "V")[0]}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.organization_name || "Operations workspace"}</p>
            <p className="mt-0.5 text-xs text-slate-400">Enterprise workspace</p>
          </div>
          <Icon name="chevron" className="h-4 w-4 rotate-90 text-slate-500" />
        </div>

        <p className="nav-label">Workspace</p>
        <nav className="space-y-1.5">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}>
              <Icon name={link.icon} className="h-[19px] w-[19px]" />
              <span className="flex-1">{link.label}</span>
              <Icon name="chevron" className="h-3.5 w-3.5 opacity-50" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-insight">
          <div className="flex items-center gap-2 text-emerald-300">
            <Icon name="shield" className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Audit ready</span>
          </div>
          <p className="mt-3 text-sm font-medium text-white">Your workspace is protected</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">Source lineage and analyst actions are continuously preserved.</p>
        </div>

        <button className="user-card" onClick={() => { logout(); navigate("/login"); }}>
          <span className="avatar">{initials}</span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold text-white">{displayName}</span>
            <span className="block truncate text-xs capitalize text-slate-400">{user?.role || "analyst"} · Sign out</span>
          </span>
          <Icon name="chevron" className="h-4 w-4 text-slate-500" />
        </button>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <div>
            <p className="text-xs font-medium text-slate-400">Verdantrix / Workspace</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{pageNames[location.pathname] || "Workspace"}</p>
          </div>
          <div className="topbar-actions">
            <div className="system-status"><span className="status-dot" />All systems operational</div>
            <button className="icon-button" aria-label="Search"><Icon name="search" className="h-[18px] w-[18px]" /></button>
            <button className="icon-button relative" aria-label="Notifications"><Icon name="bell" className="h-[18px] w-[18px]" /><span className="notification-dot" /></button>
            <div className="topbar-avatar">{initials}</div>
          </div>
        </header>

        <main className="page-scroll">
          <div className="page-container"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
