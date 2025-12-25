-- ============================================================================
-- MIGRATION: Webhooks System Consolidated
-- Date: 2025-01-28
-- Author: Emarzona Team
-- Description: Migration consolidée pour unifier les systèmes de webhooks
--              Corrige les conflits entre les migrations précédentes
-- ============================================================================

-- ============================================================================
-- 1. TYPES ENUMS (Créer seulement s'ils n'existent pas)
-- ============================================================================

DO $$ 
BEGIN
  -- Créer webhook_event_type si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhook_event_type') THEN
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
      'return.requested',
      'return.approved',
      'return.rejected',
      'return.received',
      'return.refunded',
      'return.completed',
      -- Expéditions
      'shipment.created',
      'shipment.updated',
      'shipment.delivered',
      
      -- Abonnements
      'subscription.created',
      'subscription.renewed',
      'subscription.cancelled',
      'subscription.expired',
      
      -- Clients
      'customer.created',
      'customer.updated',
      
      -- Custom
      'custom'
    );
  END IF;

  -- Créer webhook_status si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhook_status') THEN
    CREATE TYPE webhook_status AS ENUM (
      'active',
      'inactive',
      'paused'
    );
  END IF;

  -- Créer webhook_delivery_status si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhook_delivery_status') THEN
    CREATE TYPE webhook_delivery_status AS ENUM (
      'pending',
      'delivered',
      'failed',
      'retrying'
    );
  END IF;
END $$;

-- ============================================================================
-- 2. TABLE: webhooks (Unifiée)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Configuration
  name TEXT NOT NULL DEFAULT 'Webhook',
  description TEXT,
  url TEXT NOT NULL,
  secret TEXT, -- Secret pour signature HMAC (optionnel mais recommandé)
  
  -- Événements à écouter (utiliser TEXT[] pour compatibilité)
  events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  
  -- Statut (utiliser ENUM si possible, sinon BOOLEAN)
  status webhook_status NOT NULL DEFAULT 'active',
  is_active BOOLEAN GENERATED ALWAYS AS (
    CASE WHEN status = 'active' THEN true ELSE false END
  ) STORED, -- Colonne calculée pour compatibilité avec code existant
  
  -- Configuration avancée
  retry_count INTEGER DEFAULT 3 CHECK (retry_count >= 0 AND retry_count <= 10),
  timeout_seconds INTEGER DEFAULT 30 CHECK (timeout_seconds >= 5 AND timeout_seconds <= 300),
  rate_limit_per_minute INTEGER DEFAULT 60 CHECK (rate_limit_per_minute > 0),
  
  -- Headers personnalisés
  custom_headers JSONB DEFAULT '{}'::jsonb,
  
  -- Options
  verify_ssl BOOLEAN DEFAULT TRUE,
  include_payload BOOLEAN DEFAULT TRUE,
  
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
  last_failed_delivery_at TIMESTAMPTZ,
  
  -- Champs de compatibilité (pour migration depuis anciennes tables)
  failure_count INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Contraintes
  CONSTRAINT valid_url CHECK (url ~* '^https?://'),
  CONSTRAINT valid_events CHECK (array_length(events, 1) > 0 OR status = 'inactive')
);

