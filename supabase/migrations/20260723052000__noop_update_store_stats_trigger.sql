-- Soft-fix broken store stats trigger (columns total_orders/total_revenue gone)
BEGIN;

CREATE OR REPLACE FUNCTION public.update_store_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Deprecated: boutique CA is derived via store_earnings / order_net_revenue.
  -- Never block order paid transitions.
  RETURN NEW;
END;
$function$;

COMMIT;
