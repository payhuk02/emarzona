-- Garantit qu'aucun utilisateur ne peut partager le même lien /p/{code}
-- (casse ignorée). Index unique + trigger + RPC atomique.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_lower_uidx
  ON public.profiles (lower(referral_code))
  WHERE referral_code IS NOT NULL AND btrim(referral_code) <> '';

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_taken boolean;
BEGIN
  LOOP
    v_code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE lower(referral_code) = v_code
    ) INTO v_taken;
    EXIT WHEN NOT v_taken;
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_unique_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_taken boolean;
BEGIN
  IF NEW.referral_code IS NULL OR btrim(NEW.referral_code) = '' THEN
    NEW.referral_code := public.generate_referral_code();
    RETURN NEW;
  END IF;

  NEW.referral_code := lower(regexp_replace(btrim(NEW.referral_code), '[^a-zA-Z0-9]', '', 'g'));

  IF NEW.referral_code = '' THEN
    NEW.referral_code := public.generate_referral_code();
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id IS DISTINCT FROM NEW.user_id
      AND lower(referral_code) = NEW.referral_code
  ) INTO v_taken;

  IF v_taken THEN
    RAISE EXCEPTION 'referral_code_taken'
      USING ERRCODE = '23505',
            HINT = 'taken';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_referral_code_trigger ON public.profiles;
DROP TRIGGER IF EXISTS profiles_referral_code_unique_trg ON public.profiles;

CREATE TRIGGER profiles_referral_code_unique_trg
BEFORE INSERT OR UPDATE OF referral_code ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_unique_referral_code();

CREATE OR REPLACE FUNCTION public.update_my_referral_slug(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_slug text;
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

  UPDATE public.profiles
  SET referral_code = v_slug,
      updated_at = now()
  WHERE user_id = v_user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles other
      WHERE other.user_id IS DISTINCT FROM v_user_id
        AND lower(other.referral_code) = v_slug
    );

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_user_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'taken');
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'profile_not_found');
  END IF;

  RETURN jsonb_build_object('success', true, 'slug', v_slug);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'taken');
END;
$$;

COMMENT ON FUNCTION public.update_my_referral_slug(text) IS
  'Personnalise le code de parrainage. Unique insensible à la casse ; collision → taken.';

GRANT EXECUTE ON FUNCTION public.update_my_referral_slug(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated;

COMMIT;
