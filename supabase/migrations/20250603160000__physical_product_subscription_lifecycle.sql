-- Audit P2 : cycle de vie abonnements produits physiques (client → produit)

BEGIN;

CREATE OR REPLACE FUNCTION public.process_physical_product_subscription_lifecycle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_to_past_due integer := 0;
  v_to_expired integer := 0;
  v_to_cancelled integer := 0;
BEGIN
  UPDATE public.physical_product_subscriptions pps
  SET
    status = 'past_due',
    failed_payment_attempts = COALESCE(pps.failed_payment_attempts, 0) + 1,
    updated_at = now(),
    metadata = COALESCE(pps.metadata, '{}'::jsonb) || jsonb_build_object(
      'lifecycle', 'period_ended',
      'marked_past_due_at', now()
    )
  WHERE pps.status IN ('active', 'trialing')
    AND pps.current_period_end < now()
    AND (
      pps.status <> 'trialing'
      OR pps.trial_end IS NULL
      OR pps.trial_end < now()
    )
    AND COALESCE(pps.cancel_at_period_end, false) = false;
  GET DIAGNOSTICS v_to_past_due = ROW_COUNT;

  UPDATE public.physical_product_subscriptions pps
  SET
    status = 'cancelled',
    cancelled_at = COALESCE(pps.cancelled_at, now()),
    updated_at = now(),
    metadata = COALESCE(pps.metadata, '{}'::jsonb) || jsonb_build_object(
      'lifecycle', 'cancel_at_period_end',
      'cancelled_at', now()
    )
  WHERE pps.status IN ('active', 'trialing')
    AND pps.current_period_end < now()
    AND pps.cancel_at_period_end = true;
  GET DIAGNOSTICS v_to_cancelled = ROW_COUNT;

  UPDATE public.physical_product_subscriptions pps
  SET
    status = 'expired',
    updated_at = now(),
    metadata = COALESCE(pps.metadata, '{}'::jsonb) || jsonb_build_object(
      'lifecycle', 'grace_elapsed',
      'expired_at', now()
    )
  WHERE pps.status = 'past_due'
    AND pps.current_period_end < (now() - interval '7 days');
  GET DIAGNOSTICS v_to_expired = ROW_COUNT;

  RETURN jsonb_build_object(
    'marked_past_due', v_to_past_due,
    'marked_cancelled', v_to_cancelled,
    'marked_expired', v_to_expired,
    'processed_at', now()
  );
END;
$$;

COMMENT ON FUNCTION public.process_physical_product_subscription_lifecycle() IS
  'Passe les abonnements produits physiques en past_due, cancelled (fin de période) ou expired.';

GRANT EXECUTE ON FUNCTION public.process_physical_product_subscription_lifecycle() TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-physical-product-subscriptions') THEN
      PERFORM cron.unschedule('process-physical-product-subscriptions');
    END IF;

    PERFORM cron.schedule(
      'process-physical-product-subscriptions',
      '30 3 * * *',
      $cmd$SELECT public.process_physical_product_subscription_lifecycle();$cmd$
    );
  END IF;
END $$;

COMMIT;
