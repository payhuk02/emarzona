-- Expose landing platform hero background image to anonymous visitors (public landing).

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
BEGIN
  SELECT settings INTO full_settings
  FROM public.platform_settings
  WHERE key = 'customization';

  IF full_settings IS NULL THEN
    RETURN jsonb_build_object('pages', '{}'::jsonb);
  END IF;

  pages := COALESCE(full_settings -> 'pages', '{}'::jsonb);
  landing_platform_hero := NULLIF(trim(full_settings #>> '{media,images,landingPlatformHero}'), '');

  IF landing_platform_hero IS NULL THEN
    RETURN jsonb_build_object('pages', pages);
  END IF;

  RETURN jsonb_build_object(
    'pages', pages,
    'media', jsonb_build_object(
      'images', jsonb_build_object(
        'landingPlatformHero', landing_platform_hero
      )
    )
  );
END;
$$;

COMMENT ON FUNCTION public.get_public_platform_customization() IS
'Retourne pages.* et media.images.landingPlatformHero (sans secrets) pour la landing publique.';

COMMIT;

NOTIFY pgrst, 'reload schema';
