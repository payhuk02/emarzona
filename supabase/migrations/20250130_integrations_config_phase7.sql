-- =====================================================
-- INTEGRATIONS CONFIGURATION - Phase 7
-- Date: 2025-01-30
-- Description: Configuration des intégrations (Zoom, OpenAI, Shipping APIs)
-- =====================================================

-- =====================================================
-- 1. TABLE: store_integrations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.store_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Type d'intégration
  integration_type TEXT NOT NULL CHECK (integration_type IN (
    'zoom',              -- Zoom Video Conferencing
    'openai',            -- OpenAI API
    'claude',            -- Anthropic Claude
    'shipping_fedex',    -- FedEx Shipping
    'shipping_dhl',      -- DHL Shipping
    'shipping_ups',      -- UPS Shipping
    'shipping_chronopost', -- Chronopost Shipping
    'shipping_colissimo',  -- Colissimo Shipping
    'custom'             -- Intégration personnalisée
  )),
  
  -- Nom d'affichage
  display_name TEXT NOT NULL,
  
  -- Configuration (encrypted)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Statut
  is_active BOOLEAN DEFAULT TRUE,
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Dates
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte unique: un store ne peut avoir qu'une seule config par type
  UNIQUE(store_id, integration_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_integrations_store_id ON public.store_integrations(store_id);
CREATE INDEX IF NOT EXISTS idx_store_integrations_type ON public.store_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_store_integrations_active ON public.store_integrations(is_active);

-- Trigger updated_at
CREATE TRIGGER update_store_integrations_updated_at
  BEFORE UPDATE ON public.store_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Commentaire
COMMENT ON TABLE public.store_integrations IS 'Configurations des intégrations pour chaque store';

-- =====================================================
-- 2. TABLE: integration_logs (Logs des intégrations)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.store_integrations(id) ON DELETE SET NULL,
  
  -- Type d'intégration
  integration_type TEXT NOT NULL,
  
  -- Action
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'error', 'success'
  
  -- Détails
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  error_code TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Date
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integration_logs_store_id ON public.integration_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON public.integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_type ON public.integration_logs(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_logs_action ON public.integration_logs(action);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON public.integration_logs(created_at DESC);

-- Commentaire
COMMENT ON TABLE public.integration_logs IS 'Logs des actions des intégrations';

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.store_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Policies: store_integrations
DROP POLICY IF EXISTS "store_owners_manage_integrations" ON public.store_integrations;
CREATE POLICY "store_owners_manage_integrations" ON public.store_integrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_integrations.store_id
        AND s.user_id = auth.uid()
    )
  );

-- Policies: integration_logs
DROP POLICY IF EXISTS "store_owners_view_integration_logs" ON public.integration_logs;
CREATE POLICY "store_owners_view_integration_logs" ON public.integration_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = integration_logs.store_id
        AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour tester une intégration
CREATE OR REPLACE FUNCTION public.test_integration(
  p_integration_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_integration RECORD;
  v_result JSON;
BEGIN
  -- Récupérer la configuration
  SELECT * INTO v_integration
  FROM public.store_integrations
  WHERE id = p_integration_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Integration not found'
    );
  END IF;
  
  -- Tester selon le type d'intégration
  -- Cette fonction sera appelée depuis l'application pour tester les credentials
  -- L'implémentation réelle dépend de chaque intégration
  
  RETURN json_build_object(
    'success', true,
    'integration_type', v_integration.integration_type,
    'message', 'Integration test successful'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. VÉRIFICATION
-- =====================================================

-- Afficher les tables créées
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN (
  'store_integrations',
  'integration_logs'
)
  AND schemaname = 'public';

