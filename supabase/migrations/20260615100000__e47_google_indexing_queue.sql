-- E47 Epic 5.2 — File Google Indexing API (soumission URLs sitemap)

CREATE TABLE IF NOT EXISTS public.google_indexing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  url_type TEXT NOT NULL DEFAULT 'URL_UPDATED'
    CHECK (url_type IN ('URL_UPDATED', 'URL_DELETED')),
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  google_response JSONB,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_indexing_queue_status_created
  ON public.google_indexing_queue(status, created_at ASC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_google_indexing_queue_url_active
  ON public.google_indexing_queue(url)
  WHERE status IN ('pending', 'processing');

ALTER TABLE public.google_indexing_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins manage indexing queue" ON public.google_indexing_queue;
CREATE POLICY "Platform admins manage indexing queue"
  ON public.google_indexing_queue FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Enqueue URL (idempotent si déjà pending/processing)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_google_indexing(
  p_url TEXT,
  p_url_type TEXT DEFAULT 'URL_UPDATED',
  p_store_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_url IS NULL OR length(trim(p_url)) = 0 THEN
    RAISE EXCEPTION 'url required';
  END IF;

  SELECT id INTO v_id
  FROM public.google_indexing_queue
  WHERE url = trim(p_url)
    AND status IN ('pending', 'processing')
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.google_indexing_queue (url, url_type, store_id)
  VALUES (trim(p_url), COALESCE(p_url_type, 'URL_UPDATED'), p_store_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.enqueue_google_indexing(TEXT, TEXT, UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- Claim batch pour worker edge (cron)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_google_indexing_batch(p_limit INT DEFAULT 25)
RETURNS SETOF public.google_indexing_queue AS $$
BEGIN
  RETURN QUERY
  UPDATE public.google_indexing_queue q
  SET status = 'processing',
      attempts = q.attempts + 1,
      updated_at = now()
  WHERE q.id IN (
    SELECT id FROM public.google_indexing_queue
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT GREATEST(p_limit, 1)
    FOR UPDATE SKIP LOCKED
  )
  RETURNING q.*;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.claim_google_indexing_batch(INT) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_google_indexing(
  p_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL,
  p_response JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.google_indexing_queue
  SET status = CASE WHEN p_success THEN 'done' ELSE 'failed' END,
      last_error = p_error,
      google_response = p_response,
      submitted_at = CASE WHEN p_success THEN now() ELSE submitted_at END,
      updated_at = now()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.complete_google_indexing(UUID, BOOLEAN, TEXT, JSONB) TO service_role;

-- Enqueue sitemap URLs actives (cron hebdo)
CREATE OR REPLACE FUNCTION public.enqueue_active_store_sitemaps(p_limit INT DEFAULT 200)
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_row RECORD;
  v_base TEXT := 'https://myemarzona.shop';
BEGIN
  FOR v_row IN
    SELECT s.subdomain, s.slug
    FROM public.stores s
    WHERE s.is_active = true
    ORDER BY s.updated_at DESC NULLS LAST
    LIMIT GREATEST(p_limit, 1)
  LOOP
    PERFORM public.enqueue_google_indexing(
      v_base || '/' || COALESCE(v_row.subdomain, v_row.slug) || '/sitemap.xml',
      'URL_UPDATED',
      NULL
    );
    v_count := v_count + 1;
  END LOOP;

  FOR v_row IN
    SELECT cd.domain
    FROM public.custom_domains cd
    WHERE cd.status = 'active'
    ORDER BY cd.updated_at DESC NULLS LAST
    LIMIT GREATEST(p_limit, 1)
  LOOP
    PERFORM public.enqueue_google_indexing(
      'https://' || v_row.domain || '/sitemap.xml',
      'URL_UPDATED',
      NULL
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.enqueue_active_store_sitemaps(INT) TO service_role;
