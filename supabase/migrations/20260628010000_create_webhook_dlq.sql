-- ==============================================================================
-- 🛡️ Phase 5 - Sprint 1: Webhook Idempotency & Dead Letter Queue (DLQ)
-- ==============================================================================
-- Cette architecture permet d'ingérer les événements Stripe/Moneroo de manière 
-- asynchrone et idempotente pour garantir 100% de tolérance aux pannes.
-- ==============================================================================

-- 1. Table principale d'ingestion des webhooks
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'moneroo', 'paypal')),
    provider_event_id TEXT NOT NULL, -- Clé d'idempotence (ex: evt_123)
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider, provider_event_id) -- Garantie d'idempotence stricte
);

-- Index pour les workers (récupérer les pending rapidement)
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status) WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

-- Activer RLS (sécurité : seule la DB et les edge functions admin y accèdent)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- Pas de policy publique : accès strictement par service_role key.

-- 2. Trigger de mise à jour updated_at
CREATE OR REPLACE FUNCTION public.handle_webhook_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_webhook_events_updated_at
BEFORE UPDATE ON public.webhook_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_webhook_events_updated_at();

-- 3. Dead Letter Queue (DLQ) Archive Table
-- Les événements qui ont échoué plus de 5 fois sont déplacés ici.
CREATE TABLE IF NOT EXISTS public.webhook_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_event_id UUID NOT NULL REFERENCES public.webhook_events(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    last_error TEXT,
    moved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT
);

ALTER TABLE public.webhook_dlq ENABLE ROW LEVEL SECURITY;
-- Politique : Seuls les admins peuvent lire la DLQ
CREATE POLICY "Admins can view DLQ" ON public.webhook_dlq
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can update DLQ" ON public.webhook_dlq
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
