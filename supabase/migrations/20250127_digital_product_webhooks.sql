-- ================================================================
-- Digital Product Webhooks System
-- Date: 2025-01-27
-- Description: Système de webhooks pour intégrations tierces
-- ================================================================

-- Table pour les webhooks
CREATE TABLE IF NOT EXISTS public.digital_product_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Configuration
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- ['purchase', 'download', 'license_activated', 'license_expired', etc.]
  
  -- Sécurité
  secret_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3 CHECK (retry_count >= 0 AND retry_count <= 10),
  timeout_seconds INTEGER DEFAULT 30 CHECK (timeout_seconds >= 5 AND timeout_seconds <= 300),
  
  -- Headers personnalisés
  headers JSONB DEFAULT '{}'::jsonb,
  
  -- Statistiques
  total_sent INTEGER DEFAULT 0,
  total_succeeded INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_events CHECK (array_length(events, 1) > 0),
  CONSTRAINT valid_url CHECK (url ~* '^https?://')
);

-- Table pour les logs de webhooks
CREATE TABLE IF NOT EXISTS public.digital_product_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.digital_product_webhooks(id) ON DELETE CASCADE,
  
  -- Événement
  event_type TEXT NOT NULL,
  event_id UUID, -- ID de l'événement déclencheur (order_id, license_id, etc.)
  
  -- Payload
  payload JSONB NOT NULL,
  
  -- Réponse
  response_status INTEGER,
  response_body TEXT,
  response_headers JSONB,
  
  -- Tentatives
  attempts INTEGER DEFAULT 1 CHECK (attempts >= 1),
  success BOOLEAN DEFAULT false,
  
  -- Erreur
  error_message TEXT,
  error_code TEXT,
  
  -- Timing
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER, -- Durée de la requête en millisecondes
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_store_id ON public.digital_product_webhooks(store_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON public.digital_product_webhooks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON public.digital_product_webhooks USING GIN(events);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON public.digital_product_webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.digital_product_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_sent_at ON public.digital_product_webhook_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_success ON public.digital_product_webhook_logs(success);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON public.digital_product_webhook_logs(event_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_webhooks_updated_at_trigger ON public.digital_product_webhooks;
CREATE TRIGGER update_webhooks_updated_at_trigger
  BEFORE UPDATE ON public.digital_product_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();

-- Fonction pour mettre à jour les statistiques d'un webhook
CREATE OR REPLACE FUNCTION update_webhook_stats(
  p_webhook_id UUID,
  p_success BOOLEAN
)
RETURNS void AS $$
BEGIN
  UPDATE public.digital_product_webhooks
  SET 
    total_sent = total_sent + 1,
    total_succeeded = CASE WHEN p_success THEN total_succeeded + 1 ELSE total_succeeded END,
    total_failed = CASE WHEN NOT p_success THEN total_failed + 1 ELSE total_failed END,
    last_sent_at = now()
  WHERE id = p_webhook_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.digital_product_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour webhooks
DROP POLICY IF EXISTS "Store owners can manage their webhooks" ON public.digital_product_webhooks;
CREATE POLICY "Store owners can manage their webhooks"
  ON public.digital_product_webhooks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = digital_product_webhooks.store_id
        AND stores.user_id = auth.uid()
    )
  );

-- Policies pour webhook_logs
DROP POLICY IF EXISTS "Store owners can view their webhook logs" ON public.digital_product_webhook_logs;
CREATE POLICY "Store owners can view their webhook logs"
  ON public.digital_product_webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_product_webhooks
      INNER JOIN public.stores ON digital_product_webhooks.store_id = stores.id
      WHERE digital_product_webhooks.id = digital_product_webhook_logs.webhook_id
        AND stores.user_id = auth.uid()
    )
  );

-- Commentaires
COMMENT ON TABLE public.digital_product_webhooks IS 'Webhooks pour intégrations tierces (Zapier, Make, scripts)';
COMMENT ON TABLE public.digital_product_webhook_logs IS 'Historique des webhooks envoyés avec logs de réponse';
COMMENT ON COLUMN public.digital_product_webhooks.events IS 'Liste des événements déclencheurs : purchase, download, license_activated, license_expired, subscription_created, subscription_cancelled, etc.';
COMMENT ON COLUMN public.digital_product_webhooks.secret_key IS 'Clé secrète pour signature HMAC des payloads';

