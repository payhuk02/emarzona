-- Expose authHero + autres images publiques admin dans get_public_platform_customization
-- Rétention automatique platform_visitor_events (réduit Disk IO sur plan Free)

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Personnalisation publique — images whitelistées (pas de secrets)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_platform_customization()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_settings jsonb;
  pages jsonb;
  src_images jsonb;
  media_images jsonb := '{}'::jsonb;
  carousel jsonb;
  v_url text;
  v_key text;
BEGIN
  SELECT settings INTO full_settings
  FROM public.platform_settings
  WHERE key = 'customization';

  IF full_settings IS NULL THEN
    RETURN jsonb_build_object('pages', '{}'::jsonb);
  END IF;

  pages := COALESCE(full_settings -> 'pages', '{}'::jsonb);
  src_images := COALESCE(full_settings #> '{media,images}', '{}'::jsonb);

  FOREACH v_key IN ARRAY ARRAY[
    'authHero',
    'landingPlatformHero',
    'landingPlatformHeroLeft',
    'landingAdapt',
    'landingGlobe'
  ]
  LOOP
    v_url := NULLIF(trim(src_images ->> v_key), '');
    IF v_url IS NOT NULL THEN
      media_images := media_images || jsonb_build_object(v_key, v_url);
    END IF;
  END LOOP;

  carousel := src_images -> 'landingCarousel';
  IF carousel IS NOT NULL
     AND jsonb_typeof(carousel) = 'object'
     AND carousel <> '{}'::jsonb THEN
    media_images := media_images || jsonb_build_object('landingCarousel', carousel);
  END IF;

  IF media_images = '{}'::jsonb THEN
    RETURN jsonb_build_object('pages', pages);
  END IF;

  RETURN jsonb_build_object(
    'pages', pages,
    'media', jsonb_build_object('images', media_images)
  );
END;
$$;

COMMENT ON FUNCTION public.get_public_platform_customization() IS
'Retourne pages.* et media.images publics (authHero, landing heroes, carousel…) sans secrets.';

GRANT EXECUTE ON FUNCTION public.get_public_platform_customization() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_platform_customization() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Purge analytics visiteurs — lots de 10k pour limiter la pression Disk IO
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_platform_visitor_events(
  p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INTEGER;
  v_cutoff TIMESTAMPTZ;
  v_batch INTEGER;
  v_total INTEGER := 0;
BEGIN
  v_days := GREATEST(COALESCE(p_retention_days, 30), 7);
  v_cutoff := now() - (v_days || ' days')::interval;

  LOOP
    DELETE FROM public.platform_visitor_events e
    WHERE e.id IN (
      SELECT id
      FROM public.platform_visitor_events
      WHERE created_at < v_cutoff
      ORDER BY created_at ASC
      LIMIT 10000
    );

    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_total := v_total + v_batch;
    EXIT WHEN v_batch = 0;
  END LOOP;

  RETURN v_total;
END;
$$;

COMMENT ON FUNCTION public.cleanup_platform_visitor_events(INTEGER) IS
'Supprime les événements platform_visitor_events plus anciens que p_retention_days (min 7, défaut 30). Retourne le nombre de lignes supprimées.';

REVOKE ALL ON FUNCTION public.cleanup_platform_visitor_events(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_platform_visitor_events(INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Cron quotidien 04:30 UTC (pg_cron)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-platform-visitor-events') THEN
      PERFORM cron.unschedule('cleanup-platform-visitor-events');
    END IF;

    PERFORM cron.schedule(
      'cleanup-platform-visitor-events',
      '30 4 * * *',
      $cron$SELECT public.cleanup_platform_visitor_events(30);$cron$
    );
  ELSE
    RAISE NOTICE 'pg_cron indisponible — planifier manuellement cleanup_platform_visitor_events(30).';
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
