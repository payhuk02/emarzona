-- Advanced admin broadcast features: scheduling, priority, CTA, recipient preview
BEGIN;

-- Extend status values
ALTER TABLE public.admin_broadcasts DROP CONSTRAINT IF EXISTS admin_broadcasts_status_check;
ALTER TABLE public.admin_broadcasts ADD CONSTRAINT admin_broadcasts_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'partial', 'failed', 'scheduled', 'cancelled'));

ALTER TABLE public.admin_broadcasts
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS action_label TEXT;

CREATE INDEX IF NOT EXISTS idx_admin_broadcasts_scheduled
  ON public.admin_broadcasts (scheduled_at)
  WHERE status = 'scheduled';

-- Recipient count preview (platform admins only)
CREATE OR REPLACE FUNCTION public.count_broadcast_recipients(
  p_audience TEXT,
  p_emails TEXT[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Administration requise';
  END IF;

  IF p_audience = 'emails' THEN
    SELECT count(*)::INTEGER INTO v_count
    FROM (
      SELECT DISTINCT lower(trim(e)) AS email
      FROM unnest(COALESCE(p_emails, ARRAY[]::TEXT[])) AS e
      WHERE trim(e) <> '' AND position('@' IN trim(e)) > 0
    ) parsed;
  ELSE
    SELECT count(*)::INTEGER INTO v_count
    FROM public.get_broadcast_recipients(p_audience);
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.count_broadcast_recipients(TEXT, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_broadcast_recipients(TEXT, TEXT[]) TO authenticated;

COMMIT;
