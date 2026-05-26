export interface ApiEnvelope<T> {
  status: string;
  message: string;
  data: T;
  pagination?: {
    count: number;
    page: number;
    page_size: number;
    pages: number;
    next: string | null;
    previous: string | null;
  };
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "analyst" | "manager";
  organization: number | null;
  organization_name: string | null;
}

export interface Organization {
  id: number;
  name: string;
  industry: string;
  country: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_ingested_rows: number;
  flagged_rows: number;
  approved_rows: number;
  locked_rows: number;
  source_breakdown: Array<{ source_type: string; total: number }>;
  anomaly_statistics: {
    low: number;
    medium: number;
    high: number;
  };
  validation_breakdown: Array<{ validation_status: string; total: number }>;
}

export interface DataSourceSummary {
  id: number;
  organization: number;
  organization_name: string;
  source_type: string;
  upload_method: string;
  uploaded_at: string;
  original_file_name: string;
  ingestion_status: string;
  raw_record_count: number;
  uploaded_by_username?: string | null;
}

export interface EmissionRecord {
  id: number;
  organization: number;
  organization_name: string;
  raw_record: number;
  raw_payload: Record<string, string>;
  source_type: string;
  source_file_name: string;
  scope_category: string;
  emission_category: string;
  activity_type: string;
  source_reference: string;
  quantity: string;
  original_unit: string;
  normalized_unit: string;
  normalized_quantity: string;
  emission_factor: string;
  estimated_co2e: string;
  reporting_period_start: string | null;
  reporting_period_end: string | null;
  validation_status: "valid" | "flagged" | "rejected";
  analyst_status: "pending" | "approved" | "rejected" | "locked";
  anomaly_score: string;
  analyst_notes: string;
  locked_for_audit: boolean;
  created_at: string;
  updated_at: string;
  audit_count: number;
}

export interface AuditLogEntry {
  id: number;
  emission_record: number;
  emission_record_reference: string;
  action_type: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  changed_by_username: string | null;
  timestamp: string;
}
