-- P0: Aligner revenus vendeur (store_earnings) avec statuts post-paiement réels (confirmed | completed)
-- Voir src/lib/orders/order-status.ts

-- =========================================================
-- Helper SQL : commande éligible au revenu vendeur
-- =========================================================

CREATE OR REPLACE FUNCTION public.is_order_paid_for_revenue(
  p_status TEXT,
  p_payment_status TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_payment_status = 'paid'
    AND p_status IN ('completed', 'confirmed');
$$;

COMMENT ON FUNCTION public.is_order_paid_for_revenue IS
  'True si la commande est payée et comptabilisable (completed ou confirmed).';

-- =========================================================
-- calculate_store_earnings : inclure confirmed + completed
-- =========================================================

CREATE OR REPLACE FUNCTION public.calculate_store_earnings(p_store_id UUID)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_platform_commission NUMERIC,
  total_withdrawn NUMERIC,
  available_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_revenue NUMERIC := 0;
  v_platform_commission_rate NUMERIC := 0.10;
  v_total_platform_commission NUMERIC := 0;
  v_total_withdrawn NUMERIC := 0;
  v_available_balance NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_total_revenue
  FROM public.orders
  WHERE store_id = p_store_id
    AND public.is_order_paid_for_revenue(status, payment_status);

  SELECT COALESCE(platform_commission_rate, 0.10)
  INTO v_platform_commission_rate
  FROM public.store_earnings
  WHERE store_id = p_store_id;

  v_total_platform_commission := v_total_revenue * v_platform_commission_rate;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_withdrawn
  FROM public.store_withdrawals
  WHERE store_id = p_store_id
    AND status IN ('completed', 'processing');

  v_available_balance := v_total_revenue - v_total_platform_commission - v_total_withdrawn;

  IF v_available_balance < 0 THEN
    v_available_balance := 0;
  END IF;

  RETURN QUERY SELECT
    v_total_revenue,
    v_total_platform_commission,
    v_total_withdrawn,
    v_available_balance;
END;
$$;

-- =========================================================
-- Triggers store_earnings (2 triggers : pas de OLD dans WHEN sur INSERT — PG 42P17)
-- =========================================================

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

COMMENT ON FUNCTION public.trigger_update_store_earnings_on_order_paid IS
  'Recalcule store_earnings quand une commande devient payée (completed ou confirmed).';

COMMENT ON FUNCTION public.trigger_update_store_earnings_on_order_refunded IS
  'Recalcule store_earnings quand une commande est remboursée.';

-- =========================================================
-- Backfill : commandes digitales/services/cours/artiste déjà payées en confirmed → completed
-- =========================================================

UPDATE public.orders o
SET status = 'completed', updated_at = now()
WHERE o.payment_status = 'paid'
  AND o.status = 'confirmed'
  AND NOT EXISTS (
    SELECT 1
    FROM public.order_items oi
    WHERE oi.order_id = o.id
      AND oi.product_type = 'physical'
  );

-- Recalculer les soldes vendeurs touchés par le backfill ou des écarts historiques
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT store_id
    FROM public.orders
    WHERE payment_status = 'paid'
      AND public.is_order_paid_for_revenue(status, payment_status)
  LOOP
    PERFORM public.update_store_earnings(r.store_id);
  END LOOP;
END;
$$;
