-- Allow complete store deletion for owners/admins.
-- Fixes NO ACTION FKs that block DELETE on stores, then provides a SECURITY DEFINER RPC
-- that also cleans orphan tables (orders/customers have store_id but no FK to stores).

-- 1) Loyalty FKs → CASCADE (were NO ACTION and blocked store delete)
ALTER TABLE public.loyalty_transactions
  DROP CONSTRAINT IF EXISTS loyalty_transactions_store_id_fkey;
ALTER TABLE public.loyalty_transactions
  ADD CONSTRAINT loyalty_transactions_store_id_fkey
  FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.loyalty_rules
  DROP CONSTRAINT IF EXISTS loyalty_rules_store_id_fkey;
ALTER TABLE public.loyalty_rules
  ADD CONSTRAINT loyalty_rules_store_id_fkey
  FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.loyalty_tiers
  DROP CONSTRAINT IF EXISTS loyalty_tiers_store_id_fkey;
ALTER TABLE public.loyalty_tiers
  ADD CONSTRAINT loyalty_tiers_store_id_fkey
  FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- Tier refs on profiles should not block tier (hence store) deletion
ALTER TABLE public.user_loyalty_profiles
  DROP CONSTRAINT IF EXISTS user_loyalty_profiles_current_tier_id_fkey;
ALTER TABLE public.user_loyalty_profiles
  ADD CONSTRAINT user_loyalty_profiles_current_tier_id_fkey
  FOREIGN KEY (current_tier_id) REFERENCES public.loyalty_tiers(id) ON DELETE SET NULL;

-- 2) Order/customer child FKs that were NO ACTION
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_clicks_order_id_fkey'
  ) THEN
    ALTER TABLE public.affiliate_clicks DROP CONSTRAINT affiliate_clicks_order_id_fkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'affiliate_clicks' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE public.affiliate_clicks
      ADD CONSTRAINT affiliate_clicks_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'version_download_logs_customer_id_fkey'
  ) THEN
    ALTER TABLE public.version_download_logs DROP CONSTRAINT version_download_logs_customer_id_fkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'version_download_logs' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.version_download_logs
      ADD CONSTRAINT version_download_logs_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'download_tokens_customer_id_fkey'
  ) THEN
    ALTER TABLE public.download_tokens DROP CONSTRAINT download_tokens_customer_id_fkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'download_tokens' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.download_tokens
      ADD CONSTRAINT download_tokens_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'download_logs_customer_id_fkey'
  ) THEN
    ALTER TABLE public.download_logs DROP CONSTRAINT download_logs_customer_id_fkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'download_logs' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.download_logs
      ADD CONSTRAINT download_logs_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3) Complete store deletion RPC
CREATE OR REPLACE FUNCTION public.delete_store_completely(p_store_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_is_admin BOOLEAN := false;
  v_orders_deleted INTEGER := 0;
  v_customers_deleted INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT user_id INTO v_owner_id
  FROM public.stores
  WHERE id = p_store_id
  FOR UPDATE;

  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Boutique introuvable');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  -- Owner only (or platform admin). Team members cannot permanently wipe a store.
  IF v_owner_id <> auth.uid() AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- orders / customers have store_id but no FK to stores → clean explicitly
  DELETE FROM public.affiliate_clicks
  WHERE order_id IN (SELECT id FROM public.orders WHERE store_id = p_store_id);

  DELETE FROM public.version_download_logs
  WHERE customer_id IN (SELECT id FROM public.customers WHERE store_id = p_store_id);

  DELETE FROM public.download_tokens
  WHERE customer_id IN (SELECT id FROM public.customers WHERE store_id = p_store_id);

  DELETE FROM public.download_logs
  WHERE customer_id IN (SELECT id FROM public.customers WHERE store_id = p_store_id);

  WITH deleted AS (
    DELETE FROM public.orders WHERE store_id = p_store_id RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_orders_deleted FROM deleted;

  WITH deleted AS (
    DELETE FROM public.customers WHERE store_id = p_store_id RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_customers_deleted FROM deleted;

  -- Cascades products, loyalty, appearance, email, etc.
  DELETE FROM public.stores WHERE id = p_store_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Échec de la suppression de la boutique');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'orders_deleted', v_orders_deleted,
    'customers_deleted', v_customers_deleted
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_store_completely(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_store_completely(UUID)
  TO postgres, service_role, authenticated;

NOTIFY pgrst, 'reload schema';
