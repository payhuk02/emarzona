-- Admin broadcasts (email / in-app) and platform popup messages
BEGIN;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channels TEXT[] NOT NULL DEFAULT '{}',
  audience_type TEXT NOT NULL CHECK (audience_type IN ('all', 'vendors', 'customers', 'emails')),
  audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'partial', 'failed')),
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_broadcasts_created_at
  ON public.admin_broadcasts (created_at DESC);

CREATE TABLE IF NOT EXISTS public.platform_popup_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES public.admin_broadcasts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  style TEXT NOT NULL DEFAULT 'info' CHECK (style IN ('info', 'warning', 'success', 'announcement')),
  target_audience TEXT NOT NULL DEFAULT 'all'
    CHECK (target_audience IN ('all', 'authenticated', 'vendors', 'customers')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  dismissible BOOLEAN NOT NULL DEFAULT true,
  show_once BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_popup_messages_active
  ON public.platform_popup_messages (is_active, starts_at DESC);

CREATE TABLE IF NOT EXISTS public.platform_popup_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id UUID NOT NULL REFERENCES public.platform_popup_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (popup_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_popup_dismissals_user
  ON public.platform_popup_dismissals (user_id);

-- ---------------------------------------------------------------------------
-- Recipient resolution (service role / edge functions)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_users_by_emails(p_emails TEXT[])
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id, lower(u.email::text)
  FROM auth.users u
  WHERE lower(u.email::text) = ANY (
    SELECT lower(trim(e))
    FROM unnest(COALESCE(p_emails, ARRAY[]::TEXT[])) AS e
    WHERE trim(e) <> '' AND position('@' IN trim(e)) > 0
  );
$$;

CREATE OR REPLACE FUNCTION public.get_broadcast_recipients(p_audience TEXT)
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF p_audience = 'vendors' THEN
    RETURN QUERY
      SELECT DISTINCT u.id, lower(u.email::text)
      FROM auth.users u
      INNER JOIN public.stores s ON s.user_id = u.id
      WHERE u.email IS NOT NULL;
  ELSIF p_audience = 'customers' THEN
    RETURN QUERY
      SELECT u.id, lower(u.email::text)
      FROM auth.users u
      WHERE u.email IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.stores s WHERE s.user_id = u.id
        );
  ELSE
    RETURN QUERY
      SELECT u.id, lower(u.email::text)
      FROM auth.users u
      WHERE u.email IS NOT NULL;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_users_by_emails(TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_broadcast_recipients(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_users_by_emails(TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_broadcast_recipients(TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Active popups for end users
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_active_platform_popups(p_user_id UUID DEFAULT auth.uid())
RETURNS SETOF public.platform_popup_messages
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_vendor BOOLEAN := false;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.stores s WHERE s.user_id = p_user_id
    ) INTO v_is_vendor;
  END IF;

  RETURN QUERY
    SELECT ppm.*
    FROM public.platform_popup_messages ppm
    WHERE ppm.is_active = true
      AND ppm.starts_at <= now()
      AND (ppm.ends_at IS NULL OR ppm.ends_at > now())
      AND (
        ppm.target_audience = 'all'
        OR (ppm.target_audience = 'authenticated' AND p_user_id IS NOT NULL)
        OR (ppm.target_audience = 'vendors' AND p_user_id IS NOT NULL AND v_is_vendor)
        OR (ppm.target_audience = 'customers' AND p_user_id IS NOT NULL AND NOT v_is_vendor)
      )
      AND (
        p_user_id IS NULL
        OR NOT EXISTS (
          SELECT 1
          FROM public.platform_popup_dismissals d
          WHERE d.popup_id = ppm.id AND d.user_id = p_user_id
        )
      )
    ORDER BY ppm.priority DESC, ppm.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.dismiss_platform_popup(p_popup_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.platform_popup_dismissals (popup_id, user_id)
  VALUES (p_popup_id, auth.uid())
  ON CONFLICT (popup_id, user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_platform_popups(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dismiss_platform_popup(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_popup_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_popup_dismissals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins manage admin_broadcasts" ON public.admin_broadcasts;
CREATE POLICY "Platform admins manage admin_broadcasts"
  ON public.admin_broadcasts
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins manage platform_popup_messages" ON public.platform_popup_messages;
CREATE POLICY "Platform admins manage platform_popup_messages"
  ON public.platform_popup_messages
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Authenticated users read active popups" ON public.platform_popup_messages;
CREATE POLICY "Authenticated users read active popups"
  ON public.platform_popup_messages
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
  );

DROP POLICY IF EXISTS "Anon read active popups" ON public.platform_popup_messages;
CREATE POLICY "Anon read active popups"
  ON public.platform_popup_messages
  FOR SELECT
  TO anon
  USING (
    is_active = true
    AND target_audience = 'all'
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
  );

DROP POLICY IF EXISTS "Users manage own popup dismissals" ON public.platform_popup_dismissals;
CREATE POLICY "Users manage own popup dismissals"
  ON public.platform_popup_dismissals
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
