
-- Health check logs table
CREATE TABLE public.camera_health_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  camera_id UUID NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unknown',
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.camera_health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view health logs"
  ON public.camera_health_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert health logs"
  ON public.camera_health_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_health_logs_camera_id ON public.camera_health_logs(camera_id);
CREATE INDEX idx_health_logs_checked_at ON public.camera_health_logs(checked_at DESC);

-- Health check config table (single row)
CREATE TABLE public.camera_health_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT,
  admin_phone TEXT,
  admin_whatsapp TEXT,
  check_interval_minutes INTEGER NOT NULL DEFAULT 5,
  notify_after_failures INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.camera_health_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view config"
  ON public.camera_health_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update config"
  ON public.camera_health_config FOR UPDATE
  TO authenticated
  USING (true);

-- Insert default config row
INSERT INTO public.camera_health_config (check_interval_minutes, notify_after_failures)
VALUES (5, 2);

-- Trigger for updated_at
CREATE TRIGGER update_camera_health_config_updated_at
  BEFORE UPDATE ON public.camera_health_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
