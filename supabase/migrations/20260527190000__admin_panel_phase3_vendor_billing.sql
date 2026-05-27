-- Admin panel phase 3 — Abonnement requis uniquement pour e-commerce "produits physiques"
-- Les autres systèmes (digital, services, cours, œuvres) restent au modèle commission 10% par vente réussie.
-- Tables: platform_vendor_plans, store_platform_subscriptions

BEGIN;

-- Dépendance phase 2 (idempotent si déjà appliquée)
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
    WHERE p.id = auth.uid()
      AND (
        COALESCE(p.is_super_admin, false) = true
        OR p.role IN ('admin', 'staff', 'manager', 'support', 'viewer')
      )
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

-- ---------------------------------------------------------------------------
-- Plans SaaS vendeurs (Emarzona → boutique)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_vendor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  applies_to_product_type TEXT NOT NULL DEFAULT 'physical'
    CHECK (applies_to_product_type IN ('physical')),
  trial_days INTEGER NOT NULL DEFAULT 30 CHECK (trial_days >= 0),
  monthly_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_price >= 0),
  yearly_price NUMERIC(12, 2) CHECK (yearly_price IS NULL OR yearly_price >= 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  max_products INTEGER,
  max_staff INTEGER,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_vendor_plans_active
  ON public.platform_vendor_plans(is_active, display_order)
  WHERE is_active = true;

COMMENT ON TABLE public.platform_vendor_plans IS
  'Plans d’abonnement requis pour activer l’e-commerce de produits physiques.';

-- ---------------------------------------------------------------------------
-- Abonnement boutique → plateforme
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_platform_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.platform_vendor_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'trialing', 'active', 'past_due', 'cancelled', 'expired'
  )),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  mrr_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (mrr_amount >= 0),
  payment_provider TEXT,
  external_subscription_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_platform_subs_plan
  ON public.store_platform_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_store_platform_subs_status
  ON public.store_platform_subscriptions(status);

COMMENT ON TABLE public.store_platform_subscriptions IS
  'Abonnement SaaS d''une boutique à la plateforme Emarzona.';

-- ---------------------------------------------------------------------------
-- Seed plans
-- ---------------------------------------------------------------------------
INSERT INTO public.platform_vendor_plans (
  slug, name, description, applies_to_product_type, trial_days, monthly_price, yearly_price,
  max_products, max_staff, features, display_order
) VALUES
  (
    'physical_basic',
    'Physique — Basic',
    'Abonnement requis pour vendre des produits physiques.',
    'physical',
    30,
    7500, 0,
    NULL, NULL,
    '["Produits physiques", "Essai 30 jours"]'::jsonb,
    0
  ),
  (
    'physical_standard',
    'Physique — Standard',
    'Abonnement requis pour vendre des produits physiques.',
    'physical',
    30,
    12500, 0,
    NULL, NULL,
    '["Produits physiques", "Essai 30 jours"]'::jsonb,
    1
  ),
  (
    'physical_premium',
    'Physique — Premium',
    'Abonnement requis pour vendre des produits physiques.',
    'physical',
    30,
    15000, 0,
    NULL, NULL,
    '["Produits physiques", "Essai 30 jours"]'::jsonb,
    2
  )
ON CONFLICT (slug) DO NOTHING;

-- Backfill : une souscription physique "trialing" par boutique existante
INSERT INTO public.store_platform_subscriptions (
  store_id, plan_id, status, billing_cycle, mrr_amount, trial_ends_at, current_period_start, current_period_end
)
SELECT
  s.id,
  p.id,
  'trialing',
  'monthly',
  0,
  now() + (p.trial_days || ' days')::interval,
  now(),
  now() + interval '30 days'
FROM public.stores s
CROSS JOIN public.platform_vendor_plans p
WHERE p.slug = 'physical_basic'
  AND NOT EXISTS (
    SELECT 1 FROM public.store_platform_subscriptions sp WHERE sp.store_id = s.id
  );

-- Sync MRR depuis le plan (monthly_price)
UPDATE public.store_platform_subscriptions sp
SET mrr_amount = CASE
  WHEN sp.billing_cycle = 'yearly' THEN COALESCE(p.yearly_price, 0) / 12
  ELSE p.monthly_price
END
FROM public.platform_vendor_plans p
WHERE sp.plan_id = p.id;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.platform_vendor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_platform_subscriptions ENABLE ROW LEVEL SECURITY;

-- Plans publics actifs (vendeurs + anon pour page pricing future)
DROP POLICY IF EXISTS "Anyone can view active vendor plans" ON public.platform_vendor_plans;
CREATE POLICY "Anyone can view active vendor plans"
  ON public.platform_vendor_plans FOR SELECT
  TO authenticated, anon
  USING (is_active = true AND is_public = true);

DROP POLICY IF EXISTS "Platform admins manage vendor plans" ON public.platform_vendor_plans;
CREATE POLICY "Platform admins manage vendor plans"
  ON public.platform_vendor_plans FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Vendeur : sa propre souscription
DROP POLICY IF EXISTS "Store owners view own platform subscription" ON public.store_platform_subscriptions;
CREATE POLICY "Store owners view own platform subscription"
  ON public.store_platform_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_platform_subscriptions.store_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Platform admins view all store platform subscriptions" ON public.store_platform_subscriptions;
CREATE POLICY "Platform admins view all store platform subscriptions"
  ON public.store_platform_subscriptions FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins update store platform subscriptions" ON public.store_platform_subscriptions;
CREATE POLICY "Platform admins update store platform subscriptions"
  ON public.store_platform_subscriptions FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

COMMIT;
