-- File d'attente admin pour paiements MoneyFusion sans transaction locale (webhook orphan).

CREATE TABLE IF NOT EXISTS public.moneyfusion_orphan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mf_token TEXT NOT NULL,
  mapped_status TEXT NOT NULL,
  verified_statut TEXT,
  verified_amount NUMERIC,
  currency TEXT NOT NULL DEFAULT 'XOF',
  event_type TEXT,
  transaction_id_hint UUID,
  order_id_hint UUID,
  store_id_hint UUID,
  customer_email_hint TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolution_status TEXT NOT NULL DEFAULT 'open'
    CHECK (resolution_status IN ('open', 'auto_linked', 'manual_linked', 'ignored')),
  linked_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  linked_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  webhook_attempts INTEGER NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT moneyfusion_orphan_payments_token_unique UNIQUE (mf_token)
);

CREATE INDEX IF NOT EXISTS idx_moneyfusion_orphan_open
  ON public.moneyfusion_orphan_payments (last_seen_at DESC)
  WHERE resolution_status = 'open';

CREATE INDEX IF NOT EXISTS idx_moneyfusion_orphan_order_hint
  ON public.moneyfusion_orphan_payments (order_id_hint)
  WHERE order_id_hint IS NOT NULL;

COMMENT ON TABLE public.moneyfusion_orphan_payments IS
  'Paiements MoneyFusion reçus sans transaction locale — queue admin + auto-link.';

ALTER TABLE public.moneyfusion_orphan_payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'moneyfusion_orphan_payments'
      AND policyname = 'moneyfusion_orphan_admin_select'
  ) THEN
    CREATE POLICY moneyfusion_orphan_admin_select
      ON public.moneyfusion_orphan_payments
      FOR SELECT TO authenticated
      USING (public.is_platform_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'moneyfusion_orphan_payments'
      AND policyname = 'moneyfusion_orphan_service_all'
  ) THEN
    CREATE POLICY moneyfusion_orphan_service_all
      ON public.moneyfusion_orphan_payments
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Liste orphelins ouverts / récents (admin)
CREATE OR REPLACE FUNCTION public.list_moneyfusion_orphan_payments(
  p_status TEXT DEFAULT 'open',
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  mf_token TEXT,
  mapped_status TEXT,
  verified_statut TEXT,
  verified_amount NUMERIC,
  currency TEXT,
  transaction_id_hint UUID,
  order_id_hint UUID,
  store_id_hint UUID,
  customer_email_hint TEXT,
  resolution_status TEXT,
  linked_transaction_id UUID,
  linked_order_id UUID,
  resolution_note TEXT,
  webhook_attempts INTEGER,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  order_number TEXT,
  order_payment_status TEXT,
  order_paid_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.mf_token,
    o.mapped_status,
    o.verified_statut,
    o.verified_amount,
    o.currency,
    o.transaction_id_hint,
    o.order_id_hint,
    o.store_id_hint,
    o.customer_email_hint,
    o.resolution_status,
    o.linked_transaction_id,
    o.linked_order_id,
    o.resolution_note,
    o.webhook_attempts,
    o.last_seen_at,
    o.created_at,
    ord.order_number,
    ord.payment_status AS order_payment_status,
    ord.paid_at AS order_paid_at
  FROM public.moneyfusion_orphan_payments o
  LEFT JOIN public.orders ord ON ord.id = o.order_id_hint
  WHERE (
    p_status IS NULL
    OR p_status = 'all'
    OR o.resolution_status = p_status
  )
  ORDER BY o.last_seen_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_moneyfusion_orphan_payments(TEXT, INTEGER) TO authenticated, service_role;

-- Activité réparations / réconciliations récentes (admin)
CREATE OR REPLACE FUNCTION public.list_payment_repair_activity(
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  transaction_id UUID,
  event_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  response_data JSONB,
  order_id UUID,
  order_number TEXT,
  order_paid_at TIMESTAMPTZ,
  order_payment_status TEXT,
  payment_provider TEXT,
  mf_token TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    tl.id,
    tl.transaction_id,
    tl.event_type,
    tl.status,
    tl.created_at,
    tl.response_data,
    t.order_id,
    ord.order_number,
    ord.paid_at AS order_paid_at,
    ord.payment_status AS order_payment_status,
    t.payment_provider,
    COALESCE(t.payment_id, t.geniuspay_transaction_id) AS mf_token
  FROM public.transaction_logs tl
  JOIN public.transactions t ON t.id = tl.transaction_id
  LEFT JOIN public.orders ord ON ord.id = t.order_id
  WHERE tl.event_type IN (
    'reconciliation_repaired',
    'reconciliation_mismatch',
    'retry_verification',
    'orphan_auto_linked',
    'orphan_manual_linked'
  )
  ORDER BY tl.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_payment_repair_activity(INTEGER) TO authenticated, service_role;
