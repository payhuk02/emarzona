-- ============================================================================
-- Migration: Admin Notification RPC (Bypass RLS)
-- Description: Permet aux administrateurs de créer manuellement des notifications
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID;
  v_notification_id UUID;
BEGIN
  v_caller := auth.uid();

  -- Verify caller is authenticated
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  -- Verify caller is admin
  IF NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN: Seul un administrateur peut utiliser cette fonction.';
  END IF;

  -- Insert notification bypassing RLS
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    metadata,
    action_url,
    action_label,
    priority
  ) VALUES (
    p_user_id,
    COALESCE(p_type, 'info'),
    p_title,
    p_message,
    COALESCE(p_metadata, '{}'::jsonb),
    p_action_url,
    p_action_label,
    COALESCE(p_priority, 'normal')
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

COMMENT ON FUNCTION public.admin_create_notification IS
  'Permet à un administrateur d''envoyer une notification manuelle à un utilisateur (contourne le RLS restrictif).';

GRANT EXECUTE ON FUNCTION public.admin_create_notification(UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT) TO authenticated;
