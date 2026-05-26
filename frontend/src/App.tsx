import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AuditTimelinePage from "./pages/AuditTimelinePage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ReviewConsolePage from "./pages/ReviewConsolePage";
import UploadCenterPage from "./pages/UploadCenterPage";
import { useAuth } from "./auth/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, ready } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-app text-sm text-slate-600">Restoring session...</div>;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="uploads" element={<UploadCenterPage />} />
        <Route path="reviews" element={<ReviewConsolePage />} />
        <Route path="audit" element={<AuditTimelinePage />} />
      </Route>
    </Routes>
  );
}
