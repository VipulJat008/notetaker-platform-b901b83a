/* ─── User & Auth ────────────────────────────────────────── */
export type UserRole = 'admin' | 'operator' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  avatarInitials: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/* ─── Toast ──────────────────────────────────────────────── */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

/* ─── Call Notes ─────────────────────────────────────────── */
export type NoteStatus = 'Processed' | 'Pending' | 'Failed';

export interface CallNote {
  id: string;
  orderId: string;
  timestamp: string;
  summary: string;
  status: NoteStatus;
  rawNotes: string;
  orderIds: string[];
  aiSummary?: string;
  aiSummaryStatus?: 'pending' | 'processing' | 'complete' | 'failed';
  aiSummaryGeneratedAt?: string;
}

/* ─── Jobs ───────────────────────────────────────────────── */
export type JobStatus = 'failed' | 'pending' | 'running' | 'success' | 'retrying';
export type JobType = 'CSV Ingestion' | 'AI Summarisation' | 'Status Prediction' | 'Tenant Filter';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  failedAt?: string;
  attemptNumber: number;
  maxAttempts: number;
  failureReason?: string;
  latencyMs?: number;
  initiatedBy?: string;
  retryHistory?: RetryEntry[];
}

export interface RetryEntry {
  jobId: string;
  jobType: JobType;
  retryTime: string;
  initiatedBy: string;
  attemptNumber: number;
  outcome: 'Success' | 'Failed Again' | 'In Progress';
}

/* ─── Ingestion ──────────────────────────────────────────── */
export type IngestionStatus = 'Successful' | 'Pending' | 'Failed' | 'Retrying';

export interface IngestionJob {
  id: string;
  fileName: string;
  uploadTime: string;
  totalRows: number;
  validRows: number;
  failedRows: number;
  status: IngestionStatus;
  retryCount: number;
  errorSummary?: string;
}

export interface ValidationError {
  row: number;
  message: string;
}

/* ─── Tenants ────────────────────────────────────────────── */
export type TenantStatus = 'Live' | 'Inactive' | 'Suspended';

export interface Tenant {
  id: string;
  displayName: string;
  activeUsers: number;
  dataVolume: string;
  status: TenantStatus;
}

/* ─── Metrics ────────────────────────────────────────────── */
export interface JobMetric {
  date: string;
  successRate: number;
  failureCount: number;
  totalJobs: number;
}

export interface LatencyMetric {
  jobType: string;
  p50Ms: number;
  p95Ms: number;
}

/* ─── Prediction API ─────────────────────────────────────── */
export interface PredictionEntry {
  requestTime: string;
  inputSummary: string;
  predictedCode: string;
  confidence: number;
  latencyMs: number;
  status: 'success' | 'error';
}

/* ─── Navigation ─────────────────────────────────────────── */
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
  children?: NavItem[];
}
