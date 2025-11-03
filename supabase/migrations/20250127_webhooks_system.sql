-- ============================================================================
-- MIGRATION: Webhooks System Professional
-- Date: 2025-01-27
-- Author: Payhula Team
-- Description: Système complet de webhooks pour intégrations tierces
--              Permet aux vendeurs de recevoir des notifications en temps réel
-- ============================================================================

-- ============================================================================
-- 1. TYPES ENUMS
-- ============================================================================

DROP TYPE IF EXISTS webhook_event_type CASCADE;
DROP TYPE IF EXISTS webhook_status CASCADE;
DROP TYPE IF EXISTS webhook_delivery_status CASCADE;

-- Types d'événements webhook disponibles
CREATE TYPE webhook_event_type AS ENUM (
  -- Commandes
  'order.created',
  'order.updated',
  'order.completed',
  'order.cancelled',
  'order.refunded',
  
  -- Paiements
  'payment.completed',
  'payment.failed',
  'payment.refunded',
  'payment.pending',
  
  -- Produits
  'product.created',
  'product.updated',
  'product.deleted',
  'product.published',
  
  -- Produits Digitaux
  'digital_product.downloaded',
  'digital_product.license_activated',
  'digital_product.license_revoked',
  
  -- Services
  'service.booking_created',
  'service.booking_confirmed',
  'service.booking_cancelled',
  'service.booking_completed',
  'service.booking_rescheduled',
  
  -- Cours
  'course.enrolled',
  'course.unenrolled',
  'course.completed',
  'course.progress_updated',
  
  -- Retours
  'return.created',
  'return.approved',
  'return.rejected',
  'return.completed',
  
  -- Abonnements (futur)
  'subscription.created',
  'subscription.renewed',
  'subscription.cancelled',
  'subscription.expired',
  
  -- Clients
  'customer.created',
  'customer.updated',
  
  -- Custom (événements personnalisés)
  'custom'
);

-- Statut du webhook (actif/inactif)
CREATE TYPE webhook_status AS ENUM (
  'active',
  'inactive',
  'paused'
);

-- Statut de la livraison webhook
CREATE TYPE webhook_delivery_status AS ENUM (
  'pending',
  'delivered',
  'failed',
  'retrying'
);

