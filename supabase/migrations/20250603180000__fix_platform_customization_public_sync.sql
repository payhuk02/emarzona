-- Restaure la lecture réelle de platform_settings et expose les pages publiques (footer, marketing)
-- Corrige le stub introduit par 20260326000000 sur get_platform_customization()

-- Pages publiques (footer, landing premium, pages marketing) — accessible sans auth
CREATE OR REPLACE FUNCTION public.get_public_platform_customization()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_settings jsonb;
  pages jsonb;
BEGIN
  SELECT settings INTO full_settings
  FROM public.platform_settings
  WHERE key = 'customization';

  IF full_settings IS NULL THEN
    RETURN jsonb_build_object('pages', '{}'::jsonb);
  END IF;

  pages := COALESCE(full_settings -> 'pages', '{}'::jsonb);

  RETURN jsonb_build_object('pages', pages);
END;
$$;

COMMENT ON FUNCTION public.get_public_platform_customization() IS
'Retourne uniquement pages.* de la personnalisation (footer, landing, marketing). Lecture publique sans secrets.';

GRANT EXECUTE ON FUNCTION public.get_public_platform_customization() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_platform_customization() TO authenticated;

-- Personnalisation complète — utilisateurs authentifiés (admin panel)
CREATE OR REPLACE FUNCTION public.get_platform_customization()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT settings INTO result
  FROM public.platform_settings
  WHERE key = 'customization';

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_platform_customization() IS
'Retourne la personnalisation complète depuis platform_settings (utilisateurs authentifiés).';

GRANT EXECUTE ON FUNCTION public.get_platform_customization() TO authenticated;
