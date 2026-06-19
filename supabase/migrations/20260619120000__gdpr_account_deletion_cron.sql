-- Phase 2 audit — Cron RGPD : purge automatique des comptes après période de grâce
-- Complète request_account_deletion (E50) avec traitement batch quotidien.

BEGIN;

-- ---------------------------------------------------------------------------
-- Paramètre de rétention configurable (platform_settings ou défaut 30 jours)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_gdpr_deletion_grace_days()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    7,
    LEAST(
      90,
      COALESCE(
        (
          SELECT (settings->>'gdpr_deletion_grace_days')::INT
          FROM public.platform_settings
          WHERE key = 'compliance'
          LIMIT 1
        ),
        30
      )
    )
  );
$$;

COMMENT ON FUNCTION public.get_gdpr_deletion_grace_days IS
  'Délai de grâce RGPD (jours) avant purge auto. Clé platform_settings.compliance.gdpr_deletion_grace_days, défaut 30, bornes 7–90.';

GRANT EXECUTE ON FUNCTION public.get_gdpr_deletion_grace_days() TO service_role;

-- ---------------------------------------------------------------------------
-- Cibles éligibles (hors vendeurs avec boutique, hors super-admins)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_pending_account_deletion_targets(
  p_grace_days INT DEFAULT NULL,
  p_batch_limit INT DEFAULT 10
)
RETURNS TABLE (
  request_id UUID,
  user_id UUID,
  user_email TEXT,
  requested_at TIMESTAMPTZ,
  requires_manual_review BOOLEAN,
  manual_review_reason TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_grace INT;
  v_limit INT;
BEGIN
  v_grace := COALESCE(NULLIF(p_grace_days, 0), public.get_gdpr_deletion_grace_days());
  v_limit := GREATEST(1, LEAST(COALESCE(p_batch_limit, 10), 50));

  RETURN QUERY
  SELECT
    r.id AS request_id,
    r.user_id,
    u.email::TEXT AS user_email,
    r.requested_at,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.stores s WHERE s.user_id = r.user_id) THEN TRUE
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = r.user_id AND COALESCE(p.is_super_admin, FALSE) = TRUE
    ) THEN TRUE
    ELSE FALSE
  END AS requires_manual_review,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.stores s WHERE s.user_id = r.user_id) THEN 'active_stores'
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = r.user_id AND COALESCE(p.is_super_admin, FALSE) = TRUE
    ) THEN 'platform_admin'
    ELSE NULL
  END AS manual_review_reason
  FROM public.account_deletion_requests r
  INNER JOIN auth.users u ON u.id = r.user_id
  WHERE r.status = 'pending'
    AND r.requested_at <= now() - make_interval(days => v_grace)
  ORDER BY r.requested_at ASC
  LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_pending_account_deletion_targets(INT, INT) TO service_role;

