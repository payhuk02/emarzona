-- Enregistre les commissions vendeur (~10%) dans platform_commissions.
-- Cause du 0 sur /admin/revenue : le trigger legacy n'existait plus sur payments,
-- et les paiements MoneyFusion/GeniusPay passent par public.transactions.
-- Schéma réel : id, store_id, order_id, commission_rate, commission_amount, status, paid_at, created_at, updated_at

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Aligner calculate_commission (payments) sur le schéma réel
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_rate NUMERIC := 0.10;
  v_fee_percent NUMERIC := 10;
  v_commissionable_amount NUMERIC := 0;
  v_commission_amount NUMERIC;
  v_seller_amount NUMERIC;
  v_store_id UUID;
BEGIN
  v_store_id := NEW.store_id;
  v_fee_percent := public.resolve_store_platform_fee_percent(v_store_id);
  v_commission_rate := v_fee_percent / 100.0;

  IF NEW.order_id IS NOT NULL THEN
    v_commissionable_amount := public.order_commissionable_amount(NEW.order_id);
    v_commission_amount := ROUND((v_commissionable_amount * v_commission_rate)::numeric, 2);
  ELSE
    v_commission_amount := ROUND((NEW.amount * v_commission_rate)::numeric, 2);
  END IF;

  v_seller_amount := NEW.amount - v_commission_amount;

  -- Colonnes optionnelles sur payments (si présentes)
  BEGIN
    NEW.commission_rate := v_commission_rate;
    NEW.commission_amount := v_commission_amount;
    NEW.seller_amount := v_seller_amount;
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
  END;

  IF NEW.status = 'completed'
     AND NEW.order_id IS NOT NULL
     AND COALESCE(v_commissionable_amount, v_commission_amount, 0) > 0
     AND NOT EXISTS (
       SELECT 1 FROM public.platform_commissions pc WHERE pc.order_id = NEW.order_id
     )
  THEN
    INSERT INTO public.platform_commissions (
      store_id,
      order_id,
      commission_rate,
      commission_amount,
      status
    ) VALUES (
      v_store_id,
      NEW.order_id,
      v_commission_rate,
      v_commission_amount,
      'completed'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_payment_commission ON public.payments;
CREATE TRIGGER calculate_payment_commission
  BEFORE INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_commission();

-- ---------------------------------------------------------------------------
-- 2) Trigger transactions (chemin PSP actuel)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_platform_commission_from_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_fee_percent NUMERIC := 10;
  v_commission_rate NUMERIC := 0.10;
  v_commissionable NUMERIC := 0;
  v_commission_amount NUMERIC := 0;
BEGIN
  IF NEW.status IS DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  IF NEW.order_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.platform_commissions pc WHERE pc.order_id = NEW.order_id
  ) THEN
    RETURN NEW;
  END IF;

  v_store_id := COALESCE(
    NEW.store_id,
    (SELECT store_id FROM public.orders WHERE id = NEW.order_id)
  );
  IF v_store_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_fee_percent := public.resolve_store_platform_fee_percent(v_store_id);
  v_commission_rate := v_fee_percent / 100.0;
  v_commissionable := public.order_commissionable_amount(NEW.order_id);

  -- Produits physiques uniquement → 0 (pas de ligne)
  IF COALESCE(v_commissionable, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  v_commission_amount := ROUND((v_commissionable * v_commission_rate)::numeric, 2);

  INSERT INTO public.platform_commissions (
    store_id,
    order_id,
    commission_rate,
    commission_amount,
    status
  ) VALUES (
    v_store_id,
    NEW.order_id,
    v_commission_rate,
    v_commission_amount,
    'completed'
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_platform_commission_on_transaction ON public.transactions;
CREATE TRIGGER record_platform_commission_on_transaction
  AFTER INSERT OR UPDATE OF status ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.record_platform_commission_from_transaction();

COMMENT ON FUNCTION public.record_platform_commission_from_transaction IS
  'Insère platform_commissions (C1 : digital/service/course/artist) quand une transaction passe completed.';

-- ---------------------------------------------------------------------------
-- 3) Backfill commandes déjà payées sans ligne commission
-- ---------------------------------------------------------------------------
INSERT INTO public.platform_commissions (
  store_id,
  order_id,
  commission_rate,
  commission_amount,
  status,
  created_at
)
SELECT
  o.store_id,
  o.id,
  public.resolve_store_platform_fee_percent(o.store_id) / 100.0,
  public.order_platform_fee_amount(o.id),
  'completed',
  COALESCE(o.updated_at, o.created_at, now())
FROM public.orders o
WHERE o.payment_status IN ('paid', 'completed', 'successful')
  AND public.order_platform_fee_amount(o.id) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.platform_commissions pc WHERE pc.order_id = o.id
  );

COMMIT;

NOTIFY pgrst, 'reload schema';
