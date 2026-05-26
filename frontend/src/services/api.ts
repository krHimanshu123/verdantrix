import api from "./http";
import { ApiEnvelope, AuditLogEntry, AuthUser, DashboardMetrics, DataSourceSummary, EmissionRecord, Organization } from "../types";

export interface AuthSession {
  access: string;
  refresh: string;
  user: AuthUser;
}

export async function login(username: string, password: string) {
  const response = await api.post<ApiEnvelope<AuthSession>>("/auth/login/", {
    username,
    password
  });
  return response.data;
}

export async function register(payload: {
  organization_name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}) {
  const response = await api.post<ApiEnvelope<AuthSession>>("/auth/register/", payload);
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get<ApiEnvelope<AuthUser>>("/auth/me/");
  return response.data;
}

export async function fetchOrganizations() {
  const response = await api.get<ApiEnvelope<Organization[]>>("/organizations/");
  return response.data;
}

export async function fetchDashboardMetrics() {
  const response = await api.get<ApiEnvelope<DashboardMetrics>>("/dashboard/metrics/");
  return response.data;
}

export async function fetchDataSources() {
  const response = await api.get<ApiEnvelope<DataSourceSummary[]>>("/data-sources/");
  return response.data;
}

export async function fetchEmissionRecords(params: Record<string, string>) {
  const response = await api.get<ApiEnvelope<EmissionRecord[]>>("/records/", { params });
  return response.data;
}

export async function updateRecord(id: number, payload: Partial<EmissionRecord>) {
  const response = await api.patch<ApiEnvelope<EmissionRecord>>(`/records/${id}/`, payload);
  return response.data;
}

export async function reviewRecord(id: number, action: string, analyst_notes: string) {
  const response = await api.post<ApiEnvelope<EmissionRecord>>(`/reviews/${id}/action/`, {
    action,
    analyst_notes
  });
  return response.data;
}

export async function fetchAuditLogs(params: Record<string, string>) {
  const response = await api.get<ApiEnvelope<AuditLogEntry[]>>("/audit-logs/", { params });
  return response.data;
}

export async function uploadFile(url: string, file: File, organizationId: number, onUploadProgress?: (progress: number) => void) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("organization_id", String(organizationId));

  const response = await api.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: (event) => {
      if (!event.total || !onUploadProgress) {
        return;
      }
      onUploadProgress(Math.round((event.loaded * 100) / event.total));
    }
  });

  return response.data;
}

export async function syncTravel(organizationId: number, records?: unknown) {
  const response = await api.post("/travel/sync/", {
    organization_id: organizationId,
    ...(records ? { records } : {})
  });
  return response.data;
}
