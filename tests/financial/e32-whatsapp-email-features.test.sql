-- Epic 3.2 E32: WhatsApp Starter + emailing Professional + conversion_rate SQL
DO $$
BEGIN
  ASSERT to_regclass('public.physical_products') IS NOT NULL;
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'physical_products'
      AND column_name = 'whatsapp_number'
  );
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'physical_products'
      AND column_name = 'whatsapp_enabled'
  );
  RAISE NOTICE '✓ E32: physical_products whatsapp columns';
END $$;

DO $$
DECLARE
  v_config jsonb;
BEGIN
  v_config := public.get_public_whatsapp_config();
  ASSERT v_config ? 'click_url_base';
  ASSERT (v_config ->> 'click_url_base') LIKE 'https://wa.me%';
  RAISE NOTICE '✓ E32: get_public_whatsapp_config default wa.me';
END $$;

DO $$
DECLARE
  v_limits jsonb;
  v_store_id UUID;
BEGIN
  SELECT s.id INTO v_store_id
  FROM public.stores s
  JOIN public.store_platform_subscriptions sub ON sub.store_id = s.id
  JOIN public.platform_vendor_plans p ON p.id = sub.plan_id
  WHERE p.slug = 'physical_basic'
    AND sub.status IN ('active', 'trialing')
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE NOTICE '⊘ E32 plan matrix skipped: no physical_basic store';
    RETURN;
  END IF;

  v_limits := public.get_store_physical_plan_limits(v_store_id);
  ASSERT (v_limits -> 'features' ->> 'whatsapp.product_button')::boolean IS TRUE;
  ASSERT (v_limits -> 'features' ->> 'emails.manage')::boolean IS FALSE;
  RAISE NOTICE '✓ E32: Starter has WhatsApp, not emails';
END $$;

DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1
    FROM pg_proc p
    WHERE p.proname = 'calculate_product_analytics'
      AND pg_get_functiondef(p.oid) LIKE '%conversion_rate%'
  );
  RAISE NOTICE '✓ E32: calculate_product_analytics includes conversion_rate';
END $$;
