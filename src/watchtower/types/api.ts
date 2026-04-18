// ─── Auth / Identidade ────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
}

// ─── Câmeras ──────────────────────────────────────────────────────────────────

export interface CameraDto {
  id: string;
  name: string;
  slug: string;
  locationName: string;
  isActive: boolean;
}

// ─── Stream ───────────────────────────────────────────────────────────────────

export interface StreamUrlDto {
  streamUrl: string;
  expiresAt: string; // ISO 8601
}

// ─── Pagamentos ───────────────────────────────────────────────────────────────

export type PaymentStatus = "Pending" | "Approved" | "Rejected";
export type UserAccessStatus = "PendingSetup" | "Active" | "Expired";

export interface SubmitPaymentPayload {
  planId: string;
  nome: string;
  cpf: string;
  comprovante: File;
}

export interface SubmitPaymentResponse {
  paymentId: string;
  message: string;
}

export interface PaymentStatusDto {
  paymentStatus: PaymentStatus | null;
  userAccessStatus: UserAccessStatus | null;
  accessExpiresAt: string | null;
  canDownload: boolean;
  recordingDaysLimit: number | null;
}

// ─── Faturamento ──────────────────────────────────────────────────────────────

export interface BillingItemDto {
  id: string;
  planName: string;
  priceBrl: number;
  status: PaymentStatus;
  createdAt: string;
  accessExpiresAt: string | null;
}

// ─── Usuário ──────────────────────────────────────────────────────────────────

export interface NotificationPreferencesDto {
  movementAlerts: boolean;
  weeklyEmailReports: boolean;
  maintenanceNotices: boolean;
}

// ─── Contato ──────────────────────────────────────────────────────────────────

export interface SubmitContactPayload {
  name: string;
  email: string;
  message: string;
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export type HealthStatus = "Online" | "Offline" | "Unknown";

export interface HealthConfigDto {
  n8nWebhookUrl: string | null;
  checkIntervalMinutes: number;
  notifyAfterFailures: number;
}

export interface UpdateHealthConfigPayload {
  n8nWebhookUrl?: string | null;
  checkIntervalMinutes: number;
  notifyAfterFailures: number;
}

export interface HealthLogDto {
  id: string;
  cameraId: string;
  cameraName: string;
  status: HealthStatus;
  responseTimeMs: number | null;
  errorMessage: string | null;
  checkedAt: string;
}

export interface RunHealthCheckResult {
  camerasChecked: number;
  alerts: number;
}

// ─── Erros (RFC 7807 Problem Details) ────────────────────────────────────────

export interface ApiProblem {
  status: number;
  title: string;
  detail?: string;
  instance?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly problem?: ApiProblem,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}
