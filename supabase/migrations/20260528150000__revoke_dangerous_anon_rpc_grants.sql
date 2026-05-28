-- Étape A: retirer GRANT anon dangereux + verrouiller RPC admin/cron et recommandations utilisateur.

-- ---------------------------------------------------------------------------
-- 1. Cron email tags — admin/staff uniquement
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status() FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_email_tags_cron_job(TEXT, BOOLEAN) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status_safe() FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_email_tags_cron_job_safe(TEXT, BOOLEAN) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status_safe() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.toggle_email_tags_cron_job_safe(TEXT, BOOLEAN) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.get_email_tags_cron_jobs_status_safe()
RETURNS TABLE (
  job_name TEXT,
  schedule TEXT,
  command TEXT,
  active BOOLEAN,
  last_run TIMESTAMPTZ,
  last_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cron, public
AS $$
DECLARE
  config_record RECORD;
  cron_job_record RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'staff')
  ) THEN
    RAISE EXCEPTION 'forbidden: admin or staff required';
  END IF;

  FOR config_record IN
    SELECT * FROM public.email_tags_cron_jobs_config
    ORDER BY job_name
  LOOP
    BEGIN
      SELECT
        j.jobname::TEXT,
        j.schedule::TEXT,
        LEFT(j.command::TEXT, 200) AS command_preview,
        j.active,
        latest_run.start_time AS last_run,
        latest_run.status AS last_status
      INTO cron_job_record
      FROM cron.job j
      LEFT JOIN LATERAL (
        SELECT start_time, status
        FROM cron.job_run_details
        WHERE jobid = j.jobid
        ORDER BY start_time DESC
        LIMIT 1
      ) latest_run ON TRUE
      WHERE j.jobname = config_record.job_name
      LIMIT 1;

      IF cron_job_record.jobname IS NOT NULL THEN
        RETURN QUERY
        SELECT
          cron_job_record.jobname,
          cron_job_record.schedule,
          cron_job_record.command_preview,
          cron_job_record.active,
          cron_job_record.last_run,
          cron_job_record.last_status;
      ELSE
        RETURN QUERY
        SELECT
          config_record.job_name,
          config_record.schedule,
          'N/A'::TEXT,
          config_record.active,
          NULL::TIMESTAMPTZ,
          NULL::TEXT;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN QUERY
        SELECT
          config_record.job_name,
          config_record.schedule,
          'N/A'::TEXT,
          config_record.active,
          NULL::TIMESTAMPTZ,
          NULL::TEXT;
    END;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status_safe() TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_email_tags_cron_job_safe(
  p_job_name TEXT,
  p_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cron, public
AS $$
DECLARE
  v_user_id UUID;
  v_allowed BOOLEAN := false;
  v_updated_count INTEGER := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_user_id
      AND p.role IN ('admin', 'staff')
  ) THEN
    RAISE EXCEPTION 'forbidden: admin or staff required';
  END IF;

  v_allowed := p_job_name IN (
    'cleanup-expired-email-tags',
    'cleanup-unused-email-tags',
    'update-segment-member-counts'
  );

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'invalid_job_name: %', p_job_name;
  END IF;

  BEGIN
    UPDATE cron.job
    SET active = p_active
    WHERE jobname = p_job_name;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count > 0 THEN
      UPDATE public.email_tags_cron_jobs_config
      SET
        active = p_active,
        last_updated_at = now(),
        updated_by = v_user_id
      WHERE job_name = p_job_name;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      UPDATE public.email_tags_cron_jobs_config
      SET
        active = p_active,
        last_updated_at = now(),
        updated_by = v_user_id
      WHERE job_name = p_job_name;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'cron_job_not_found: %', p_job_name;
      END IF;
  END;

  IF v_updated_count = 0 THEN
    UPDATE public.email_tags_cron_jobs_config
    SET
      active = p_active,
      last_updated_at = now(),
      updated_by = v_user_id
    WHERE job_name = p_job_name;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'cron_job_not_found: %', p_job_name;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_email_tags_cron_job_safe(TEXT, BOOLEAN) TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can read cron jobs config" ON public.email_tags_cron_jobs_config;
DROP POLICY IF EXISTS "Authenticated users can update cron jobs config" ON public.email_tags_cron_jobs_config;

