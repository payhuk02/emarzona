-- =====================================================
-- PAYHUK BATCH SHIPPING SYSTEM
-- Date: 27 Janvier 2025
-- Description: Système de traitement par lots pour expéditions et génération d'étiquettes multiples
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. TABLE: batch_shipments
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'batch_shipments'
  ) THEN
    CREATE TABLE public.batch_shipments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      
      -- Identification
      batch_number TEXT UNIQUE NOT NULL, -- Numéro de lot unique
      batch_name TEXT, -- Nom du lot (optionnel)
      
      -- Statut
      status TEXT NOT NULL CHECK (status IN (
        'pending',        -- En attente
        'processing',     -- En traitement
        'label_generated', -- Étiquettes générées
        'shipped',        -- Expédié
        'completed',      -- Complété
        'cancelled'       -- Annulé
      )) DEFAULT 'pending',
      
      -- Informations
      total_orders INTEGER NOT NULL DEFAULT 0, -- Nombre total de commandes
      processed_orders INTEGER NOT NULL DEFAULT 0, -- Commandes traitées
      failed_orders INTEGER NOT NULL DEFAULT 0, -- Commandes échouées
      
      -- Transporteur
      carrier_id UUID REFERENCES public.shipping_carriers(id),
      carrier_name TEXT, -- Nom du transporteur (DHL, FedEx, etc.)
      
      -- Métadonnées
      created_by UUID REFERENCES auth.users(id),
      processed_by UUID REFERENCES auth.users(id),
      processed_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      
      -- Notes
      notes TEXT,
      error_log JSONB DEFAULT '[]', -- Log des erreurs
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour batch_shipments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_batch_shipments_store_id'
  ) THEN
    CREATE INDEX idx_batch_shipments_store_id ON public.batch_shipments(store_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_batch_shipments_status'
  ) THEN
    CREATE INDEX idx_batch_shipments_status ON public.batch_shipments(status);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_batch_shipments_batch_number'
  ) THEN
    CREATE INDEX idx_batch_shipments_batch_number ON public.batch_shipments(batch_number);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_batch_shipments_updated_at'
  ) THEN
    CREATE TRIGGER update_batch_shipments_updated_at
      BEFORE UPDATE ON public.batch_shipments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 2. TABLE: batch_shipment_orders
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'batch_shipment_orders'
  ) THEN
    CREATE TABLE public.batch_shipment_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_shipment_id UUID NOT NULL REFERENCES public.batch_shipments(id) ON DELETE CASCADE,
      order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      
      -- Ordre dans le lot
      order_in_batch INTEGER NOT NULL,
      
      -- Statut dans le lot
      status TEXT NOT NULL CHECK (status IN (
        'pending',        -- En attente
        'processing',     -- En traitement
        'label_generated', -- Étiquette générée
        'shipped',        -- Expédié
        'failed',         -- Échoué
        'skipped'         -- Ignoré
      )) DEFAULT 'pending',
      
      -- Étiquette d'expédition
      shipping_label_id UUID REFERENCES public.shipping_labels(id),
      tracking_number TEXT,
      
      -- Erreurs
      error_message TEXT,
      error_details JSONB,
      
      -- Métadonnées
      processed_at TIMESTAMPTZ,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(batch_shipment_id, order_id)
    );
  END IF;
END $$;

-- Indexes pour batch_shipment_orders
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_batch_shipment_orders_batch_id'
  ) THEN
    CREATE INDEX idx_batch_shipment_orders_batch_id ON public.batch_shipment_orders(batch_shipment_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_batch_shipment_orders_order_id'
  ) THEN
    CREATE INDEX idx_batch_shipment_orders_order_id ON public.batch_shipment_orders(order_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_batch_shipment_orders_status'
  ) THEN
    CREATE INDEX idx_batch_shipment_orders_status ON public.batch_shipment_orders(status);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_batch_shipment_orders_updated_at'
  ) THEN
    CREATE TRIGGER update_batch_shipment_orders_updated_at
      BEFORE UPDATE ON public.batch_shipment_orders
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 3. TABLE: batch_label_templates
-- =====================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'batch_label_templates'
  ) THEN
    CREATE TABLE public.batch_label_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      
      -- Template
      template_name TEXT NOT NULL,
      template_type TEXT NOT NULL CHECK (template_type IN (
        '4x6',      -- Étiquette 4x6 pouces
        'a4',       -- Format A4
        'thermal',  -- Étiquette thermique
        'custom'    -- Format personnalisé
      )),
      
      -- Configuration
      layout_config JSONB DEFAULT '{}', -- Configuration de mise en page
      include_tracking BOOLEAN DEFAULT true,
      include_barcode BOOLEAN DEFAULT true,
      include_instructions BOOLEAN DEFAULT false,
      
      -- Métadonnées
      is_default BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Indexes pour batch_label_templates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_batch_label_templates_store_id'
  ) THEN
    CREATE INDEX idx_batch_label_templates_store_id ON public.batch_label_templates(store_id);
  END IF;
