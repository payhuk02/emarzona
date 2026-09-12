-- Allow platform admins to run expire-now from the admin UI (safe: only past ends_at).
CREATE OR REPLACE FUNCTION public.admin_expire_marketplace_sponsorships()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN public.expire_marketplace_sponsorships();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_expire_marketplace_sponsorships() TO authenticated;
