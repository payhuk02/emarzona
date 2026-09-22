-- =============================================================================
-- Payhuk prod — expose landingSellWays on get_public_platform_customization
-- Coller tout ce fichier dans Supabase → SQL Editor → Run
-- =============================================================================

BEGIN;

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
  sell_ways jsonb;
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

  sell_ways := src_images -> 'landingSellWays';
  IF sell_ways IS NOT NULL
     AND jsonb_typeof(sell_ways) = 'object'
     AND sell_ways <> '{}'::jsonb THEN
    media_images := media_images || jsonb_build_object('landingSellWays', sell_ways);
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
'Retourne pages.* et media.images publics (authHero, landing heroes, carousel, sellWays…) sans secrets.';

GRANT EXECUTE ON FUNCTION public.get_public_platform_customization() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_platform_customization() TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Vérif rapide
SELECT get_public_platform_customization() -> 'media' -> 'images' -> 'landingSellWays' AS public_landing_sell_ways;
