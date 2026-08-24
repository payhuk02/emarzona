-- Checkout UI reads validate_unified_promotion as JSONB (PostgREST object).
-- Order RPCs did: SELECT * INTO rec FROM validate_unified_promotion(...); IF rec.valid THEN
-- For RETURNS JSONB, SELECT * yields a single jsonb column — rec.valid raises, EXCEPTION
-- WHEN OTHERS swallows it, so MoneyFusion is charged the undiscounted total (4690 vs 2395).
-- Wrap the JSONB implementation in a composite return so SELECT * INTO exposes .valid.

DO $$
BEGIN
  CREATE TYPE public.unified_promotion_result AS (
    valid boolean,
    error text,
    error_message text,
    promotion_id uuid,
    code text,
    name text,
    discount_type text,
    discount_value numeric,
    discount_amount numeric,
    order_total_before numeric,
    order_total_after numeric,
    min_amount numeric
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'validate_unified_promotion'
      AND pg_get_function_result(p.oid) IN ('jsonb', 'json')
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'validate_unified_promotion_jsonb'
  ) THEN
    ALTER FUNCTION public.validate_unified_promotion(
      TEXT, UUID, UUID[], UUID[], UUID[], NUMERIC, UUID, BOOLEAN
    ) RENAME TO validate_unified_promotion_jsonb;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.validate_unified_promotion(
  p_code TEXT,
  p_store_id UUID DEFAULT NULL,
  p_product_ids UUID[] DEFAULT NULL,
  p_category_ids UUID[] DEFAULT NULL,
  p_collection_ids UUID[] DEFAULT NULL,
  p_order_amount NUMERIC DEFAULT 0,
  p_customer_id UUID DEFAULT NULL,
  p_is_first_order BOOLEAN DEFAULT FALSE
)
RETURNS public.unified_promotion_result
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_populate_record(
    NULL::public.unified_promotion_result,
    public.validate_unified_promotion_jsonb(
      p_code,
      p_store_id,
      p_product_ids,
      p_category_ids,
      p_collection_ids,
      p_order_amount,
      p_customer_id,
      p_is_first_order
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.validate_unified_promotion(
  TEXT, UUID, UUID[], UUID[], UUID[], NUMERIC, UUID, BOOLEAN
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.validate_unified_promotion_jsonb(
  TEXT, UUID, UUID[], UUID[], UUID[], NUMERIC, UUID, BOOLEAN
) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.validate_unified_promotion(
  TEXT, UUID, UUID[], UUID[], UUID[], NUMERIC, UUID, BOOLEAN
) IS
  'Composite wrapper so checkout order RPCs can SELECT * INTO rec.valid / rec.discount_amount. Payload built by validate_unified_promotion_jsonb.';

NOTIFY pgrst, 'reload schema';
