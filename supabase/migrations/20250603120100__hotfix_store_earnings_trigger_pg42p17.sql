-- Hotfix prod : si 20250603120000 a échoué sur CREATE TRIGGER (42P17 OLD dans WHEN INSERT)
-- Exécuter ce script seul si is_order_paid_for_revenue existe déjà.

CREATE OR REPLACE FUNCTION public.trigger_update_store_earnings_on_order_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_store_earnings(NEW.store_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_update_store_earnings_on_order_refunded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_store_earnings(NEW.store_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_store_earnings_on_order ON public.orders;
DROP TRIGGER IF EXISTS update_store_earnings_on_order_paid ON public.orders;
DROP TRIGGER IF EXISTS update_store_earnings_on_order_refunded ON public.orders;

CREATE TRIGGER update_store_earnings_on_order_paid
  AFTER INSERT OR UPDATE OF status, payment_status ON public.orders
  FOR EACH ROW
  WHEN (public.is_order_paid_for_revenue(NEW.status, NEW.payment_status))
  EXECUTE FUNCTION public.trigger_update_store_earnings_on_order_paid();

CREATE TRIGGER update_store_earnings_on_order_refunded
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  WHEN (
    NEW.payment_status = 'refunded'
    AND OLD.payment_status IS DISTINCT FROM 'refunded'
  )
  EXECUTE FUNCTION public.trigger_update_store_earnings_on_order_refunded();
