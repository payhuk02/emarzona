-- Short customizable referral slugs (emarzona.com/p/abcdef)
-- Unique case-insensitive + RPC for the authenticated owner.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_lower_uidx
  ON public.profiles (lower(referral_code))
  WHERE referral_code IS NOT NULL AND btrim(referral_code) <> '';

CREATE OR REPLACE FUNCTION public.update_my_referral_slug(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_slug text;
  v_taken boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  v_slug := lower(regexp_replace(trim(COALESCE(p_slug, '')), '[^a-z0-9]', '', 'g'));

  IF length(v_slug) < 4 OR length(v_slug) > 20 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_length');
  END IF;

  IF v_slug !~ '^[a-z0-9]+$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_format');
  END IF;

  IF v_slug IN (
    'admin', 'api', 'app', 'auth', 'emarzona', 'help', 'login',
    'marketplace', 'pay', 'payhuk', 'register', 'signup', 'support', 'www'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'reserved');
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id IS DISTINCT FROM v_user_id
      AND lower(referral_code) = v_slug
  ) INTO v_taken;

  IF v_taken THEN
    RETURN jsonb_build_object('success', false, 'error', 'taken');
  END IF;

  UPDATE public.profiles
  SET referral_code = v_slug,
      updated_at = now()
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_not_found');
  END IF;

  RETURN jsonb_build_object('success', true, 'slug', v_slug);
END;
$$;

COMMENT ON FUNCTION public.update_my_referral_slug(text) IS
  'Le vendeur connecté personnalise son code de parrainage (4–20 a-z0-9, unique).';

GRANT EXECUTE ON FUNCTION public.update_my_referral_slug(text) TO authenticated;

COMMIT;
