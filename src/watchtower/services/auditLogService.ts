export type AuditEntityType = "plan" | "camera" | "admin";

export interface LogAdminEventInput {
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;
  action: string;
  details?: Record<string, unknown>;
  previousHighlightedPlanId?: string | null;
  previousHighlightedPlanName?: string | null;
}

// Audit logging is handled server-side — no-op on the frontend.
export async function logAdminEvent(_input: LogAdminEventInput): Promise<void> {}
