-- P0 — store_has_physical_feature must include Enterprise keys (post 20260717180000)

DO $$
DECLARE
  v_def TEXT;
BEGIN
  SELECT pg_get_functiondef(p.oid)
  INTO v_def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'store_has_physical_feature'
  LIMIT 1;

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'store_has_physical_feature missing';
  END IF;

  IF v_def NOT LIKE '%api.public%' THEN
    RAISE EXCEPTION 'store_has_physical_feature missing api.public case';
  END IF;

  IF v_def NOT LIKE '%team.sso%' THEN
    RAISE EXCEPTION 'store_has_physical_feature missing team.sso case';
  END IF;

  IF v_def NOT LIKE '%audit.export%' THEN
    RAISE EXCEPTION 'store_has_physical_feature missing audit.export case';
  END IF;

  IF v_def NOT LIKE '%store_uses_physical_ecommerce%' THEN
    RAISE EXCEPTION 'store_has_physical_feature missing non-physical emails bypass';
  END IF;

  RAISE NOTICE '✓ E51: Enterprise feature keys present in store_has_physical_feature';
END $$;
