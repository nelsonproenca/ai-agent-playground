-- ============== Roles system ==============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============== Plans table ==============
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  num TEXT NOT NULL,
  name TEXT NOT NULL,
  period TEXT NOT NULL,
  price TEXT NOT NULL,
  suffix TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  cta TEXT NOT NULL,
  highlight BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;
CREATE POLICY "Anyone can view active plans"
ON public.plans FOR SELECT
TO anon, authenticated
USING (active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert plans" ON public.plans;
CREATE POLICY "Admins can insert plans"
ON public.plans FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update plans" ON public.plans;
CREATE POLICY "Admins can update plans"
ON public.plans FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete plans" ON public.plans;
CREATE POLICY "Admins can delete plans"
ON public.plans FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.plans (sku, num, name, period, price, suffix, features, cta, highlight, display_order) VALUES
  ('24h', '01', 'ACESSO PONTUAL', '24 HORAS', 'R$ 9,90', '/único', '["Visualização ao vivo","Alternância horária","Sem gravações","Sem reembolso"]'::jsonb, 'COMPRAR ACESSO', false, 1),
  ('bronze', '02', 'PLANO BRONZE', 'AO VIVO', 'R$ 29,90', '/mês', '["Streaming em tempo real","Alertas de movimento","Sem histórico de gravação","Sem taxas adicionais"]'::jsonb, 'ASSINAR BRONZE', false, 2),
  ('prata', '03', 'PLANO PRATA', '7 DIAS DE HISTÓRICO', 'R$ 49,90', '/mês', '["Streaming em tempo real","Histórico de 7 dias (VOD)","Busca por data e hora","Alertas de movimento"]'::jsonb, 'ASSINAR PRATA', true, 3),
  ('ouro', '04', 'PLANO OURO', '30 DIAS DE HISTÓRICO', 'R$ 79,90', '/mês', '["Streaming em tempo real","Histórico completo 30 dias","Download de gravações","Suporte prioritário"]'::jsonb, 'ASSINAR OURO', false, 4)
ON CONFLICT (sku) DO NOTHING;

-- ============== Cameras: owner + RLS ==============
ALTER TABLE public.cameras
  ADD COLUMN IF NOT EXISTS owner_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_cameras_owner ON public.cameras(owner_user_id);

DROP POLICY IF EXISTS "Anyone authenticated can view cameras" ON public.cameras;
DROP POLICY IF EXISTS "Users can view their assigned cameras" ON public.cameras;
CREATE POLICY "Users can view their assigned cameras"
ON public.cameras
FOR SELECT
TO authenticated
USING (
  owner_user_id IS NULL
  OR owner_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can insert cameras" ON public.cameras;
CREATE POLICY "Admins can insert cameras"
ON public.cameras FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update cameras" ON public.cameras;
CREATE POLICY "Admins can update cameras"
ON public.cameras FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete cameras" ON public.cameras;
CREATE POLICY "Admins can delete cameras"
ON public.cameras FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============== Profiles: admin SELECT ==============
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============== Pending payments: admin approval ==============
ALTER TABLE public.pending_payments
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

DROP POLICY IF EXISTS "Admins can view all pending payments" ON public.pending_payments;
CREATE POLICY "Admins can view all pending payments"
ON public.pending_payments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update pending payments" ON public.pending_payments;
CREATE POLICY "Admins can update pending payments"
ON public.pending_payments FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============== Admin RPCs ==============
DROP FUNCTION IF EXISTS public.list_users_with_admin_status();
CREATE OR REPLACE FUNCTION public.list_users_with_admin_status()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  email text,
  is_admin boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.display_name,
    u.email::text,
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.user_id AND ur.role = 'admin'
    ) AS is_admin,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_pending_payment(_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payment public.pending_payments%ROWTYPE;
  _duration_days integer;
  _expires_at timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT * INTO _payment FROM public.pending_payments WHERE id = _payment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  IF _payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Payment already processed';
  END IF;

  _duration_days := CASE lower(_payment.plan_sku)
    WHEN '24h'    THEN 1
    WHEN 'bronze' THEN 30
    WHEN 'prata'  THEN 30
    WHEN 'ouro'   THEN 30
    ELSE 30
  END;
  _expires_at := now() + make_interval(days => _duration_days);

  INSERT INTO public.subscriptions (user_id, camera_id, plan_type, expires_at)
  VALUES (_payment.user_id, _payment.camera_id, _payment.plan_sku, _expires_at);

  UPDATE public.pending_payments
  SET status = 'approved',
      approved_at = now(),
      approved_by = auth.uid()
  WHERE id = _payment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_pending_payment(_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  UPDATE public.pending_payments
  SET status = 'rejected',
      approved_at = now(),
      approved_by = auth.uid()
  WHERE id = _payment_id AND status = 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.list_pending_payments_admin()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  user_email text,
  user_display_name text,
  camera_id uuid,
  camera_name text,
  plan_name text,
  plan_sku text,
  receipt_url text,
  status text,
  created_at timestamptz,
  approved_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    pp.id,
    pp.user_id,
    u.email::text,
    p.display_name,
    pp.camera_id,
    c.display_name,
    pp.plan_name,
    pp.plan_sku,
    pp.receipt_url,
    pp.status,
    pp.created_at,
    pp.approved_at
  FROM public.pending_payments pp
  LEFT JOIN auth.users u ON u.id = pp.user_id
  LEFT JOIN public.profiles p ON p.user_id = pp.user_id
  LEFT JOIN public.cameras c ON c.id = pp.camera_id
  ORDER BY
    CASE pp.status WHEN 'pending' THEN 0 ELSE 1 END,
    pp.created_at DESC;
END;
$$;