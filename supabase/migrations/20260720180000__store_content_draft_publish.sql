-- Sprint 5: draft/publish pour SEO, marketing et pages légales (miroir apparence).

BEGIN;

-- Colonnes SEO live (idempotent si déjà présentes)
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
  ADD COLUMN IF NOT EXISTS og_title TEXT,
  ADD COLUMN IF NOT EXISTS og_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS seo_draft JSONB,
  ADD COLUMN IF NOT EXISTS marketing_content_draft JSONB,
  ADD COLUMN IF NOT EXISTS legal_pages_draft JSONB,
  ADD COLUMN IF NOT EXISTS seo_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS legal_published_at TIMESTAMPTZ;

COMMENT ON COLUMN public.stores.seo_draft IS
  'Brouillon SEO (meta/og) non visible sur le storefront public.';
COMMENT ON COLUMN public.stores.marketing_content_draft IS
  'Brouillon marketing_content JSONB non visible publiquement.';
COMMENT ON COLUMN public.stores.legal_pages_draft IS
  'Brouillon legal_pages JSONB non visible publiquement.';

UPDATE public.stores
SET
  seo_published_at = COALESCE(seo_published_at, updated_at, created_at, now()),
  marketing_published_at = COALESCE(marketing_published_at, updated_at, created_at, now()),
  legal_published_at = COALESCE(legal_published_at, updated_at, created_at, now())
WHERE seo_published_at IS NULL
   OR marketing_published_at IS NULL
   OR legal_published_at IS NULL;

CREATE OR REPLACE FUNCTION public.save_store_content_draft(
  p_store_id UUID,
  p_domain TEXT,
  p_draft JSONB
)
RETURNS public.stores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store public.stores;
  v_domain TEXT := lower(trim(p_domain));
BEGIN
  IF NOT public.has_store_permission(p_store_id, auth.uid(), 'settings.manage') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_domain NOT IN ('seo', 'marketing', 'legal') THEN
    RAISE EXCEPTION 'Invalid content domain: %', p_domain;
  END IF;

  IF v_domain = 'seo' THEN
    UPDATE public.stores
    SET
      seo_draft = p_draft,
      updated_at = now()
    WHERE id = p_store_id
    RETURNING * INTO v_store;
  ELSIF v_domain = 'marketing' THEN
    UPDATE public.stores
    SET
      marketing_content_draft = p_draft,
      updated_at = now()
    WHERE id = p_store_id
    RETURNING * INTO v_store;
  ELSE
    UPDATE public.stores
    SET
      legal_pages_draft = p_draft,
      updated_at = now()
    WHERE id = p_store_id
    RETURNING * INTO v_store;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  RETURN v_store;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_store_content(
  p_store_id UUID,
  p_domain TEXT
)
RETURNS public.stores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store public.stores;
  v_domain TEXT := lower(trim(p_domain));
  v_draft JSONB;
BEGIN
  IF NOT public.has_store_permission(p_store_id, auth.uid(), 'settings.manage') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_domain NOT IN ('seo', 'marketing', 'legal') THEN
    RAISE EXCEPTION 'Invalid content domain: %', p_domain;
  END IF;

  SELECT * INTO v_store FROM public.stores WHERE id = p_store_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  IF v_domain = 'seo' THEN
    v_draft := v_store.seo_draft;
    IF v_draft IS NULL THEN
      UPDATE public.stores
      SET seo_published_at = now(), updated_at = now()
      WHERE id = p_store_id
      RETURNING * INTO v_store;
      RETURN v_store;
    END IF;

    UPDATE public.stores
    SET
      meta_title = NULLIF(v_draft->>'meta_title', ''),
      meta_description = NULLIF(v_draft->>'meta_description', ''),
      meta_keywords = NULLIF(v_draft->>'meta_keywords', ''),
      og_title = NULLIF(v_draft->>'og_title', ''),
      og_description = NULLIF(v_draft->>'og_description', ''),
      og_image = NULLIF(v_draft->>'og_image', ''),
      seo_draft = NULL,
      seo_published_at = now(),
      updated_at = now()
    WHERE id = p_store_id
    RETURNING * INTO v_store;

  ELSIF v_domain = 'marketing' THEN
    v_draft := v_store.marketing_content_draft;
    IF v_draft IS NULL THEN
      UPDATE public.stores
      SET marketing_published_at = now(), updated_at = now()
      WHERE id = p_store_id
      RETURNING * INTO v_store;
      RETURN v_store;
    END IF;

    UPDATE public.stores
    SET
      marketing_content = v_draft,
      marketing_content_draft = NULL,
      marketing_published_at = now(),
      updated_at = now()
    WHERE id = p_store_id
    RETURNING * INTO v_store;

  ELSE
    v_draft := v_store.legal_pages_draft;
    IF v_draft IS NULL THEN
      UPDATE public.stores
      SET legal_published_at = now(), updated_at = now()
      WHERE id = p_store_id
      RETURNING * INTO v_store;
      RETURN v_store;
    END IF;

    UPDATE public.stores
    SET
      legal_pages = v_draft,
      legal_pages_draft = NULL,
      legal_published_at = now(),
      updated_at = now()
    WHERE id = p_store_id
    RETURNING * INTO v_store;
  END IF;

  RETURN v_store;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_store_content_draft(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_store_content(UUID, TEXT) TO authenticated;

COMMIT;