END $$;

-- Trigger updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_batch_label_templates_updated_at'
  ) THEN
    CREATE TRIGGER update_batch_label_templates_updated_at
      BEFORE UPDATE ON public.batch_label_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- Fonction pour générer un numéro de lot unique
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'generate_batch_shipment_number'
  ) THEN
    DROP FUNCTION public.generate_batch_shipment_number();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_batch_shipment_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT := 'BATCH';
  v_date TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
  v_sequence INTEGER;
  v_batch_number TEXT;
BEGIN
  -- Générer un numéro séquentiel unique pour la journée
  SELECT COALESCE(MAX(CAST(SUBSTRING(batch_number FROM LENGTH(v_prefix || v_date) + 1) AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.batch_shipments
  WHERE batch_number LIKE v_prefix || v_date || '%';
  
  v_batch_number := v_prefix || v_date || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_batch_number;
END;
$$;

-- Fonction pour mettre à jour le statut d'un lot
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_batch_shipment_status'
  ) THEN
    DROP FUNCTION public.update_batch_shipment_status(UUID);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_batch_shipment_status(p_batch_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INTEGER;
  v_processed INTEGER;
  v_failed INTEGER;
  v_shipped INTEGER;
  v_new_status TEXT;
BEGIN
  -- Compter les commandes
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('label_generated', 'shipped')),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*) FILTER (WHERE status = 'shipped')
  INTO v_total, v_processed, v_failed, v_shipped
  FROM public.batch_shipment_orders
  WHERE batch_shipment_id = p_batch_id;
  
  -- Mettre à jour les compteurs
  UPDATE public.batch_shipments
  SET 
    total_orders = v_total,
    processed_orders = v_processed,
    failed_orders = v_failed,
    updated_at = NOW()
  WHERE id = p_batch_id;
  
  -- Déterminer le nouveau statut
  IF v_shipped = v_total AND v_total > 0 THEN
    v_new_status := 'completed';
  ELSIF v_processed > 0 THEN
    v_new_status := 'label_generated';
  ELSE
    v_new_status := 'processing';
  END IF;
  
  -- Mettre à jour le statut si nécessaire
  UPDATE public.batch_shipments
  SET 
    status = v_new_status,
    completed_at = CASE WHEN v_new_status = 'completed' THEN NOW() ELSE completed_at END
  WHERE id = p_batch_id AND status != v_new_status;
END;
$$;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS
ALTER TABLE public.batch_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_shipment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_label_templates ENABLE ROW LEVEL SECURITY;

-- Policies pour batch_shipments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'batch_shipments' AND policyname = 'Store owners can manage batches'
  ) THEN
    CREATE POLICY "Store owners can manage batches" ON public.batch_shipments
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = batch_shipments.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour batch_shipment_orders
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'batch_shipment_orders' AND policyname = 'Store owners can view batch orders'
  ) THEN
    CREATE POLICY "Store owners can view batch orders" ON public.batch_shipment_orders
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.batch_shipments bs
          INNER JOIN public.stores s ON s.id = bs.store_id
          WHERE bs.id = batch_shipment_orders.batch_shipment_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policies pour batch_label_templates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'batch_label_templates' AND policyname = 'Store owners can manage templates'
  ) THEN
    CREATE POLICY "Store owners can manage templates" ON public.batch_label_templates
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = batch_label_templates.store_id
          AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