-- ============================================================================
-- 2. TABLE: webhooks (Configuration des webhooks par store)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Configuration
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL, -- URL endpoint du webhook
  secret TEXT, -- Secret pour signature HMAC (optionnel mais recommandé)
  
  -- Événements à écouter
  events webhook_event_type[] NOT NULL DEFAULT ARRAY[]::webhook_event_type[],
  
  -- Statut
  status webhook_status NOT NULL DEFAULT 'active',
  
  -- Configuration avancée
  retry_count INTEGER DEFAULT 3, -- Nombre de tentatives en cas d'échec
  timeout_seconds INTEGER DEFAULT 30, -- Timeout pour chaque requête
  rate_limit_per_minute INTEGER DEFAULT 60, -- Limite de rate
  
  -- Headers personnalisés (pour auth, etc.)
  custom_headers JSONB DEFAULT '{}'::jsonb,
  
  -- Options
  verify_ssl BOOLEAN DEFAULT TRUE,
  include_payload BOOLEAN DEFAULT TRUE, -- Inclure le payload dans la requête
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Statistiques
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_triggered_at TIMESTAMPTZ,
  last_successful_delivery_at TIMESTAMPTZ,
  last_failed_delivery_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_store_id ON public.webhooks(store_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON public.webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_by ON public.webhooks(created_by);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON public.webhooks USING GIN(events);

-- ============================================================================
-- 3. TABLE: webhook_deliveries (Historique des livraisons)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  
  -- Événement déclencheur
  event_type webhook_event_type NOT NULL,
  event_id TEXT NOT NULL, -- ID de l'entité qui a déclenché l'événement (order.id, etc.)
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Données complètes de l'événement
  
  -- Livraison
  status webhook_delivery_status NOT NULL DEFAULT 'pending',
  url TEXT NOT NULL, -- URL cible (peut différer du webhook.url si modifiée)
  request_headers JSONB DEFAULT '{}'::jsonb,
  request_body TEXT, -- Payload envoyé (peut être tronqué si trop volumineux)
  
  -- Réponse
  response_status_code INTEGER,
  response_body TEXT, -- Réponse reçue (peut être tronquée)
  response_headers JSONB DEFAULT '{}'::jsonb,
  
  -- Tentatives
  attempt_number INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Erreurs
  error_message TEXT,
  error_type TEXT, -- 'timeout', 'http_error', 'network_error', 'invalid_response', etc.
  
  -- Métadonnées
  duration_ms INTEGER, -- Durée de la requête en millisecondes
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_type ON public.webhook_deliveries(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_id ON public.webhook_deliveries(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_triggered_at ON public.webhook_deliveries(triggered_at DESC);

-- ============================================================================
-- 4. RPC FUNCTIONS
-- ============================================================================

-- Fonction pour générer un secret aléatoire
CREATE OR REPLACE FUNCTION public.generate_webhook_secret()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour déclencher un webhook (appelée par les triggers/événements)
CREATE OR REPLACE FUNCTION public.trigger_webhook(
  p_event_type webhook_event_type,
  p_event_id TEXT,
  p_event_data JSONB DEFAULT '{}'::jsonb,
  p_store_id UUID DEFAULT NULL
)
RETURNS TABLE(webhook_id UUID, delivery_id UUID) AS $$
DECLARE
  v_webhook RECORD;
  v_delivery_id UUID;
  v_store_id UUID;
BEGIN
  -- Déterminer le store_id si non fourni
  IF p_store_id IS NULL THEN
    -- Essayer d'extraire store_id depuis event_data
    IF p_event_data ? 'store_id' THEN
      v_store_id := (p_event_data->>'store_id')::UUID;
    ELSIF p_event_data ? 'order' AND (p_event_data->'order') ? 'store_id' THEN
      v_store_id := ((p_event_data->'order')->>'store_id')::UUID;
    ELSIF p_event_type::TEXT LIKE 'order.%' OR p_event_type::TEXT LIKE 'payment.%' THEN
      -- Essayer de récupérer depuis orders
      SELECT store_id INTO v_store_id
      FROM public.orders
      WHERE id::TEXT = p_event_id
      LIMIT 1;
    END IF;
  ELSE
    v_store_id := p_store_id;
  END IF;

  -- Trouver tous les webhooks actifs pour cet événement et ce store
  FOR v_webhook IN
    SELECT *
    FROM public.webhooks
    WHERE status = 'active'
      AND (v_store_id IS NULL OR store_id = v_store_id)
      AND p_event_type = ANY(events)
  LOOP
    -- Créer une livraison
    INSERT INTO public.webhook_deliveries (
      webhook_id,
      event_type,
      event_id,
      event_data,
      url,
      status
    ) VALUES (
      v_webhook.id,
      p_event_type,
      p_event_id,
      p_event_data,
      v_webhook.url,
      'pending'
    )
    RETURNING id INTO v_delivery_id;

    -- Mettre à jour les stats du webhook
    UPDATE public.webhooks
    SET 
      total_deliveries = total_deliveries + 1,
      last_triggered_at = now(),
      updated_at = now()
    WHERE id = v_webhook.id;

    -- Retourner les IDs pour traitement asynchrone (Edge Function)
    RETURN QUERY SELECT v_webhook.id, v_delivery_id;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour tester un webhook
CREATE OR REPLACE FUNCTION public.test_webhook(
  p_webhook_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_webhook RECORD;
  v_delivery_id UUID;
BEGIN
  -- Récupérer le webhook
  SELECT * INTO v_webhook
  FROM public.webhooks
  WHERE id = p_webhook_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Webhook not found';
  END IF;

  -- Créer une livraison de test
  INSERT INTO public.webhook_deliveries (
    webhook_id,
    event_type,
    event_id,
    event_data,
    url,
    status
  ) VALUES (
    v_webhook.id,
    'custom',
    'test-' || gen_random_uuid()::TEXT,
    jsonb_build_object(
      'test', true,
      'timestamp', now(),
      'message', 'This is a test webhook from Payhula'
    ),
    v_webhook.url,
    'pending'
  )
  RETURNING id INTO v_delivery_id;

  RETURN v_delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le statut d'une livraison
CREATE OR REPLACE FUNCTION public.update_webhook_delivery_status(
  p_delivery_id UUID,
  p_status webhook_delivery_status,
  p_response_status_code INTEGER DEFAULT NULL,
  p_response_body TEXT DEFAULT NULL,
  p_response_headers JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_error_type TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.webhook_deliveries
  SET 
    status = p_status,
    response_status_code = p_response_status_code,
    response_body = p_response_body,
    response_headers = COALESCE(p_response_headers, response_headers),
    error_message = p_error_message,
    error_type = p_error_type,
    duration_ms = p_duration_ms,
    delivered_at = CASE WHEN p_status = 'delivered' THEN now() ELSE delivered_at END,
    failed_at = CASE WHEN p_status = 'failed' THEN now() ELSE failed_at END,
    updated_at = now()
  WHERE id = p_delivery_id;

  -- Mettre à jour les stats du webhook
  IF p_status = 'delivered' THEN
    UPDATE public.webhooks
    SET 
      successful_deliveries = successful_deliveries + 1,
      last_successful_delivery_at = now(),
      updated_at = now()
    WHERE id = (SELECT webhook_id FROM public.webhook_deliveries WHERE id = p_delivery_id);
  ELSIF p_status = 'failed' THEN
    UPDATE public.webhooks
    SET 
      failed_deliveries = failed_deliveries + 1,
      last_failed_delivery_at = now(),
      updated_at = now()
    WHERE id = (SELECT webhook_id FROM public.webhook_deliveries WHERE id = p_delivery_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

-- Webhooks: Les stores peuvent gérer leurs propres webhooks
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their store webhooks"
  ON public.webhooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = webhooks.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create webhooks for their stores"
  ON public.webhooks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = webhooks.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their store webhooks"
  ON public.webhooks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = webhooks.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their store webhooks"
  ON public.webhooks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = webhooks.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Webhook deliveries: Accès en lecture seule pour les propriétaires de stores
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deliveries for their store webhooks"
  ON public.webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.webhooks
      JOIN public.stores ON stores.id = webhooks.store_id
      WHERE webhooks.id = webhook_deliveries.webhook_id
      AND stores.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_webhooks_updated_at();

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.webhooks IS 'Configuration des webhooks pour recevoir des notifications d''événements';
COMMENT ON TABLE public.webhook_deliveries IS 'Historique de toutes les tentatives de livraison de webhooks';
COMMENT ON FUNCTION public.trigger_webhook IS 'Déclenche un webhook pour un événement donné';
COMMENT ON FUNCTION public.test_webhook IS 'Teste un webhook avec un événement de test';
COMMENT ON FUNCTION public.update_webhook_delivery_status IS 'Met à jour le statut d''une livraison webhook';

