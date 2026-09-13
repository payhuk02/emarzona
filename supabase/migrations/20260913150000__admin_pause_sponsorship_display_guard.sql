-- Admin pause/resume sponsorship + display only from live active campaigns
-- (ignore denormalized products.sponsored_until for badge / sponsored_only).

-- 1) Allow status = paused
ALTER TABLE public.marketplace_sponsorships
  DROP CONSTRAINT IF EXISTS marketplace_sponsorships_status_check;

ALTER TABLE public.marketplace_sponsorships
  ADD CONSTRAINT marketplace_sponsorships_status_check
  CHECK (
    status IN (
      'pending_payment',
      'active',
      'paused',
      'expired',
      'cancelled',
      'rejected'
    )
  );

-- 2) Cancel may also terminate a paused campaign
CREATE OR REPLACE FUNCTION public.cancel_marketplace_sponsorship(p_sponsorship_id UUID)
RETURNS public.marketplace_sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.marketplace_sponsorships;
  v_uid UUID := auth.uid();
BEGIN
  SELECT * INTO v_row
  FROM public.marketplace_sponsorships
  WHERE id = p_sponsorship_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF NOT public.is_platform_admin()
     AND (v_uid IS NULL OR NOT public.is_store_member(v_row.store_id, v_uid)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_row.status NOT IN ('pending_payment', 'active', 'paused') THEN
    RAISE EXCEPTION 'Cannot cancel sponsorship in status %', v_row.status;
  END IF;

  UPDATE public.marketplace_sponsorships
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- 3) Admin: pause (désactiver) an active campaign — reversible
CREATE OR REPLACE FUNCTION public.admin_pause_marketplace_sponsorship(p_sponsorship_id UUID)
RETURNS public.marketplace_sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.marketplace_sponsorships;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_row
  FROM public.marketplace_sponsorships
  WHERE id = p_sponsorship_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF v_row.status = 'paused' THEN
    RETURN v_row;
  END IF;

  IF v_row.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Cannot pause sponsorship in status %', v_row.status;
  END IF;

  UPDATE public.marketplace_sponsorships
  SET status = 'paused', updated_at = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- 4) Admin: resume paused → active (or expire if window ended)
