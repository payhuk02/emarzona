-- Tarifs abonnement produits physiques en USD ($25 / $49 / $79)
-- Palettes Starter / Professional / Business + limites alignées

BEGIN;

UPDATE public.platform_vendor_plans
SET
  name = CASE slug
    WHEN 'physical_basic' THEN 'Physique — Starter'
    WHEN 'physical_standard' THEN 'Physique — Professional'
    WHEN 'physical_premium' THEN 'Physique — Business'
    ELSE name
  END,
  description = CASE slug
    WHEN 'physical_basic' THEN 'Starter — produits & commandes illimités, stock, domaine personnalisé ($25/mois).'
    WHEN 'physical_standard' THEN 'Professional — marketplace, SEO, email, rapports, multi-admins ($49/mois).'
    WHEN 'physical_premium' THEN 'Business — IA, automatisations, multi-entrepôts, support VIP ($79/mois).'
    ELSE description
  END,
  monthly_price = CASE slug
    WHEN 'physical_basic' THEN 25
    WHEN 'physical_standard' THEN 49
    WHEN 'physical_premium' THEN 79
    ELSE monthly_price
  END,
  currency = 'USD',
  max_products = NULL,
  max_variants_per_product = NULL,
  max_staff = CASE slug
    WHEN 'physical_basic' THEN 1
    WHEN 'physical_standard' THEN NULL
    ELSE NULL
  END,
  max_warehouses = CASE slug
    WHEN 'physical_premium' THEN NULL
    ELSE 0
  END,
  features = CASE slug
    WHEN 'physical_basic' THEN '[
      "Produits illimités",
      "Commandes illimitées",
      "Gestion du stock",
      "Domaine personnalisé",
      "Support standard"
    ]'::jsonb
    WHEN 'physical_standard' THEN '[
      "Tout Starter",
      "Sponsorisé sur le Marketplace",
      "SEO avancé",
      "Marketing par email",
      "Rapports avancés",
      "Plusieurs administrateurs",
      "Support prioritaire"
    ]'::jsonb
    WHEN 'physical_premium' THEN '[
      "Tout Professional",
      "IA avancée",
      "Recommandations AI",
      "Automatisations marketing",
      "Statistiques premium",
      "Multi-entrepôts",
      "Gestionnaire de compte dédié",
      "Support VIP"
    ]'::jsonb
    ELSE features
  END,
  updated_at = now()
WHERE slug IN ('physical_basic', 'physical_standard', 'physical_premium');

-- Sync MRR depuis les nouveaux prix USD
UPDATE public.store_platform_subscriptions sp
SET
  mrr_amount = CASE
    WHEN sp.billing_cycle = 'yearly' THEN COALESCE(p.yearly_price, 0) / 12
    ELSE p.monthly_price
  END,
  updated_at = now()
FROM public.platform_vendor_plans p
WHERE sp.plan_id = p.id
  AND p.slug IN ('physical_basic', 'physical_standard', 'physical_premium');

-- Proration upgrade : 2 décimales (USD)
CREATE OR REPLACE FUNCTION public.calculate_physical_plan_proration(
  p_store_id UUID,
  p_new_plan_slug TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.store_platform_subscriptions%ROWTYPE;
  v_old_plan public.platform_vendor_plans%ROWTYPE;
  v_new_plan public.platform_vendor_plans%ROWTYPE;
  v_old_rank INTEGER;
  v_new_rank INTEGER;
  v_change_type TEXT;
  v_days_remaining NUMERIC;
  v_days_in_period NUMERIC;
  v_prorated NUMERIC(12, 2);
  v_old_price NUMERIC(12, 2);
  v_new_price NUMERIC(12, 2);
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.is_platform_admin()
     AND NOT EXISTS (
       SELECT 1 FROM public.stores s
       WHERE s.id = p_store_id AND s.user_id = auth.uid()
     ) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT *
  INTO v_sub
  FROM public.store_platform_subscriptions
  WHERE store_id = p_store_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  SELECT *
  INTO v_old_plan
  FROM public.platform_vendor_plans
  WHERE id = v_sub.plan_id
  LIMIT 1;

  SELECT *
  INTO v_new_plan
  FROM public.platform_vendor_plans
  WHERE slug = p_new_plan_slug
    AND applies_to_product_type = 'physical'
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PLAN_NOT_FOUND';
  END IF;

  v_old_rank := public.physical_plan_rank(v_old_plan.slug);
  v_new_rank := public.physical_plan_rank(v_new_plan.slug);

  IF v_new_rank = v_old_rank THEN
    v_change_type := 'same';
  ELSIF v_new_rank > v_old_rank THEN
    v_change_type := 'upgrade';
  ELSE
    v_change_type := 'downgrade';
  END IF;

  v_old_price := v_old_plan.monthly_price;
  v_new_price := v_new_plan.monthly_price;

  IF v_sub.status = 'trialing' OR v_change_type = 'same' THEN
    RETURN jsonb_build_object(
      'change_type', v_change_type,
      'old_plan_slug', v_old_plan.slug,
      'new_plan_slug', v_new_plan.slug,
      'old_plan_name', v_old_plan.name,
      'new_plan_name', v_new_plan.name,
      'prorated_amount', 0,
      'currency', COALESCE(v_new_plan.currency, 'USD'),
      'days_remaining', 0,
      'days_in_period', 0,
      'effective', CASE
        WHEN v_change_type = 'same' THEN 'none'
        WHEN v_change_type = 'downgrade' THEN 'period_end'
        ELSE 'immediate'
      END,
      'requires_payment', false
    );
  END IF;

  v_days_remaining := GREATEST(
    0,
    EXTRACT(EPOCH FROM (v_sub.current_period_end - now())) / 86400.0
  );
  v_days_in_period := GREATEST(
    1,
    EXTRACT(EPOCH FROM (v_sub.current_period_end - v_sub.current_period_start)) / 86400.0
  );

  IF v_change_type = 'upgrade' THEN
    v_prorated := ROUND(
      (v_new_price - v_old_price) * (v_days_remaining / v_days_in_period),
      2
    );
    v_prorated := GREATEST(v_prorated, 0);
  ELSE
    v_prorated := 0;
  END IF;

  RETURN jsonb_build_object(
    'change_type', v_change_type,
    'old_plan_slug', v_old_plan.slug,
    'new_plan_slug', v_new_plan.slug,
    'old_plan_name', v_old_plan.name,
    'new_plan_name', v_new_plan.name,
    'prorated_amount', v_prorated,
    'currency', COALESCE(v_new_plan.currency, 'USD'),
    'days_remaining', floor(v_days_remaining),
    'days_in_period', floor(v_days_in_period),
    'effective', CASE
      WHEN v_change_type = 'upgrade' AND v_prorated > 0 THEN 'immediate'
      WHEN v_change_type = 'upgrade' THEN 'immediate'
      ELSE 'period_end'
    END,
    'requires_payment', v_change_type = 'upgrade' AND v_prorated > 0
  );
END;
$$;

COMMIT;
