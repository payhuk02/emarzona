-- Audit P2 : RLS fichiers digitaux, cycle de vie abonnements physiques (plateforme)

BEGIN;

-- =========================================================
-- digital_product_files : retirer accès public SELECT
-- =========================================================

DROP POLICY IF EXISTS "Digital files viewable by everyone" ON public.digital_product_files;

DROP POLICY IF EXISTS "Users view purchased files" ON public.digital_product_files;
CREATE POLICY "Users view purchased files"
  ON public.digital_product_files
  FOR SELECT
  TO authenticated
  USING (
    is_preview = TRUE
    OR requires_purchase = FALSE
    OR EXISTS (
      SELECT 1
      FROM public.digital_licenses dl
      LEFT JOIN public.orders o ON o.id = dl.order_id
      WHERE dl.digital_product_id = digital_product_files.digital_product_id
        AND dl.status IN ('active', 'pending')
        AND dl.user_id = auth.uid()
        AND (
          o.id IS NULL
          OR (
            o.payment_status = 'paid'
            AND public.is_order_paid_for_revenue(o.status, o.payment_status)
          )
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.order_items oi
      INNER JOIN public.orders o ON o.id = oi.order_id
      INNER JOIN public.customers c ON c.id = o.customer_id
      INNER JOIN public.digital_products dp ON dp.product_id = oi.product_id
      WHERE dp.id = digital_product_files.digital_product_id
        AND o.payment_status = 'paid'
        AND public.is_order_paid_for_revenue(o.status, o.payment_status)
        AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Store owners view digital product files" ON public.digital_product_files;
CREATE POLICY "Store owners view digital product files"
  ON public.digital_product_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.digital_products dp
      INNER JOIN public.products p ON p.id = dp.product_id
      INNER JOIN public.stores s ON s.id = p.store_id
      WHERE dp.id = digital_product_files.digital_product_id
        AND s.user_id = auth.uid()
    )
  );

-- =========================================================
-- Abonnements boutique physique (store_platform_subscriptions)
-- =========================================================

CREATE OR REPLACE FUNCTION public.process_store_platform_subscription_lifecycle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_to_past_due integer := 0;
  v_to_expired integer := 0;
BEGIN
  -- Essai ou période payée terminée → past_due (paiement attendu)
  UPDATE public.store_platform_subscriptions sps
  SET
    status = 'past_due',
    updated_at = now(),
    metadata = COALESCE(sps.metadata, '{}'::jsonb) || jsonb_build_object(
      'lifecycle', 'trial_or_period_ended',
      'marked_past_due_at', now()
    )
  WHERE sps.status IN ('active', 'trialing')
    AND sps.current_period_end IS NOT NULL
    AND sps.current_period_end < now()
    AND (
      sps.status <> 'trialing'
      OR sps.trial_ends_at IS NULL
      OR sps.trial_ends_at < now()
    );
  GET DIAGNOSTICS v_to_past_due = ROW_COUNT;

  -- Grace 7 jours après échéance → expired
  UPDATE public.store_platform_subscriptions sps
  SET
    status = 'expired',
    updated_at = now(),
    metadata = COALESCE(sps.metadata, '{}'::jsonb) || jsonb_build_object(
      'lifecycle', 'grace_period_elapsed',
      'expired_at', now()
    )
  WHERE sps.status = 'past_due'
    AND sps.current_period_end IS NOT NULL
    AND sps.current_period_end < (now() - interval '7 days');
  GET DIAGNOSTICS v_to_expired = ROW_COUNT;

  RETURN jsonb_build_object(
    'marked_past_due', v_to_past_due,
    'marked_expired', v_to_expired,
    'processed_at', now()
  );
END;
$$;

COMMENT ON FUNCTION public.process_store_platform_subscription_lifecycle() IS
  'Passe les abonnements physiques plateforme en past_due puis expired (cron quotidien).';

GRANT EXECUTE ON FUNCTION public.process_store_platform_subscription_lifecycle() TO service_role;

-- Cron quotidien si pg_cron disponible
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-store-platform-subscriptions') THEN
      PERFORM cron.unschedule('process-store-platform-subscriptions');
    END IF;

    PERFORM cron.schedule(
      'process-store-platform-subscriptions',
      '15 3 * * *',
      $cmd$SELECT public.process_store_platform_subscription_lifecycle();$cmd$
    );
  END IF;
END $$;

COMMIT;
