-- E13 Epic 1.3: Restrict email RPCs, harden orders/payments INSERT, protect profiles.role

BEGIN;

-- =====================================================
-- 1. Email RPC access control
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_can_view_user_email(
  p_viewer UUID,
  p_target UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_viewer IS NOT NULL
    AND p_target IS NOT NULL
    AND (
      p_viewer = p_target
      OR public.is_platform_admin()
      OR EXISTS (
        SELECT 1
        FROM public.store_members sm1
        INNER JOIN public.store_members sm2 ON sm1.store_id = sm2.store_id
        WHERE sm1.user_id = p_viewer
          AND sm2.user_id = p_target
          AND sm1.status = 'active'
          AND sm2.status = 'active'
      )
      OR EXISTS (
        SELECT 1
        FROM public.stores s
        INNER JOIN public.store_members sm ON sm.store_id = s.id
        WHERE s.user_id = p_viewer
          AND sm.user_id = p_target
          AND sm.status IN ('active', 'pending')
      )
      OR EXISTS (
        SELECT 1
        FROM public.store_members sm
        INNER JOIN public.stores s ON s.id = sm.store_id
        WHERE sm.user_id = p_viewer
          AND s.user_id = p_target
          AND sm.status = 'active'
      )
      OR EXISTS (
        SELECT 1
        FROM public.referrals r
        WHERE r.referrer_id = p_viewer
          AND r.referred_id = p_target
      )
      OR EXISTS (
        SELECT 1
        FROM public.stores s
        INNER JOIN public.orders o ON o.store_id = s.id
        INNER JOIN public.customers c ON c.id = o.customer_id
        INNER JOIN auth.users u ON u.id = p_target
        WHERE s.user_id = p_viewer
          AND c.email IS NOT NULL
          AND lower(trim(c.email)) = lower(trim(u.email))
      )
    );
$$;

COMMENT ON FUNCTION public.user_can_view_user_email IS
  'True when p_viewer may resolve p_target email (self, admin, same store, referral, store customer).';

CREATE OR REPLACE FUNCTION public.get_user_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller UUID;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL OR NOT public.user_can_view_user_email(v_caller, p_user_id) THEN
    RETURN NULL;
  END IF;

  RETURN (SELECT email FROM auth.users WHERE id = p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_users_emails(p_user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT au.id AS user_id, au.email
  FROM auth.users au
  WHERE au.id = ANY(p_user_ids)
    AND auth.uid() IS NOT NULL
    AND public.user_can_view_user_email(auth.uid(), au.id);
$$;

COMMENT ON FUNCTION public.get_user_email IS
  'Returns auth email for p_user_id when caller is authorized (admin, self, store team, referral, customer).';

COMMENT ON FUNCTION public.get_users_emails IS
  'Batch email lookup filtered by user_can_view_user_email for each target.';

GRANT EXECUTE ON FUNCTION public.user_can_view_user_email(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_emails(UUID[]) TO authenticated;

-- =====================================================
-- 2. Orders INSERT hardening (store-owner policies remain OR'd)
-- =====================================================

DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;

CREATE POLICY "orders_insert_policy"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    public.is_platform_admin()
    OR (
      auth.uid() IS NOT NULL
      AND customer_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_id
          AND lower(trim(c.email)) = lower(trim((
            SELECT u.email FROM auth.users u WHERE u.id = auth.uid()
          )))
      )
    )
  );

-- =====================================================
-- 3. Payments INSERT hardening
-- =====================================================

DROP POLICY IF EXISTS "payments_insert_policy" ON public.payments;

CREATE POLICY "payments_insert_policy"
  ON public.payments
  FOR INSERT
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.stores s
      WHERE s.id = payments.store_id
        AND s.user_id = auth.uid()
    )
    OR (
      auth.uid() IS NOT NULL
      AND customer_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_id
          AND lower(trim(c.email)) = lower(trim((
            SELECT u.email FROM auth.users u WHERE u.id = auth.uid()
          )))
      )
    )
  );

-- =====================================================
-- 4. Profiles: block role / is_super_admin escalation
-- =====================================================

CREATE OR REPLACE FUNCTION public.protect_profiles_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_platform_admin() THEN
      NEW.role := COALESCE(NEW.role, 'user');
      IF NEW.role IS DISTINCT FROM 'user' THEN
        NEW.role := 'user';
      END IF;
      NEW.is_super_admin := false;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF (
      OLD.role IS DISTINCT FROM NEW.role
      OR COALESCE(OLD.is_super_admin, false) IS DISTINCT FROM COALESCE(NEW.is_super_admin, false)
    ) AND NOT public.is_platform_admin() THEN
      RAISE EXCEPTION 'PROFILE_PRIVILEGE_ESCALATION_DENIED'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profiles_privileged_columns_trigger ON public.profiles;

CREATE TRIGGER protect_profiles_privileged_columns_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_privileged_columns();

COMMENT ON FUNCTION public.protect_profiles_privileged_columns IS
  'Only platform admins may set profiles.role or profiles.is_super_admin.';

COMMIT;
