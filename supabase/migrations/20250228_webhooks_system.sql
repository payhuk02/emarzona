-- =========================================================
-- Migration : Système de Webhooks
-- Date : 28/02/2025
-- Description : Système complet de webhooks pour tous les événements
-- =========================================================

-- Table pour stocker les webhooks
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Configuration
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- Secret pour signer les payloads
  description TEXT,
  
  -- Événements à écouter
  events TEXT[] NOT NULL DEFAULT '{}',
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Métadonnées
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes (créer seulement si la table existe)
DO $$
BEGIN
  -- Vérifier si la table existe avant de créer les index
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhooks') THEN
    CREATE INDEX IF NOT EXISTS idx_webhooks_store_id ON public.webhooks(store_id);
    
    -- Vérifier si la colonne is_active existe avant de créer l'index
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'webhooks' 
      AND column_name = 'is_active'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON public.webhooks(is_active) WHERE is_active = true;
    END IF;
    
    CREATE INDEX IF NOT EXISTS idx_webhooks_events ON public.webhooks USING GIN(events);
  END IF;
END $$;

-- Table pour l'historique des webhooks
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
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_triggered_at ON public.webhook_logs(triggered_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();

-- Function pour déclencher un webhook
CREATE OR REPLACE FUNCTION trigger_webhook(
  p_store_id UUID,
  p_event_type TEXT,
  p_payload JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  webhook_record RECORD;
BEGIN
  -- Trouver tous les webhooks actifs pour cette boutique et cet événement
  FOR webhook_record IN
    SELECT * FROM public.webhooks
    WHERE store_id = p_store_id
      AND is_active = true
      AND p_event_type = ANY(events)
  LOOP
    -- Insérer dans les logs (sera traité par un worker)
    INSERT INTO public.webhook_logs (
      webhook_id,
      event_type,
      payload,
      status
    ) VALUES (
      webhook_record.id,
      p_event_type,
      p_payload,
      'pending'
    );
    
    -- Mettre à jour last_triggered_at
    UPDATE public.webhooks
    SET last_triggered_at = now()
    WHERE id = webhook_record.id;
  END LOOP;
END;
$$;

-- RLS (Row Level Security)
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs webhooks
CREATE POLICY "Users can view their webhooks"
  ON public.webhooks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = webhooks.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent créer des webhooks
CREATE POLICY "Users can create webhooks"
  ON public.webhooks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = webhooks.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent modifier leurs webhooks
CREATE POLICY "Users can update their webhooks"
  ON public.webhooks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = webhooks.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent supprimer leurs webhooks
CREATE POLICY "Users can delete their webhooks"
  ON public.webhooks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = webhooks.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent voir les logs de leurs webhooks
CREATE POLICY "Users can view their webhook logs"
  ON public.webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.webhooks
      JOIN public.stores ON stores.id = webhooks.store_id
      WHERE webhooks.id = webhook_logs.webhook_id
      AND stores.user_id = auth.uid()
    )
  );

-- Commentaires
COMMENT ON TABLE public.webhooks IS 'Configuration des webhooks pour les événements';
COMMENT ON TABLE public.webhook_logs IS 'Historique des déclenchements de webhooks';
COMMENT ON FUNCTION trigger_webhook IS 'Déclenche un webhook pour un événement donné';

