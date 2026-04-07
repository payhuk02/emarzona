-- ================================================================
-- Physical Products Webhooks System
-- Date: 2025-01-27
-- Description: Système de webhooks pour événements produits physiques
-- ================================================================

-- Table: physical_product_webhooks
CREATE TABLE IF NOT EXISTS public.physical_product_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'purchase',
    'shipment_created',
    'shipment_updated',
    'shipment_delivered',
    'return_requested',
    'return_approved',
    'return_rejected',
    'return_received',
    'return_refunded',
    'stock_low',
    'stock_out',
    'price_changed',
    'product_updated'
  )),
  target_url TEXT NOT NULL,
  secret_key TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_webhook_per_event_url UNIQUE (store_id, event_type, target_url)
);

-- Table: physical_product_webhook_logs
CREATE TABLE IF NOT EXISTS public.physical_product_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.physical_product_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_id TEXT, -- ID de l'entité qui a déclenché l'événement (ex: order_id, shipment_id, return_id)
  payload JSONB NOT NULL,
  response_status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_attempt_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_physical_webhooks_store ON public.physical_product_webhooks(store_id);
CREATE INDEX IF NOT EXISTS idx_physical_webhooks_event_type ON public.physical_product_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_physical_webhooks_active ON public.physical_product_webhooks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_physical_webhooks_last_triggered ON public.physical_product_webhooks(last_triggered_at);

CREATE INDEX IF NOT EXISTS idx_physical_webhook_logs_webhook ON public.physical_product_webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_physical_webhook_logs_event_type ON public.physical_product_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_physical_webhook_logs_status ON public.physical_product_webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_physical_webhook_logs_created_at ON public.physical_product_webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_physical_webhook_logs_next_attempt ON public.physical_product_webhook_logs(next_attempt_at) WHERE next_attempt_at IS NOT NULL;

-- Fonction pour obtenir les statistiques d'un webhook
CREATE OR REPLACE FUNCTION get_physical_webhook_stats(webhook_id_param UUID)
RETURNS TABLE (
  total_triggered INTEGER,
  success_rate NUMERIC,
  avg_response_time_ms NUMERIC,
  last_triggered_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_triggered,
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
    END as success_rate,
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL), 2)
    END as avg_response_time_ms,
    MAX(created_at) as last_triggered_at
  FROM public.physical_product_webhook_logs
  WHERE webhook_id = webhook_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_physical_webhook_stats(UUID) IS 'Retourne les statistiques d''un webhook de produits physiques';

-- Fonction pour mettre à jour les compteurs d'un webhook
CREATE OR REPLACE FUNCTION update_physical_webhook_counters(webhook_id_param UUID, success BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE public.physical_product_webhooks
  SET
    trigger_count = trigger_count + 1,
    success_count = CASE WHEN success THEN success_count + 1 ELSE success_count END,
    failure_count = CASE WHEN NOT success THEN failure_count + 1 ELSE failure_count END,
    last_triggered_at = now(),
    updated_at = now()
  WHERE id = webhook_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_physical_webhook_counters(UUID, BOOLEAN) IS 'Met à jour les compteurs d''un webhook de produits physiques';

-- RLS Policies
ALTER TABLE public.physical_product_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour physical_product_webhooks
DROP POLICY IF EXISTS "Store owners manage webhooks" ON public.physical_product_webhooks;
CREATE POLICY "Store owners manage webhooks" ON public.physical_product_webhooks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = physical_product_webhooks.store_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = physical_product_webhooks.store_id
        AND user_id = auth.uid()
    )
  );

-- Policies pour physical_product_webhook_logs
DROP POLICY IF EXISTS "Store owners view their webhook logs" ON public.physical_product_webhook_logs;
CREATE POLICY "Store owners view their webhook logs" ON public.physical_product_webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.physical_product_webhooks w
      INNER JOIN public.stores s ON w.store_id = s.id
      WHERE w.id = physical_product_webhook_logs.webhook_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners insert their webhook logs" ON public.physical_product_webhook_logs;
CREATE POLICY "Store owners insert their webhook logs" ON public.physical_product_webhook_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.physical_product_webhooks w
      INNER JOIN public.stores s ON w.store_id = s.id
      WHERE w.id = physical_product_webhook_logs.webhook_id
        AND s.user_id = auth.uid()
    )
  );

-- Commentaires
COMMENT ON TABLE public.physical_product_webhooks IS 'Webhooks pour les événements de produits physiques';
COMMENT ON TABLE public.physical_product_webhook_logs IS 'Logs des envois de webhooks de produits physiques';

