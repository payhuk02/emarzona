-- E50 Moon 6 — API rate limits, RGPD, fraud scoring, multi-boutiques

-- ---------------------------------------------------------------------------
-- 6.1 — Rate limits API par plan physique
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_store_id UUID,
  p_api_key_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INT;
  v_count INT;
BEGIN
  SELECT CASE
    WHEN public.store_has_physical_feature(p_store_id, 'audit.export') THEN 300
    WHEN public.store_has_physical_feature(p_store_id, 'api.public') THEN 120
    ELSE 60
  END INTO v_limit;

  SELECT COUNT(*)::INT INTO v_count
  FROM public.api_request_logs
  WHERE store_id = p_store_id
    AND created_at >= now() - interval '1 minute'
    AND (p_api_key_id IS NULL OR api_key_id = p_api_key_id);

  RETURN v_count < v_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_api_rate_limit(UUID, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.get_api_rate_limit_for_store(p_store_id UUID)
RETURNS INT AS $$
BEGIN
  RETURN CASE
    WHEN public.store_has_physical_feature(p_store_id, 'audit.export') THEN 300
    WHEN public.store_has_physical_feature(p_store_id, 'api.public') THEN 120
    ELSE 60
  END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_api_rate_limit_for_store(UUID) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6.2 — RGPD : demandes suppression compte + DPA
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_deletion_requests_user_pending
  ON public.account_deletion_requests(user_id)
  WHERE status IN ('pending', 'processing');

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Users manage own deletion requests"
  ON public.account_deletion_requests FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Admins view deletion requests"
  ON public.account_deletion_requests FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.request_account_deletion(p_reason TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT id INTO v_id
  FROM public.account_deletion_requests
  WHERE user_id = auth.uid()
    AND status IN ('pending', 'processing')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.account_deletion_requests (user_id, reason)
  VALUES (auth.uid(), NULLIF(trim(p_reason), ''))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.request_account_deletion(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6.4 — Fraud scoring checkout (heuristiques)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.checkout_fraud_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  amount NUMERIC(14, 2),
  currency TEXT DEFAULT 'XOF',
  risk_score INT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'blocked')),
  flags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_fraud_assessments_created
  ON public.checkout_fraud_assessments(created_at DESC);

ALTER TABLE public.checkout_fraud_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own fraud assessments" ON public.checkout_fraud_assessments;
CREATE POLICY "Users view own fraud assessments"
  ON public.checkout_fraud_assessments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.assess_checkout_fraud_risk(
  p_email TEXT,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'XOF',
  p_ip_hint TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_score INT := 0;
  v_flags TEXT[] := ARRAY[]::TEXT[];
  v_level TEXT := 'low';
  v_block BOOLEAN := false;
  v_recent_orders INT;
  v_user_id UUID := auth.uid();
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    v_score := v_score + 5;
    v_flags := array_append(v_flags, 'invalid_amount');
  END IF;

  IF p_amount >= 5000000 THEN
    v_score := v_score + 25;
    v_flags := array_append(v_flags, 'high_amount');
  END IF;

  IF p_email IS NULL OR p_email !~* '^[^@]+@[^@]+\.[^@]+$' THEN
    v_score := v_score + 15;
    v_flags := array_append(v_flags, 'invalid_email');
  ELSIF p_email ~* '(tempmail|mailinator|guerrillamail|10minutemail)' THEN
    v_score := v_score + 40;
    v_flags := array_append(v_flags, 'disposable_email');
  END IF;

  IF v_user_id IS NOT NULL THEN
    SELECT COUNT(*)::INT INTO v_recent_orders
    FROM public.orders o
    WHERE o.customer_id = v_user_id
      AND o.created_at >= now() - interval '1 hour';

    IF v_recent_orders >= 5 THEN
      v_score := v_score + 30;
      v_flags := array_append(v_flags, 'velocity_orders');
    END IF;
  ELSE
    v_score := v_score + 10;
    v_flags := array_append(v_flags, 'guest_checkout');
  END IF;

  v_score := LEAST(v_score, 100);

  IF v_score >= 75 THEN
    v_level := 'blocked';
    v_block := true;
  ELSIF v_score >= 50 THEN
    v_level := 'high';
  ELSIF v_score >= 25 THEN
    v_level := 'medium';
  END IF;

  INSERT INTO public.checkout_fraud_assessments (user_id, email, amount, currency, risk_score, risk_level, flags)
  VALUES (v_user_id, lower(trim(p_email)), p_amount, COALESCE(p_currency, 'XOF'), v_score, v_level, v_flags);

  RETURN jsonb_build_object(
    'score', v_score,
    'level', v_level,
    'flags', to_jsonb(v_flags),
    'block', v_block
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.assess_checkout_fraud_risk(TEXT, NUMERIC, TEXT, TEXT) TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- 6.5 — Organisations multi-boutiques (Enterprise)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_store_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.store_organizations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_store_links_store
  ON public.organization_store_links(store_id);

ALTER TABLE public.store_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_store_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org owners manage organizations" ON public.store_organizations;
CREATE POLICY "Org owners manage organizations"
  ON public.store_organizations FOR ALL TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_platform_admin())
  WITH CHECK (owner_user_id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS "Org members view links" ON public.organization_store_links;
CREATE POLICY "Org members view links"
  ON public.organization_store_links FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_organizations o
      WHERE o.id = organization_store_links.organization_id
        AND (o.owner_user_id = auth.uid() OR public.is_platform_admin())
    )
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = organization_store_links.store_id AND s.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.list_user_store_organizations()
RETURNS JSONB AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row ORDER BY row->>'name')
    FROM (
      SELECT jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'store_count', (
          SELECT COUNT(*) FROM public.organization_store_links l WHERE l.organization_id = o.id
        ),
        'stores', (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'store_id', s.id,
            'store_name', s.name,
            'store_slug', s.slug,
            'role', l.role
          )), '[]'::jsonb)
          FROM public.organization_store_links l
          JOIN public.stores s ON s.id = l.store_id
          WHERE l.organization_id = o.id
        )
      ) AS row
      FROM public.store_organizations o
      WHERE o.owner_user_id = auth.uid()
    ) q
  ), '[]'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.list_user_store_organizations() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_store_organization(
  p_name TEXT,
  p_store_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
  v_slug TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'name_required';
  END IF;

  IF p_store_id IS NOT NULL THEN
    IF NOT public.store_has_physical_feature(p_store_id, 'audit.export') THEN
      RAISE EXCEPTION 'plan_required';
    END IF;
  END IF;

  v_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));

  INSERT INTO public.store_organizations (name, owner_user_id, slug)
  VALUES (trim(p_name), auth.uid(), v_slug)
  RETURNING id INTO v_org_id;

  IF p_store_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = p_store_id AND s.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'store_access_denied';
    END IF;

    INSERT INTO public.organization_store_links (organization_id, store_id, role)
    VALUES (v_org_id, p_store_id, 'owner');
  END IF;

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_store_organization(TEXT, UUID) TO authenticated;
