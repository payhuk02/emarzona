-- ============================================================
-- CORRECTION COMPLÈTE : Structure de la table email_templates
-- Date: 1er Février 2025
-- Description: Ajoute toutes les colonnes manquantes à email_templates
-- ============================================================

-- ============================================================
-- 1. AJOUTER TOUTES LES COLONNES MANQUANTES
-- ============================================================

DO $$
BEGIN
  -- Colonne: product_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'product_type'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN product_type TEXT;
    
    COMMENT ON COLUMN public.email_templates.product_type IS 
      'Type de produit: digital | physical | service | course | artist | NULL (tous)';
    
    RAISE NOTICE 'Colonne product_type ajoutée à email_templates';
  END IF;

  -- Colonne: is_default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'is_default'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN is_default BOOLEAN DEFAULT FALSE;
    
    COMMENT ON COLUMN public.email_templates.is_default IS 
      'Template par défaut pour ce type de produit';
    
    RAISE NOTICE 'Colonne is_default ajoutée à email_templates';
  END IF;

  -- Colonne: variables (si manquante)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'variables'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN variables JSONB DEFAULT '[]'::jsonb;
    
    COMMENT ON COLUMN public.email_templates.variables IS 
      'Liste des variables: ["{{user_name}}", "{{order_id}}"]';
    
    RAISE NOTICE 'Colonne variables ajoutée à email_templates';
  END IF;

  -- Colonne: sendgrid_template_id (si manquante)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'sendgrid_template_id'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN sendgrid_template_id TEXT;
    
    RAISE NOTICE 'Colonne sendgrid_template_id ajoutée à email_templates';
  END IF;

  -- Colonne: from_email (si manquante)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'from_email'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN from_email TEXT DEFAULT 'noreply@emarzona.com';
    
    RAISE NOTICE 'Colonne from_email ajoutée à email_templates';
  END IF;

  -- Colonne: from_name (si manquante)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'from_name'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN from_name TEXT DEFAULT 'Emarzona';
    
    RAISE NOTICE 'Colonne from_name ajoutée à email_templates';
  END IF;

  -- Colonne: reply_to (si manquante)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'reply_to'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN reply_to TEXT;
    
    RAISE NOTICE 'Colonne reply_to ajoutée à email_templates';
  END IF;

  -- Colonne: is_active (si manquante)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    
    RAISE NOTICE 'Colonne is_active ajoutée à email_templates';
  END IF;

  -- Colonne: sent_count (si manquante)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'sent_count'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN sent_count INTEGER DEFAULT 0;
    
    RAISE NOTICE 'Colonne sent_count ajoutée à email_templates';
  END IF;

  -- Colonne: open_rate (si manquante)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'open_rate'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN open_rate DECIMAL(5,2) DEFAULT 0.00;
    
    RAISE NOTICE 'Colonne open_rate ajoutée à email_templates';
  END IF;

  -- Colonne: click_rate (si manquante)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'click_rate'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN click_rate DECIMAL(5,2) DEFAULT 0.00;
    
    RAISE NOTICE 'Colonne click_rate ajoutée à email_templates';
  END IF;

  -- Colonne: text_content (si manquante)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'text_content'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN text_content JSONB;
    
    RAISE NOTICE 'Colonne text_content ajoutée à email_templates';
  END IF;

  -- Colonne: created_by (si manquante)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.email_templates
    ADD COLUMN created_by UUID REFERENCES auth.users(id);
    
    RAISE NOTICE 'Colonne created_by ajoutée à email_templates';
  END IF;

END $$;

-- ============================================================
-- 2. CRÉER LES INDEXES (seulement si les colonnes existent)
-- ============================================================

-- Index sur product_type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'product_type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_email_templates_product_type 
      ON public.email_templates(product_type);
    RAISE NOTICE 'Index idx_email_templates_product_type créé';
  END IF;
END $$;

-- Index sur is_active
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_email_templates_is_active 
      ON public.email_templates(is_active);
    RAISE NOTICE 'Index idx_email_templates_is_active créé';
  END IF;
END $$;

-- Index unique pour templates par défaut (seulement si product_type et is_default existent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'product_type'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'is_default'
  ) THEN
    -- Supprimer l'index s'il existe avec une ancienne définition
    DROP INDEX IF EXISTS idx_email_templates_default;
    
    -- Créer le nouvel index
    CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_default 
      ON public.email_templates(category, product_type) 
      WHERE is_default = TRUE;
    
    RAISE NOTICE 'Index unique idx_email_templates_default créé';
  END IF;
END $$;

-- Index sur category (s'il n'existe pas)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'category'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_email_templates_category 
      ON public.email_templates(category);
    RAISE NOTICE 'Index idx_email_templates_category créé';
  END IF;
END $$;

-- Index sur slug (s'il n'existe pas)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'email_templates'
    AND column_name = 'slug'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_email_templates_slug 
      ON public.email_templates(slug);
    RAISE NOTICE 'Index idx_email_templates_slug créé';
  END IF;
END $$;

-- ============================================================
-- 3. METTRE À JOUR LES COMMENTAIRES
-- ============================================================

COMMENT ON TABLE public.email_templates IS 
  'Templates d''emails universels pour tous types de produits (digital, physical, service, course, artist)';

