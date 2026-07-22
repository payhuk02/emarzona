-- Idempotent patches applied after prod schema dump on E2E.
-- pg_dump --no-privileges + trigger/function ordering can leave this RPC missing while
-- trg_seed_store_notification_settings on public.stores still exists.
-- Serialize parallel Playwright jobs that apply this file concurrently.
SELECT pg_advisory_lock(87201419);

CREATE OR REPLACE FUNCTION public.get_or_create_store_notification_settings(p_store_id UUID)
RETURNS public.store_notification_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.store_notification_settings;
BEGIN
  SELECT * INTO v_settings
  FROM public.store_notification_settings
  WHERE store_id = p_store_id;

  IF v_settings IS NULL THEN
    INSERT INTO public.store_notification_settings (store_id)
    VALUES (p_store_id)
    RETURNING * INTO v_settings;
  END IF;

  RETURN v_settings;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_store_notification_settings_on_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.get_or_create_store_notification_settings(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_store_notification_settings ON public.stores;
CREATE TRIGGER trg_seed_store_notification_settings
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_store_notification_settings_on_create();

GRANT EXECUTE ON FUNCTION public.get_or_create_store_notification_settings(UUID) TO postgres, service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_store_notification_settings_on_create() TO postgres, service_role;

-- update_store_stats trigger expects denormalized counters on stores (not always in pg_dump order).
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS total_orders INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue NUMERIC NOT NULL DEFAULT 0;

-- service_products.store_id required by E2E seeds + RLS (older service_products DDL lacked it).
ALTER TABLE public.service_products
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

UPDATE public.service_products sp
SET store_id = p.store_id
FROM public.products p
WHERE sp.product_id = p.id
  AND sp.store_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_products_store_id ON public.service_products(store_id);

-- physical_products.store_id required by mixed-cart E2E seeds (PostgREST schema cache).
ALTER TABLE public.physical_products
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

UPDATE public.physical_products pp
SET store_id = p.store_id
FROM public.products p
WHERE pp.product_id = p.id
  AND pp.store_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_physical_products_store_id ON public.physical_products(store_id);

-- Idempotent DDL callable from CI verify (service_role) without a separate patches-only run.
CREATE OR REPLACE FUNCTION public.e2e_apply_schema_patches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS total_orders INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_revenue NUMERIC NOT NULL DEFAULT 0;

  ALTER TABLE public.service_products
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

  UPDATE public.service_products sp
  SET store_id = p.store_id
  FROM public.products p
  WHERE sp.product_id = p.id
    AND sp.store_id IS NULL;

  ALTER TABLE public.physical_products
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

  UPDATE public.physical_products pp
  SET store_id = p.store_id
  FROM public.products p
  WHERE pp.product_id = p.id
    AND pp.store_id IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.e2e_apply_schema_patches() TO service_role;

-- Mixed-cart / logged-in service booking (bypass hanging edge function)
GRANT EXECUTE ON FUNCTION public.reserve_service_booking(
  UUID, UUID, UUID, DATE, TIME, TIME, TEXT, INTEGER, INTEGER, TEXT
) TO authenticated, service_role;

-- Store wizard + create flow RPCs (pg_dump --no-privileges may omit EXECUTE for authenticated).
GRANT EXECUTE ON FUNCTION public.is_store_slug_available(text, uuid) TO authenticated, anon, service_role;

-- pg_dump --schema-only omits migration INSERT seeds (platform_vendor_plans, legal_documents).
INSERT INTO public.platform_vendor_plans (
  slug, name, description, applies_to_product_type, trial_days, monthly_price, yearly_price,
  max_products, max_staff, max_variants_per_product, max_warehouses, features, display_order
) VALUES
  (
    'physical_basic',
    'Physique — Basic',
    'Abonnement requis pour vendre des produits physiques.',
    'physical',
    30,
    7500, 0,
    50, NULL, 3, 0,
    '["Produits physiques", "Essai 30 jours"]'::jsonb,
    0
  ),
  (
    'physical_standard',
    'Physique — Standard',
    'Abonnement requis pour vendre des produits physiques.',
    'physical',
    30,
    12500, 0,
    200, NULL, 10, 1,
    '["Produits physiques", "Essai 30 jours"]'::jsonb,
    1
  ),
  (
    'physical_premium',
    'Physique — Premium',
    'Abonnement requis pour vendre des produits physiques.',
    'physical',
    30,
    15000, 0,
    NULL, NULL, NULL, NULL,
    '["Produits physiques", "Essai 30 jours"]'::jsonb,
    2
  )
ON CONFLICT (slug) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  trial_days = EXCLUDED.trial_days,
  monthly_price = EXCLUDED.monthly_price,
  max_products = EXCLUDED.max_products,
  max_variants_per_product = EXCLUDED.max_variants_per_product,
  max_warehouses = EXCLUDED.max_warehouses,
  updated_at = now();

INSERT INTO public.legal_documents (
  document_type, version, language, title, content, effective_date, is_active
)
SELECT
  'terms-of-service',
  '1.0',
  'fr',
  'Conditions Générales de Vente E2E',
  'Contenu CGV minimal pour les tests E2E commerce.',
  now(),
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.legal_documents ld
  WHERE ld.document_type = 'terms-of-service'
    AND ld.language = 'fr'
    AND ld.version = '1.0'
);

