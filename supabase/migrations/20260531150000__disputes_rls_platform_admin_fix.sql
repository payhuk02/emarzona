-- Fix disputes RLS (403) + is_platform_admin uses profiles.user_id
BEGIN;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND (
        COALESCE(p.is_super_admin, false) = true
        OR p.role IN ('admin', 'staff', 'manager', 'support', 'viewer')
      )
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

COMMENT ON FUNCTION public.is_platform_admin() IS
  'True si l''utilisateur courant peut accéder au panneau admin plateforme (profiles.user_id).';

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

DROP POLICY IF EXISTS "Admins can view all disputes" ON public.disputes;
CREATE POLICY "Admins can view all disputes"
  ON public.disputes
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Admins can update disputes" ON public.disputes;
CREATE POLICY "Admins can update disputes"
  ON public.disputes
  FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Admins can insert disputes" ON public.disputes;
CREATE POLICY "Admins can insert disputes"
  ON public.disputes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.get_disputes_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view dispute stats';
  END IF;

  SELECT json_build_object(
    'total', COUNT(*),
    'open', COUNT(*) FILTER (WHERE status = 'open'),
    'investigating', COUNT(*) FILTER (WHERE status = 'investigating'),
    'waiting_response', COUNT(*) FILTER (WHERE status IN ('waiting_customer', 'waiting_seller')),
    'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
    'closed', COUNT(*) FILTER (WHERE status = 'closed'),
    'high_priority', COUNT(*) FILTER (WHERE priority IN ('high', 'urgent') AND status NOT IN ('resolved', 'closed')),
    'avg_resolution_time_hours', AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL)
  )
  INTO result
  FROM public.disputes;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_dispute_to_admin(p_dispute_id UUID, p_admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can assign disputes';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = p_admin_id
      AND (
        COALESCE(p.is_super_admin, false) = true
        OR p.role IN ('admin', 'staff', 'manager', 'support', 'viewer')
      )
  )
  AND NOT public.has_role(p_admin_id, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Invalid admin_id: User is not an admin';
  END IF;

  UPDATE public.disputes
  SET
    assigned_admin_id = p_admin_id,
    status = CASE WHEN status = 'open' THEN 'investigating' ELSE status END,
    updated_at = NOW()
  WHERE id = p_dispute_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_dispute(p_dispute_id UUID, p_resolution TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can resolve disputes';
  END IF;

  UPDATE public.disputes
  SET status = 'resolved', resolution = p_resolution, resolved_at = NOW(), updated_at = NOW()
  WHERE id = p_dispute_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.close_dispute(p_dispute_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can close disputes';
  END IF;

  UPDATE public.disputes
  SET status = 'closed', updated_at = NOW()
  WHERE id = p_dispute_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_disputes_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_dispute_to_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_dispute(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_dispute(UUID) TO authenticated;

COMMIT;
