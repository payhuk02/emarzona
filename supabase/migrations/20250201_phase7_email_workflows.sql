-- ============================================================
-- PHASE 7 : EMAIL WORKFLOWS - TABLE ET FONCTIONS SQL
-- Date: 1er Février 2025
-- Description: Table pour workflows automatisés email
-- ============================================================

-- ============================================================
-- 1. TABLE: email_workflows
-- Workflows automatisés email
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Trigger
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event', 'time', 'condition')),
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Actions
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{type, config, order}]
  conditions JSONB DEFAULT '{}'::jsonb, -- Conditions supplémentaires
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Métriques
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_workflows_store_id ON public.email_workflows(store_id);
CREATE INDEX IF NOT EXISTS idx_email_workflows_status ON public.email_workflows(status);
CREATE INDEX IF NOT EXISTS idx_email_workflows_trigger_type ON public.email_workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_email_workflows_is_active ON public.email_workflows(is_active);

-- Comments
COMMENT ON TABLE public.email_workflows IS 'Workflows automatisés email avec triggers et actions';
COMMENT ON COLUMN public.email_workflows.trigger_type IS 'Type de déclencheur: event, time, condition';
COMMENT ON COLUMN public.email_workflows.actions IS 'Liste des actions à exécuter dans l''ordre';
COMMENT ON COLUMN public.email_workflows.conditions IS 'Conditions supplémentaires pour l''exécution';

-- ============================================================
-- 2. FUNCTION: execute_email_workflow
-- Exécute un workflow email
-- ============================================================

CREATE OR REPLACE FUNCTION public.execute_email_workflow(
  p_workflow_id UUID,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
  v_workflow RECORD;
  v_action JSONB;
  v_success BOOLEAN := TRUE;
BEGIN
  -- Récupérer le workflow
  SELECT * INTO v_workflow
  FROM public.email_workflows
  WHERE id = p_workflow_id
    AND status = 'active'
    AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found or not active: %', p_workflow_id;
  END IF;
  
  -- Vérifier les conditions
  -- (La logique complète sera implémentée selon les besoins)
  
  -- Exécuter chaque action
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_workflow.actions) ORDER BY (value->>'order')::INTEGER
  LOOP
    -- Exécuter l'action selon son type
    -- (La logique complète sera implémentée dans l'Edge Function)
    
    -- Pour l'instant, on retourne TRUE
    v_success := TRUE;
  END LOOP;
  
  -- Mettre à jour les métriques
  UPDATE public.email_workflows
  SET 
    execution_count = execution_count + 1,
    success_count = CASE WHEN v_success THEN success_count + 1 ELSE success_count END,
    error_count = CASE WHEN NOT v_success THEN error_count + 1 ELSE error_count END,
    last_executed_at = NOW()
  WHERE id = p_workflow_id;
  
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.execute_email_workflow IS 'Exécute un workflow email avec son contexte';

-- ============================================================
-- 3. TRIGGER: update_updated_at
-- ============================================================

CREATE TRIGGER update_email_workflows_updated_at
BEFORE UPDATE ON public.email_workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

ALTER TABLE public.email_workflows ENABLE ROW LEVEL SECURITY;

-- Les vendeurs peuvent gérer leurs propres workflows
CREATE POLICY "Store owners can manage own workflows"
  ON public.email_workflows
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = email_workflows.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage all workflows"
  ON public.email_workflows
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