-- Legal RPCs: app RequireTermsConsent + E2E seedTermsConsent must agree on doc type mapping.
CREATE OR REPLACE FUNCTION public.resolve_legal_document_type(p_type TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(trim(p_type))
    WHEN 'terms' THEN 'terms-of-service'
    WHEN 'privacy' THEN 'privacy-policy'
    WHEN 'cookies' THEN 'cookie-policy'
    WHEN 'refund' THEN 'refund-policy'
    ELSE lower(trim(p_type))
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_latest_legal_document(
  doc_type TEXT,
  doc_language TEXT DEFAULT 'fr'
)
RETURNS TABLE(
  id UUID,
  type TEXT,
  version TEXT,
  content TEXT,
  language TEXT,
  effective_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    lower(trim(doc_type)) AS type,
    d.version,
    d.content,
    d.language,
    d.effective_date
  FROM public.legal_documents d
  WHERE d.document_type = public.resolve_legal_document_type(doc_type)
    AND d.language = doc_language
    AND d.is_active = TRUE
  ORDER BY d.effective_date DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_user_consent(
  p_user_id UUID,
  p_document_type TEXT,
  p_document_version TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_consent_method TEXT DEFAULT 'settings'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consent_id UUID;
BEGIN
  INSERT INTO public.user_consents (
    user_id,
    document_type,
    document_version,
    ip_address,
    user_agent,
    consent_method
  ) VALUES (
    p_user_id,
    lower(trim(p_document_type)),
    p_document_version,
    p_ip_address,
    p_user_agent,
    COALESCE(p_consent_method, 'settings')
  )
  RETURNING id INTO v_consent_id;

  RETURN v_consent_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_legal_document_type(text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_latest_legal_document(text, text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.record_user_consent(uuid, text, text, text, text, text) TO authenticated, service_role;

-- Harden legacy inventory auto-create: physical_products.sku is nullable, inventory_items.sku is NOT NULL.
CREATE OR REPLACE FUNCTION public.create_inventory_item_for_product()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(NEW.track_inventory, true) = TRUE
     AND COALESCE(NEW.has_variants, false) = FALSE THEN
    INSERT INTO public.inventory_items (
      physical_product_id,
      sku,
      quantity_available
    ) VALUES (
      NEW.id,
      COALESCE(NULLIF(BTRIM(NEW.sku), ''), 'AUTO-' || NEW.id::text),
      0
    );
  END IF;
  RETURN NEW;
END;
$$;


-- Fix search_products after stores.logo_url drop (Sprint 3) so guest marketplace search works.
CREATE OR REPLACE FUNCTION public.search_products(
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  -- Nouveaux paramètres pour filtres artist
  p_artist_type TEXT DEFAULT NULL,
  p_edition_type TEXT DEFAULT NULL,
  p_certificate_of_authenticity BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  image_url TEXT,
  price NUMERIC,
  promotional_price NUMERIC,
  currency TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  purchases_count INTEGER,
  store_id UUID,
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  rank NUMERIC,
  match_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.description,
      p.image_url,
      p.price,
      p.promotional_price,
      p.currency,
      p.category,
      p.product_type,
      p.rating,
      p.reviews_count,
      p.purchases_count,
      p.store_id,
      s.name AS store_name,
      s.slug AS store_slug,
      sa.logo_url AS store_logo_url,
      -- Calcul du rank basé sur pertinence FTS
      ts_rank_cd(p.fts, plainto_tsquery('french', p_search_query)) AS rank,
      -- Type de match pour priorisation
      CASE
        WHEN p.name ILIKE '%' || p_search_query || '%' THEN 'exact_name'
        WHEN p.name ILIKE p_search_query || '%' THEN 'starts_with'
        WHEN p.fts @@ plainto_tsquery('french', p_search_query) THEN 'full_text'
        ELSE 'partial'
      END AS match_type
    FROM public.products p
    INNER JOIN public.stores s ON s.id = p.store_id
    LEFT JOIN public.store_appearance sa ON sa.store_id = s.id
    -- Jointure avec artist_products pour les filtres artist
    LEFT JOIN public.artist_products ap ON ap.product_id = p.id
    WHERE p.is_active = true
      AND p.is_draft = false
      AND (
        -- Recherche full-text
        p.fts @@ plainto_tsquery('french', p_search_query)
        OR
        -- Recherche par nom (similarité si pg_trgm disponible, sinon ILIKE)
        (
          (EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AND p.name % p_search_query)
          OR
          (NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AND p.name ILIKE '%' || p_search_query || '%')
        )
        OR
        -- Recherche par catégorie/tags
        p.category ILIKE '%' || p_search_query || '%'
        OR
        EXISTS (
          SELECT 1 FROM unnest(p.tags) tag
          WHERE tag ILIKE '%' || p_search_query || '%'
        )
        OR
        -- Recherche dans les données artist (nom d'artiste, titre d'œuvre)
        (ap.artist_name ILIKE '%' || p_search_query || '%')
        OR
        (ap.artwork_title ILIKE '%' || p_search_query || '%')
      )
      -- Filtres de base
      AND (p_category IS NULL OR p.category = p_category)
      AND (p_product_type IS NULL OR p.product_type = p_product_type)
      AND (p_min_price IS NULL OR COALESCE(p.promotional_price, p.price) >= p_min_price)
      AND (p_max_price IS NULL OR COALESCE(p.promotional_price, p.price) <= p_max_price)
      AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
      -- Filtres spécifiques Artist
      AND (
        p_product_type != 'artist'
        OR p_artist_type IS NULL
        OR ap.artist_type = p_artist_type
      )
      AND (
        p_product_type != 'artist'
        OR p_edition_type IS NULL
        OR ap.artwork_edition_type = p_edition_type
      )
      AND (
        p_product_type != 'artist'
        OR p_certificate_of_authenticity IS NULL
        OR ap.certificate_of_authenticity = p_certificate_of_authenticity
      )
  )
  SELECT 
    sr.id,
    sr.name,
    sr.slug,
    sr.description,
    sr.image_url,
    sr.price,
    sr.promotional_price,
    sr.currency,
    sr.category,
    sr.product_type,
    sr.rating,
    sr.reviews_count,
    sr.purchases_count,
    sr.store_id,
    sr.store_name,
    sr.store_slug,
    sr.store_logo_url,
    sr.rank,
    sr.match_type
  FROM search_results sr
  ORDER BY
    -- Prioriser les correspondances exactes
    CASE sr.match_type
      WHEN 'exact_name' THEN 1
      WHEN 'starts_with' THEN 2
      WHEN 'full_text' THEN 3
      ELSE 4
    END,
    sr.rank DESC,
    sr.purchases_count DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_products(TEXT, INTEGER, INTEGER, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, BOOLEAN) TO anon, authenticated, service_role;


-- stores_public readable by buyers + faster course auto-enroll user resolve
-- Vertical paid E2E: stores_public must be readable by buyers (not evaluate stores RLS as invoker).
-- Course auto-enroll: avoid full auth.users email scan (statement timeout under CI load).

ALTER VIEW public.stores_public SET (security_invoker = false);

CREATE OR REPLACE FUNCTION public.auto_enroll_course_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id UUID;
  v_product_id UUID;
  v_user_id UUID;
  v_customer RECORD;
  v_was_paid BOOLEAN;
  v_is_paid BOOLEAN;
BEGIN
  v_was_paid := COALESCE(OLD.payment_status, '') IN ('paid', 'completed');
  v_is_paid := NEW.payment_status IN ('paid', 'completed');

  IF NOT (v_is_paid AND NOT v_was_paid) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_customer FROM public.customers WHERE id = NEW.customer_id LIMIT 1;

  v_user_id := NULL;
  IF FOUND THEN
    -- Prefer customer.id when it is the auth user id (E2E + common seed pattern).
    IF EXISTS (SELECT 1 FROM auth.users au WHERE au.id = v_customer.id) THEN
      v_user_id := v_customer.id;
    ELSIF v_customer.metadata ? 'user_id'
          AND (v_customer.metadata->>'user_id') ~* '^[0-9a-f-]{36}$' THEN
      v_user_id := (v_customer.metadata->>'user_id')::uuid;
    ELSIF v_customer.email IS NOT NULL THEN
      SELECT au.id
      INTO v_user_id
      FROM auth.users au
      WHERE au.email = v_customer.email
      LIMIT 1;

      IF v_user_id IS NULL THEN
        SELECT au.id
        INTO v_user_id
        FROM auth.users au
        WHERE lower(trim(au.email)) = lower(trim(v_customer.email))
        LIMIT 1;
      END IF;
    END IF;
  END IF;

  FOR v_course_id, v_product_id IN
    SELECT c.id, c.product_id
    FROM public.order_items oi
    INNER JOIN public.courses c ON c.product_id = oi.product_id
    WHERE oi.order_id = NEW.id
  LOOP
    IF v_user_id IS NOT NULL THEN
      BEGIN
        PERFORM public.enroll_user_in_course(
          p_course_id := v_course_id,
          p_order_id := NEW.id,
          p_user_id := v_user_id
        );
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'auto_enroll_course_on_payment failed for order % course %: %',
            NEW.id, v_course_id, SQLERRM;
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_enroll_course_on_payment() IS
  'Auto-enroll on paid; resolve user via customers.id/metadata before auth.users email scan.';

-- Apply artist RPC optional-field fix (path relative to CWD = repo root in CI).
\i supabase/migrations/20260721154500__fix_artist_product_optional_validation.sql

-- Apply web analytics tables/RPCs without colliding with the existing
-- account-security public.user_sessions table.
\i supabase/scripts/apply-web-analytics-prod.sql

-- Ensure public checkout RPCs exist (SECURITY DEFINER — bypass RLS buyer insert).
-- Includes platform fee 2% + 100 XOF on digital/course/artist.
\i supabase/scripts/apply-public-order-rpcs-prod.sql

-- Platform fee on physical checkout RPC (+ apply_checkout_platform_fee helper).
\i supabase/migrations/20260722023000__checkout_platform_fee.sql

-- Hard-fail if the old year coercion (NULL → 0) is still present in the live function.
DO $$
DECLARE
  v_src TEXT;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_src
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'create_artist_product_tx'
  LIMIT 1;

  IF v_src IS NULL THEN
    RAISE EXCEPTION 'create_artist_product_tx missing after artist optional-field patch';
  END IF;

  IF v_src LIKE '%COALESCE((p_artist%artwork_year%)::INTEGER, 0)%'
     OR position('COALESCE((p_artist->>''artwork_year'')::INTEGER, 0)' in v_src) > 0 THEN
    RAISE EXCEPTION 'create_artist_product_tx still coerces artwork_year to 0';
  END IF;

  IF position('COALESCE(p_product->''tags'', ''[]''::jsonb)' in v_src) > 0 THEN
    RAISE EXCEPTION 'create_artist_product_tx still passes JSONB to products.tags TEXT[]';
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';

SELECT pg_advisory_unlock(87201419);