-- ---------------------------------------------------------------------------
-- Marquer une demande en cours de traitement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_account_deletion_processing(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.account_deletion_requests
  SET
    status = 'processing',
    metadata = metadata || jsonb_build_object('processing_started_at', now())
  WHERE id = p_request_id
    AND status = 'pending';

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_account_deletion_processing(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- Anonymisation PII (conservation des enregistrements légaux : commandes, factures)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.anonymize_user_pii_for_deletion(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT;
  v_redacted_email TEXT;
  v_cart_deleted INT := 0;
  v_drafts_deleted INT := 0;
  v_customers_anonymized INT := 0;
  v_fraud_anonymized INT := 0;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  v_redacted_email := 'deleted+' || p_user_id::TEXT || '@redacted.emarzona.local';

  -- Panier et brouillons
  DELETE FROM public.cart_items WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_cart_deleted = ROW_COUNT;

  DELETE FROM public.user_drafts WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_drafts_deleted = ROW_COUNT;

  -- Profil public
  UPDATE public.profiles
  SET
    display_name = 'Utilisateur supprimé',
    first_name = NULL,
    last_name = NULL,
    phone = NULL,
    bio = NULL,
    avatar_url = NULL,
    website = NULL,
    location = NULL,
    digital_preferences = '{}'::jsonb,
    referral_code = NULL,
    referred_by = NULL,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Clients acheteurs liés par email (anonymisation, pas suppression — obligations comptables)
  IF v_email IS NOT NULL THEN
    UPDATE public.customers
    SET
      email = v_redacted_email,
      name = 'Utilisateur supprimé',
      full_name = 'Utilisateur supprimé',
      phone = NULL,
      address = NULL,
      city = NULL,
      country = NULL,
      notes = NULL,
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('gdpr_anonymized', TRUE),
      updated_at = now()
    WHERE lower(email) = lower(v_email);
    GET DIAGNOSTICS v_customers_anonymized = ROW_COUNT;
  END IF;

  -- Évaluations fraude checkout
  UPDATE public.checkout_fraud_assessments
  SET
    user_id = NULL,
    email = v_redacted_email
  WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_fraud_anonymized = ROW_COUNT;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'cart_items_deleted', v_cart_deleted,
    'drafts_deleted', v_drafts_deleted,
    'customers_anonymized', v_customers_anonymized,
    'fraud_assessments_anonymized', v_fraud_anonymized,
    'anonymized_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.anonymize_user_pii_for_deletion(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- Finaliser ou échouer une demande
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_account_deletion_request(
  p_request_id UUID,
  p_summary JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.account_deletion_requests
  SET
    status = 'completed',
    processed_at = now(),
    metadata = metadata || jsonb_build_object('completion_summary', p_summary, 'completed_at', now())
  WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_account_deletion_request(UUID, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.fail_account_deletion_request(
  p_request_id UUID,
  p_error TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.account_deletion_requests
  SET
    status = 'pending',
    metadata = metadata || jsonb_build_object(
      'last_error', left(p_error, 500),
      'last_failed_at', now(),
      'retry_count', COALESCE((metadata->>'retry_count')::INT, 0) + 1
    )
  WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fail_account_deletion_request(UUID, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.flag_account_deletion_manual_review(
  p_request_id UUID,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.account_deletion_requests
  SET metadata = metadata || jsonb_build_object(
    'requires_manual_review', TRUE,
    'manual_review_reason', p_reason,
    'flagged_at', now()
  )
  WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.flag_account_deletion_manual_review(UUID, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- pg_cron — traitement quotidien 03:00 UTC
-- SELECT public.setup_account_deletion_cron_job('<project_ref>', '<CRON_SECRET>');
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.setup_account_deletion_cron_job(
  p_project_ref TEXT,
  p_cron_secret TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
  v_url TEXT;
  v_job_id BIGINT;
BEGIN
  IF p_project_ref IS NULL OR length(trim(p_project_ref)) = 0 THEN
    RAISE EXCEPTION 'p_project_ref is required';
  END IF;
  IF p_cron_secret IS NULL OR length(trim(p_cron_secret)) < 16 THEN
    RAISE EXCEPTION 'p_cron_secret must be at least 16 characters';
  END IF;

  v_url := format(
    'https://%s.supabase.co/functions/v1/process-account-deletions',
    trim(p_project_ref)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gdpr-account-deletion-daily') THEN
    PERFORM cron.unschedule('gdpr-account-deletion-daily');
  END IF;

  SELECT cron.schedule(
    'gdpr-account-deletion-daily',
    '0 3 * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := '{}'::jsonb
      ) AS request_id;
      $cmd$,
      v_url,
      p_cron_secret
    )
  ) INTO v_job_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'job_id', v_job_id,
    'job_name', 'gdpr-account-deletion-daily',
    'schedule', '0 3 * * *',
    'edge_url', v_url,
    'grace_days_default', public.get_gdpr_deletion_grace_days()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.setup_account_deletion_cron_job(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_account_deletion_cron_job(TEXT, TEXT) TO service_role;

COMMIT;
