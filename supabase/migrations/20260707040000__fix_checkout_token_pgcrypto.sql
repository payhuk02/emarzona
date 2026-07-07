-- Hotfix: checkout invité marketplace — gen_random_bytes indisponible sans pgcrypto
-- Le trigger set_order_checkout_token s'exécute à chaque INSERT orders (RPC invité incluse).

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.set_order_checkout_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb);
  IF NEW.metadata->>'checkout_token' IS NULL THEN
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'checkout_token',
      replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_order_checkout_token IS
  'Assigns a random one-time checkout_token in order metadata for guest payment sessions (no pgcrypto dependency).';

COMMIT;