CREATE POLICY "Staff can read cron jobs config"
  ON public.email_tags_cron_jobs_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff can update cron jobs config"
  ON public.email_tags_cron_jobs_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'staff')
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Recommandations — pas de lecture cross-user via anon
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.get_user_product_recommendations(UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.find_similar_users(UUID, INTEGER, UUID, INTEGER) FROM anon;

-- Garde auth sur get_user_product_recommendations (corps inchangé sauf user_id effectif)
CREATE OR REPLACE FUNCTION public.get_user_product_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_slug TEXT,
  store_id UUID,
  store_name TEXT,
  store_slug TEXT,
  image_url TEXT,
  price NUMERIC,
  promotional_price NUMERIC,
  currency TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  purchases_count INTEGER,
  recommendation_score NUMERIC,
  recommendation_reason TEXT,
  recommendation_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchased_categories TEXT[];
  v_purchased_tags TEXT[];
  v_has_orders BOOLEAN := FALSE;
  v_effective_user_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  v_effective_user_id := COALESCE(p_user_id, auth.uid());

  IF v_effective_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: cannot read another user recommendations';
  END IF;

  BEGIN
    SELECT
      ARRAY_AGG(DISTINCT p.category) FILTER (WHERE p.category IS NOT NULL),
      ARRAY_AGG(DISTINCT tag) FILTER (WHERE tag IS NOT NULL),
      COUNT(*) > 0
    INTO v_purchased_categories, v_purchased_tags, v_has_orders
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    INNER JOIN products p ON p.id = oi.product_id
    CROSS JOIN LATERAL unnest(COALESCE(p.tags, ARRAY[]::TEXT[])) tag
    WHERE o.customer_id = v_effective_user_id
      AND o.payment_status = 'paid'
    LIMIT 100;

    IF v_purchased_categories IS NOT NULL AND array_length(v_purchased_categories, 1) > 0 THEN
      v_has_orders := TRUE;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_has_orders := FALSE;
      v_purchased_categories := NULL;
      v_purchased_tags := NULL;
  END;

  IF NOT v_has_orders OR v_purchased_categories IS NULL OR array_length(v_purchased_categories, 1) IS NULL THEN
    RETURN QUERY
    SELECT
      p.id,
      p.name,
      p.slug,
      p.store_id,
      s.name,
      s.slug,
      p.image_url,
      p.price,
      p.promotional_price,
      p.currency,
      p.category,
      p.product_type,
      p.rating,
      p.reviews_count,
      COALESCE(p.purchases_count, 0),
      (COALESCE(p.purchases_count, 0) * 0.5 + COALESCE(p.rating, 0) * 10)::NUMERIC,
      'Produit populaire',
      'popular'
    FROM products p
    INNER JOIN stores s ON s.id = p.store_id
    WHERE p.is_active = true
      AND p.is_draft = false
    ORDER BY COALESCE(p.purchases_count, 0) DESC, COALESCE(p.rating, 0) DESC NULLS LAST
    LIMIT p_limit;
    RETURN;
  END IF;

  RETURN QUERY
  WITH scored_products AS (
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.slug AS product_slug,
      p.store_id,
      s.name AS store_name,
      s.slug AS store_slug,
      p.image_url,
      p.price,
      p.promotional_price,
      p.currency,
      p.category,
      p.product_type,
      p.rating,
      p.reviews_count,
      COALESCE(p.purchases_count, 0) AS purchases_count,
      (
        CASE WHEN p.category = ANY(v_purchased_categories) THEN 50 ELSE 0 END +
        CASE
          WHEN v_purchased_tags IS NOT NULL AND p.tags IS NOT NULL THEN
            LEAST((SELECT COUNT(*) * 10 FROM unnest(v_purchased_tags) tag WHERE tag = ANY(p.tags)), 30)
          ELSE 0
        END +
        CASE
          WHEN COALESCE(p.purchases_count, 0) > 100 THEN 20
          WHEN COALESCE(p.purchases_count, 0) > 50 THEN 15
          WHEN COALESCE(p.purchases_count, 0) > 10 THEN 10
          ELSE 0
        END
      )::NUMERIC AS recommendation_score,
      'Basé sur vos achats précédents' AS recommendation_reason,
      'purchase_history' AS recommendation_type
    FROM products p
    INNER JOIN stores s ON s.id = p.store_id
    WHERE p.is_active = true
      AND p.is_draft = false
      AND (
        p.category = ANY(v_purchased_categories)
        OR (
          v_purchased_tags IS NOT NULL
          AND p.tags IS NOT NULL
          AND (SELECT COUNT(*) FROM unnest(v_purchased_tags) tag WHERE tag = ANY(p.tags)) > 0
        )
      )
  )
  SELECT
    sp.product_id,
    sp.product_name,
    sp.product_slug,
    sp.store_id,
    sp.store_name,
    sp.store_slug,
    sp.image_url,
    sp.price,
    sp.promotional_price,
    sp.currency,
    sp.category,
    sp.product_type,
    sp.rating,
    sp.reviews_count,
    sp.purchases_count,
    sp.recommendation_score,
    sp.recommendation_reason,
    sp.recommendation_type
  FROM scored_products sp
  WHERE sp.recommendation_score > 0
  ORDER BY sp.recommendation_score DESC, sp.purchases_count DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_product_recommendations(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.get_user_product_recommendations(UUID, INTEGER) IS
  'Recommandations personnalisées. Requiert auth; p_user_id doit correspondre à auth.uid().';
