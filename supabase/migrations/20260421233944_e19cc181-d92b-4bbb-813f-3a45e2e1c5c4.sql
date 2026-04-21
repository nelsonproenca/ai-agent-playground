-- Rename table to be more generic
ALTER TABLE public.plan_highlight_audit RENAME TO admin_audit_log;

-- Add generic columns
ALTER TABLE public.admin_audit_log
  ADD COLUMN entity_type TEXT,
  ADD COLUMN entity_id UUID,
  ADD COLUMN entity_name TEXT,
  ADD COLUMN details JSONB DEFAULT '{}'::jsonb;

-- Backfill existing rows (all current entries are plan highlight events)
UPDATE public.admin_audit_log
SET entity_type = 'plan',
    entity_id = plan_id,
    entity_name = plan_name
WHERE entity_type IS NULL;

-- Make entity_type required going forward
ALTER TABLE public.admin_audit_log
  ALTER COLUMN entity_type SET NOT NULL;

-- Make legacy plan-specific columns nullable (they already were, but ensure it)
ALTER TABLE public.admin_audit_log
  ALTER COLUMN plan_id DROP NOT NULL,
  ALTER COLUMN plan_name DROP NOT NULL;

-- Index for filtering by entity type
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity_type ON public.admin_audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_changed_at ON public.admin_audit_log(changed_at DESC);

-- Drop old policies (they reference the old table name implicitly via policy names)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_log;

-- Recreate policies
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = changed_by);