-- Sprint 4: limite boutiques liée aux plans d'abonnement (account = max des plans actifs des boutiques).

BEGIN;

ALTER TABLE public.platform_vendor_plans
  ADD COLUMN IF NOT EXISTS max_stores INTEGER;

COMMENT ON COLUMN public.platform_vendor_plans.max_stores IS
  'Max boutiques pour un compte dont le plan le plus élevé est ce slug. NULL = illimité.';

UPDATE public.platform_vendor_plans SET max_stores = 3 WHERE slug = 'physical_basic' AND max_stores IS NULL;
UPDATE public.platform_vendor_plans SET max_stores = 5 WHERE slug = 'physical_standard' AND max_stores IS NULL;
UPDATE public.platform_vendor_plans SET max_stores = NULL WHERE slug = 'physical_premium';

-- Free / défaut compte sans abonnement payant actif
CREATE OR REPLACE FUNCTION public.default_user_max_stores()
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 3;
$$;

/**
 * Résout la limite boutiques d'un utilisateur :
 * - max(max_stores) parmi les plans active/trialing des boutiques possédées
 * - sinon défaut Free (3)
 * - NULL = illimité
 */
CREATE OR REPLACE FUNCTION public.get_user_max_stores(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN public.default_user_max_stores();
  END IF;

  SELECT MAX(p.max_stores)
  INTO v_limit
  FROM public.stores s
  JOIN public.store_platform_subscriptions sub ON sub.store_id = s.id
  JOIN public.platform_vendor_plans p ON p.id = sub.plan_id
  WHERE s.user_id = p_user_id
    AND sub.status IN ('active', 'trialing')
    AND p.max_stores IS NOT NULL;

  -- Si un plan illimité (max_stores NULL) est actif → illimité
  IF EXISTS (
    SELECT 1
    FROM public.stores s
    JOIN public.store_platform_subscriptions sub ON sub.store_id = s.id
    JOIN public.platform_vendor_plans p ON p.id = sub.plan_id
    WHERE s.user_id = p_user_id
      AND sub.status IN ('active', 'trialing')
      AND p.max_stores IS NULL
  ) THEN
    RETURN NULL;
  END IF;

  IF v_limit IS NULL THEN
    RETURN public.default_user_max_stores();
  END IF;

  RETURN GREATEST(v_limit, public.default_user_max_stores());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_store_quota(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := COALESCE(p_user_id, auth.uid());
  v_used INTEGER;
  v_max INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Seul soi-même (ou service role) peut lire son quota
  IF auth.uid() IS NOT NULL AND auth.uid() <> v_uid THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_used
  FROM public.stores
  WHERE user_id = v_uid;

  v_max := public.get_user_max_stores(v_uid);

  RETURN jsonb_build_object(
    'max_stores', v_max,
    'used_stores', v_used,
    'remaining_stores', CASE
      WHEN v_max IS NULL THEN NULL
      ELSE GREATEST(v_max - v_used, 0)
    END,
    'can_create', (v_max IS NULL OR v_used < v_max)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_max_stores(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_store_quota(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_store_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  store_count INTEGER;
  max_allowed INTEGER;
BEGIN
  SELECT COUNT(*) INTO store_count
  FROM public.stores
  WHERE user_id = NEW.user_id;

  max_allowed := public.get_user_max_stores(NEW.user_id);

  IF max_allowed IS NOT NULL AND store_count >= max_allowed THEN
    RAISE EXCEPTION
      'Limite de % boutique(s) atteinte pour votre plan. Supprimez une boutique ou passez à un plan supérieur.',
      max_allowed
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.check_store_limit() IS
  'Limite boutiques par utilisateur selon plans d''abonnement (get_user_max_stores).';

COMMENT ON FUNCTION public.get_user_store_quota(UUID) IS
  'Quota boutiques : max / used / remaining / can_create pour l''UI.';

COMMIT;