CREATE OR REPLACE FUNCTION public.admin_resume_marketplace_sponsorship(p_sponsorship_id UUID)
RETURNS public.marketplace_sponsorships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.marketplace_sponsorships;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_row
  FROM public.marketplace_sponsorships
  WHERE id = p_sponsorship_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Sponsorship not found';
  END IF;

  IF v_row.status = 'active' THEN
    RETURN v_row;
  END IF;

  IF v_row.status IS DISTINCT FROM 'paused' THEN
    RAISE EXCEPTION 'Cannot resume sponsorship in status %', v_row.status;
  END IF;

  IF v_row.ends_at IS NULL OR now() >= v_row.ends_at THEN
    UPDATE public.marketplace_sponsorships
    SET status = 'expired', updated_at = now()
    WHERE id = p_sponsorship_id
    RETURNING * INTO v_row;
    RETURN v_row;
  END IF;

  UPDATE public.marketplace_sponsorships
  SET
    status = 'active',
    starts_at = COALESCE(v_row.starts_at, now()),
    updated_at = now()
  WHERE id = p_sponsorship_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_pause_marketplace_sponsorship(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resume_marketplace_sponsorship(UUID) TO authenticated;

-- Expire active OR paused campaigns past ends_at
CREATE OR REPLACE FUNCTION public.expire_marketplace_sponsorships()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_abandoned INTEGER := 0;
BEGIN
  WITH expired AS (
    UPDATE public.marketplace_sponsorships s
    SET status = 'expired', updated_at = now()
    WHERE s.status IN ('active', 'paused')
      AND s.ends_at IS NOT NULL
      AND s.ends_at <= now()
    RETURNING s.product_id
  )
  SELECT COUNT(*)::integer INTO v_count FROM expired;

  UPDATE public.marketplace_sponsorships s
  SET status = 'cancelled', updated_at = now()
  WHERE s.status = 'pending_payment'
    AND s.source = 'paid_boost'
    AND s.created_at < now() - INTERVAL '7 days';

  GET DIAGNOSTICS v_abandoned = ROW_COUNT;

  RETURN v_count + v_abandoned;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_marketplace_sponsorships() TO service_role;

-- 5) Display guard: is_sponsored / sponsored_only only from live active campaigns
CREATE OR REPLACE FUNCTION public.get_marketplace_products_filtered(
  p_limit INTEGER DEFAULT 24,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL,
  p_min_price DECIMAL DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL,
  p_min_rating DECIMAL DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_search_query TEXT DEFAULT NULL,
  p_featured_only BOOLEAN DEFAULT false,
  p_sponsored_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  short_description TEXT,
  price DECIMAL,
  promotional_price DECIMAL,
  currency TEXT,
  category TEXT,
  product_type TEXT,
  licensing_type TEXT,
  license_terms TEXT,
  is_featured BOOLEAN,
  is_sponsored BOOLEAN,
  rating DECIMAL,
  reviews_count INTEGER,
  purchases_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  image_url TEXT,
  tags TEXT[],
  store_id UUID,
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  commission_rate DECIMAL,
  affiliate_enabled BOOLEAN,
  payment_options JSONB,
  whatsapp_number TEXT,
  whatsapp_enabled BOOLEAN,
  pricing_type TEXT,
  fulfillment_mode TEXT,
  duration_minutes INTEGER,
  calendar_available BOOLEAN,
  requires_staff BOOLEAN,
  package_starting_price DECIMAL,
  category_attributes JSONB,
  active_sponsorship_id UUID,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.expire_marketplace_sponsorships();

  RETURN QUERY
  WITH filtered AS (
    SELECT
      m.*,
      (
        SELECT s.id
        FROM public.marketplace_sponsorships s
        WHERE s.product_id = m.id
          AND s.status = 'active'
          AND s.starts_at IS NOT NULL
          AND s.ends_at IS NOT NULL
          AND now() >= s.starts_at
          AND now() < s.ends_at
        ORDER BY s.starts_at ASC
        LIMIT 1
      ) AS active_sponsorship_id,
      (
        SELECT s.starts_at
        FROM public.marketplace_sponsorships s
        WHERE s.product_id = m.id
          AND s.status = 'active'
          AND s.starts_at IS NOT NULL
          AND s.ends_at IS NOT NULL
          AND now() >= s.starts_at
          AND now() < s.ends_at
        ORDER BY s.starts_at ASC
        LIMIT 1
      ) AS sponsored_at
    FROM marketplace_products_optimized m
    WHERE
      (p_product_type IS NULL OR p_product_type = 'all' OR m.product_type = p_product_type)
      AND (
        p_category IS NULL
        OR p_category = 'all'
        OR m.category = p_category
        OR EXISTS (
          SELECT 1
          FROM public.categories child
          JOIN public.categories parent ON child.parent_id = parent.id
          WHERE parent.slug = p_category
            AND child.slug = m.category
        )
      )
      AND (p_min_price IS NULL OR m.listing_price >= p_min_price)
      AND (p_max_price IS NULL OR m.listing_price <= p_max_price)
      AND (p_min_rating IS NULL OR m.sort_rating >= p_min_rating)
      AND (
        p_search_query IS NULL
        OR TRIM(p_search_query) = ''
        OR m.name ILIKE '%' || TRIM(p_search_query) || '%'
        OR m.description ILIKE '%' || TRIM(p_search_query) || '%'
      )
      AND (NOT p_featured_only OR m.is_featured = true)
      AND (
        NOT p_sponsored_only
        OR EXISTS (
          SELECT 1
          FROM public.marketplace_sponsorships s
          WHERE s.product_id = m.id
            AND s.status = 'active'
            AND s.starts_at IS NOT NULL
            AND s.ends_at IS NOT NULL
            AND now() >= s.starts_at
            AND now() < s.ends_at
        )
      )
  ),
  with_store_rank AS (
    SELECT
      f.*,
      CASE
        WHEN f.active_sponsorship_id IS NOT NULL THEN
          ROW_NUMBER() OVER (
            PARTITION BY f.store_id
            ORDER BY f.sponsored_at ASC NULLS LAST, f.created_at DESC
          )
        ELSE NULL
      END AS store_sponsored_rn
    FROM filtered f
  ),
  capped AS (
    SELECT
      w.*,
      CASE
        WHEN w.active_sponsorship_id IS NOT NULL
          AND COALESCE(w.store_sponsored_rn, 1) = 1 THEN true
        ELSE false
      END AS eligible_sponsored
    FROM with_store_rank w
  ),
  numbered AS (
    SELECT
      c.*,
      CASE
        WHEN c.eligible_sponsored THEN
          ROW_NUMBER() OVER (
            ORDER BY c.sponsored_at ASC NULLS LAST, c.created_at DESC
          )
        ELSE NULL
      END AS global_sponsored_rn
    FROM capped c
  ),
  ranked AS (
    SELECT
      n.*,
      CASE
        WHEN n.eligible_sponsored AND n.global_sponsored_rn <= 3 THEN true
        ELSE false
      END AS feed_sponsored
    FROM numbered n
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS cnt FROM ranked
  )
  SELECT
    r.id,
    r.name,
    r.slug,
    r.description,
    r.short_description,
    r.price,
    r.promotional_price,
    r.currency,
    r.category,
    r.product_type,
    r.licensing_type,
    r.license_terms,
    r.is_featured,
    (r.active_sponsorship_id IS NOT NULL) AS is_sponsored,
    r.rating,
    r.reviews_count,
    r.purchases_count,
    r.created_at,
    r.updated_at,
    r.image_url,
    r.tags,
    r.store_id,
    r.store_name,
    r.store_slug,
    r.store_logo_url,
    r.commission_rate,
    r.affiliate_enabled,
    r.payment_options,
    r.whatsapp_number,
    r.whatsapp_enabled,
    r.pricing_type,
    r.fulfillment_mode,
    r.duration_minutes,
    r.calendar_available,
    r.requires_staff,
    r.package_starting_price,
    r.category_attributes,
    r.active_sponsorship_id,
    c.cnt AS total_count
  FROM ranked r
  CROSS JOIN counted c
  ORDER BY
    r.feed_sponsored DESC,
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) = 'ASC' THEN r.listing_price END ASC,
    CASE WHEN p_sort_by = 'price' AND UPPER(p_sort_order) <> 'ASC' THEN r.listing_price END DESC,
    CASE WHEN p_sort_by = 'rating' AND UPPER(p_sort_order) = 'ASC' THEN r.sort_rating END ASC,
    CASE WHEN p_sort_by = 'rating' AND UPPER(p_sort_order) <> 'ASC' THEN r.sort_rating END DESC,
    CASE WHEN p_sort_by IN ('popular', 'sales_count') AND UPPER(p_sort_order) = 'ASC' THEN r.sort_purchases END ASC,
    CASE WHEN p_sort_by IN ('popular', 'sales_count') AND UPPER(p_sort_order) <> 'ASC' THEN r.sort_purchases END DESC,
    CASE WHEN p_sort_by = 'oldest' THEN r.created_at END ASC,
    CASE WHEN p_sort_by IN ('newest', 'created_at') OR p_sort_by IS NULL THEN r.created_at END DESC,
    r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_products_filtered(
  INTEGER, INTEGER, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN
) TO anon, authenticated;

COMMENT ON FUNCTION public.admin_pause_marketplace_sponsorship(UUID) IS
  'Platform admin: pause (deactivate) an active marketplace sponsorship; hidden from feed until resumed.';
COMMENT ON FUNCTION public.admin_resume_marketplace_sponsorship(UUID) IS
  'Platform admin: resume a paused sponsorship if still within ends_at; else mark expired.';
