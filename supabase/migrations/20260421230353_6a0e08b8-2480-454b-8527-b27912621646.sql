-- Tabela de auditoria para mudanças de destaque em planos
CREATE TABLE public.plan_highlight_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  previous_highlighted_plan_id UUID,
  previous_highlighted_plan_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('highlighted', 'unhighlighted')),
  changed_by UUID NOT NULL,
  changed_by_email TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para consultas comuns
CREATE INDEX idx_plan_highlight_audit_changed_at ON public.plan_highlight_audit(changed_at DESC);
CREATE INDEX idx_plan_highlight_audit_plan_id ON public.plan_highlight_audit(plan_id);

-- Habilitar RLS
ALTER TABLE public.plan_highlight_audit ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver o histórico de auditoria
CREATE POLICY "Admins can view audit logs"
ON public.plan_highlight_audit
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem inserir registros de auditoria (e apenas como eles mesmos)
CREATE POLICY "Admins can insert audit logs"
ON public.plan_highlight_audit
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = changed_by);