-- Expose landing platform hero left + right background images to anonymous visitors.

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
  landing_platform_hero text;
  landing_platform_hero_left text;
  media_images jsonb;
BEGIN
  SELECT settings INTO full_settings
  FROM public.platform_settings
  WHERE key = 'customization';

  IF full_settings IS NULL THEN
    RETURN jsonb_build_object('pages', '{}'::jsonb);
  END IF;

  pages := COALESCE(full_settings -> 'pages', '{}'::jsonb);
  landing_platform_hero := NULLIF(trim(full_settings #>> '{media,images,landingPlatformHero}'), '');
  landing_platform_hero_left := NULLIF(trim(full_settings #>> '{media,images,landingPlatformHeroLeft}'), '');

  media_images := '{}'::jsonb;

  IF landing_platform_hero IS NOT NULL THEN
    media_images := media_images || jsonb_build_object('landingPlatformHero', landing_platform_hero);
  END IF;

  IF landing_platform_hero_left IS NOT NULL THEN
    media_images := media_images || jsonb_build_object('landingPlatformHeroLeft', landing_platform_hero_left);
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
'Retourne pages.* et media.images.landingPlatformHero / landingPlatformHeroLeft (sans secrets) pour la landing publique.';

COMMIT;

NOTIFY pgrst, 'reload schema';
