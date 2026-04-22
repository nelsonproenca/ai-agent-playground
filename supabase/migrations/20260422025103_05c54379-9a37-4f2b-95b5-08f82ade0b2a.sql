-- 1. Adicionar colunas de controle de acesso em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_request_status text NOT NULL DEFAULT 'none'
    CHECK (admin_request_status IN ('none', 'pending', 'approved', 'rejected'));

-- 2. Backfill: usuários existentes têm acesso liberado imediatamente (não bloqueia ninguém atual)
UPDATE public.profiles SET access_released_at = created_at WHERE access_released_at IS NULL;

-- 3. Atualizar handle_new_user para:
--    - Definir access_released_at = now() + 15min
--    - Capturar role solicitada do raw_user_meta_data ('admin' marca pending)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _requested_role text;
BEGIN
  _requested_role := COALESCE(NEW.raw_user_meta_data->>'requested_role', 'user');

  INSERT INTO public.profiles (user_id, display_name, email, access_released_at, admin_request_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.email,
    now() + interval '15 minutes',
    CASE WHEN _requested_role = 'admin' THEN 'pending' ELSE 'none' END
  );
  RETURN NEW;
END;
$function$;

-- 4. Garantir que o trigger existe em auth.users (idempotente)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RPC para listar pedidos pendentes de admin (apenas admins)
CREATE OR REPLACE FUNCTION public.list_pending_admin_requests()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  email text,
  created_at timestamptz,
  access_released_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT p.user_id, p.display_name, p.email::text, p.created_at, p.access_released_at
  FROM public.profiles p
  WHERE p.admin_request_status = 'pending'
  ORDER BY p.created_at ASC;
END;
$function$;

-- 6. RPC para aprovar pedido (promove + marca approved + libera acesso imediatamente)
CREATE OR REPLACE FUNCTION public.approve_admin_request(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles
  SET admin_request_status = 'approved',
      access_released_at = LEAST(COALESCE(access_released_at, now()), now())
  WHERE user_id = _user_id;
END;
$function$;

-- 7. RPC para rejeitar pedido (vira usuário comum, mantém access_released_at original)
CREATE OR REPLACE FUNCTION public.reject_admin_request(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  UPDATE public.profiles
  SET admin_request_status = 'rejected'
  WHERE user_id = _user_id;
END;
$function$;

-- 8. RPC para o usuário consultar seu próprio status de acesso (sem precisar SELECT direto)
CREATE OR REPLACE FUNCTION public.get_my_access_status()
RETURNS TABLE(
  access_released_at timestamptz,
  admin_request_status text,
  is_admin boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    p.access_released_at,
    p.admin_request_status,
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin') AS is_admin
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
END;
$function$;