import { supabase } from "@/integrations/supabase/client";

/**
 * Generic admin audit logger. Records administrative actions across multiple
 * entity types (plans, cameras, etc.) into the shared `admin_audit_log` table.
 *
 * Failures never block the user-facing flow — they are logged to the console
 * so the original operation still succeeds even if the audit insert fails.
 */
export type AuditEntityType = "plan" | "camera" | "admin";

export interface LogAdminEventInput {
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;
  action: string;
  details?: Record<string, unknown>;
  // Plan-specific legacy fields, kept for backward compatibility with the
  // existing highlight-tracking UI.
  previousHighlightedPlanId?: string | null;
  previousHighlightedPlanName?: string | null;
}

export async function logAdminEvent(input: LogAdminEventInput): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return;

  // Cast to avoid waiting for regenerated supabase types after the table rename.
  const { error } = await (supabase as unknown as {
    from: (t: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  })
    .from("admin_audit_log")
    .insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      entity_name: input.entityName,
      action: input.action,
      details: input.details ?? {},
      // Mirror plan fields for the existing audit page columns
      plan_id: input.entityType === "plan" ? input.entityId : null,
      plan_name: input.entityType === "plan" ? input.entityName : null,
      previous_highlighted_plan_id: input.previousHighlightedPlanId ?? null,
      previous_highlighted_plan_name: input.previousHighlightedPlanName ?? null,
      changed_by: user.id,
      changed_by_email: user.email ?? null,
    });

  if (error) console.warn("[audit] failed to log admin event:", error.message);
}