-- Ajouter les colonnes manquantes si la table existe déjà
DO $$
BEGIN
  -- Ajouter name si n'existe pas
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'webhooks' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.webhooks ADD COLUMN name TEXT DEFAULT 'Webhook';
    UPDATE public.webhooks SET name = 'Webhook' WHERE name IS NULL;
    ALTER TABLE public.webhooks ALTER COLUMN name SET NOT NULL;
  END IF;

  -- Ajouter status si n'existe pas (convertir depuis is_active)
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'webhooks' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.webhooks ADD COLUMN status webhook_status;
    UPDATE public.webhooks SET status = CASE 
      WHEN is_active = true THEN 'active'::webhook_status
      ELSE 'inactive'::webhook_status
    END;
    ALTER TABLE public.webhooks ALTER COLUMN status SET NOT NULL;
    ALTER TABLE public.webhooks ALTER COLUMN status SET DEFAULT 'active';
  END IF;

  -- Ajouter is_active si n'existe pas (colonne calculée)
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'webhooks' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.webhooks ADD COLUMN is_active BOOLEAN 
      GENERATED ALWAYS AS (CASE WHEN status = 'active' THEN true ELSE false END) STORED;
  END IF;

  -- Ajouter retry_count si n'existe pas
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'webhooks' 
    AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE public.webhooks ADD COLUMN retry_count INTEGER DEFAULT 3;
  END IF;

  -- Ajouter timeout_seconds si n'existe pas
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'webhooks' 
    AND column_name = 'timeout_seconds'
  ) THEN
    ALTER TABLE public.webhooks ADD COLUMN timeout_seconds INTEGER DEFAULT 30;
  END IF;

  -- Ajouter rate_limit_per_minute si n'existe pas
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'webhooks' 
    AND column_name = 'rate_limit_per_minute'
  ) THEN
    ALTER TABLE public.webhooks ADD COLUMN rate_limit_per_minute INTEGER DEFAULT 60;
  END IF;

  -- Ajouter custom_headers si n'existe pas
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'webhooks' 
    AND column_name = 'custom_headers'
  ) THEN
    ALTER TABLE public.webhooks ADD COLUMN custom_headers JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Ajouter verify_ssl si n'existe pas
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'webhooks' 
    AND column_name = 'verify_ssl'
  ) THEN
    ALTER TABLE public.webhooks ADD COLUMN verify_ssl BOOLEAN DEFAULT TRUE;
  END IF;

  -- Ajouter include_payload si n'existe pas
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'webhooks' 
    AND column_name = 'include_payload'
  ) THEN
    ALTER TABLE public.webhooks ADD COLUMN include_payload BOOLEAN DEFAULT TRUE;
  END IF;

  -- Ajouter metadata si n'existe pas
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'webhooks' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.webhooks ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Ajouter statistiques si n'existent pas
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'webhooks' 
    AND column_name = 'total_deliveries'
  ) THEN
    ALTER TABLE public.webhooks ADD COLUMN total_deliveries INTEGER DEFAULT 0;
    ALTER TABLE public.webhooks ADD COLUMN successful_deliveries INTEGER DEFAULT 0;
    ALTER TABLE public.webhooks ADD COLUMN failed_deliveries INTEGER DEFAULT 0;
  END IF;

  -- Ajouter timestamps si n'existent pas
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'webhooks' 
    AND column_name = 'last_successful_delivery_at'
  ) THEN
    ALTER TABLE public.webhooks ADD COLUMN last_successful_delivery_at TIMESTAMPTZ;
    ALTER TABLE public.webhooks ADD COLUMN last_failed_delivery_at TIMESTAMPTZ;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_store_id ON public.webhooks(store_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON public.webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON public.webhooks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhooks_created_by ON public.webhooks(created_by);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON public.webhooks USING GIN(events);

-- ============================================================================
-- 3. TABLE: webhook_deliveries (Historique des livraisons)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  
  -- Événement déclencheur
  event_type TEXT NOT NULL, -- Utiliser TEXT pour compatibilité
  event_id TEXT NOT NULL, -- ID de l'entité qui a déclenché l'événement
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Livraison
  status webhook_delivery_status NOT NULL DEFAULT 'pending',
  url TEXT NOT NULL,
  request_headers JSONB DEFAULT '{}'::jsonb,
  request_body TEXT,
  
  -- Réponse
  response_status_code INTEGER,
  response_body TEXT,
  response_headers JSONB DEFAULT '{}'::jsonb,
  
  -- Tentatives
  attempt_number INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Erreurs
  error_message TEXT,
  error_type TEXT,
  
  -- Métadonnées
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Contrainte d'idempotence (éviter les doublons)
  CONSTRAINT unique_event_webhook UNIQUE (event_id, webhook_id, event_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_type ON public.webhook_deliveries(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_id ON public.webhook_deliveries(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_triggered_at ON public.webhook_deliveries(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry ON public.webhook_deliveries(next_retry_at) 
  WHERE status IN ('pending', 'retrying') AND next_retry_at IS NOT NULL;

-- ============================================================================
-- 4. TABLE: webhook_logs (Alternative/compatibilité avec ancien système)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  
  -- Événement
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  -- Résultat
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  
  -- Tentatives
  attempt_number INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,
  
  -- Timestamps
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_triggered_at ON public.webhook_logs(triggered_at DESC);

-- ============================================================================
-- 5. RPC FUNCTIONS
-- ============================================================================

-- Supprimer toutes les anciennes versions de trigger_webhook pour éviter les conflits
DROP FUNCTION IF EXISTS public.trigger_webhook(webhook_event_type, TEXT, JSONB, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.trigger_webhook(UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.trigger_webhook(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.trigger_webhook CASCADE;

-- Fonction pour générer un secret aléatoire
CREATE OR REPLACE FUNCTION public.generate_webhook_secret()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour déclencher un webhook (version unifiée)
CREATE OR REPLACE FUNCTION public.trigger_webhook(
  p_store_id UUID,
  p_event_type TEXT,
  p_event_id TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(webhook_id UUID, delivery_id UUID) AS $$
DECLARE
  v_webhook RECORD;
  v_delivery_id UUID;
  v_event_id TEXT;
BEGIN
  -- Générer event_id si non fourni
  v_event_id := COALESCE(p_event_id, gen_random_uuid()::TEXT);
  
  -- Trouver tous les webhooks actifs pour cet événement et ce store
  FOR v_webhook IN
    SELECT *
    FROM public.webhooks
    WHERE store_id = p_store_id
      AND status = 'active'
      AND (p_event_type = ANY(events) OR 'custom' = ANY(events))
  LOOP
    -- Vérifier idempotence (éviter les doublons)
    SELECT id INTO v_delivery_id
    FROM public.webhook_deliveries
    WHERE event_id = v_event_id
      AND webhook_id = v_webhook.id
      AND event_type = p_event_type
    LIMIT 1;
    
    -- Si existe déjà, skip (idempotence)
    IF v_delivery_id IS NOT NULL THEN
      CONTINUE;
    END IF;
    
    -- Créer une livraison
    INSERT INTO public.webhook_deliveries (
      webhook_id,
      event_type,
      event_id,
      event_data,
      url,
      status,
      max_attempts
    ) VALUES (
      v_webhook.id,
      p_event_type,
      v_event_id,
      p_event_data,
      v_webhook.url,
      'pending',
      v_webhook.retry_count
    )
    RETURNING id INTO v_delivery_id;
    
    -- Mettre à jour les stats du webhook
    UPDATE public.webhooks
    SET 
      total_deliveries = total_deliveries + 1,
      last_triggered_at = now(),
      updated_at = now()
    WHERE id = v_webhook.id;
    
    -- Retourner les IDs pour traitement asynchrone
    RETURN QUERY SELECT v_webhook.id, v_delivery_id;
  END LOOP;
  
  RETURN;
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
    failed_at = CASE WHEN p_status = 'failed' THEN now() ELSE failed_at END
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
      failure_count = failure_count + 1,
      last_error = p_error_message,
      updated_at = now()
    WHERE id = (SELECT webhook_id FROM public.webhook_deliveries WHERE id = p_delivery_id);
  END IF;
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
      'message', 'This is a test webhook from Emarzona'
    ),
    v_webhook.url,
    'pending'
  )
  RETURNING id INTO v_delivery_id;
  
  RETURN v_delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view their store webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Users can create webhooks for their stores" ON public.webhooks;
DROP POLICY IF EXISTS "Users can update their store webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Users can delete their store webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Users can view deliveries for their store webhooks" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "Users can view their webhook logs" ON public.webhook_logs;

-- Webhooks: Les stores peuvent gérer leurs propres webhooks
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

-- Webhook logs: Accès en lecture seule
CREATE POLICY "Users can view their webhook logs"
  ON public.webhook_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.webhooks
      JOIN public.stores ON stores.id = webhooks.store_id
      WHERE webhooks.id = webhook_logs.webhook_id
      AND stores.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON public.webhooks;
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_webhooks_updated_at();

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.webhooks IS 'Configuration des webhooks pour recevoir des notifications d''événements';
COMMENT ON TABLE public.webhook_deliveries IS 'Historique de toutes les tentatives de livraison de webhooks';
COMMENT ON TABLE public.webhook_logs IS 'Logs de webhooks (compatibilité avec ancien système)';
COMMENT ON FUNCTION public.trigger_webhook IS 'Déclenche un webhook pour un événement donné';
COMMENT ON FUNCTION public.test_webhook IS 'Teste un webhook avec un événement de test';
COMMENT ON FUNCTION public.update_webhook_delivery_status IS 'Met à jour le statut d''une livraison webhook';

