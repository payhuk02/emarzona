-- =====================================================
-- Migration: Système de Packages Services
-- Date: 1 Février 2025
-- Description: Packages de services (ex: 10 séances coaching)
-- =====================================================

-- Correction: Gérer le renommage de service_id en service_product_id et s'assurer que store_id existe
DO $$
BEGIN
  -- Vérifier si la table existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_packages'
  ) THEN
    -- Si la colonne service_id existe, la renommer
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'service_packages' 
      AND column_name = 'service_id'
    ) THEN
      -- Supprimer l'ancien index si il existe
      DROP INDEX IF EXISTS idx_service_packages_service_id;
      
      -- Supprimer la contrainte de clé étrangère si elle existe
      ALTER TABLE public.service_packages 
        DROP CONSTRAINT IF EXISTS service_packages_service_id_fkey;
      
      -- Renommer la colonne
      ALTER TABLE public.service_packages 
        RENAME COLUMN service_id TO service_product_id;
      
      -- Recréer la contrainte de clé étrangère vers service_products
      ALTER TABLE public.service_packages
        ADD CONSTRAINT service_packages_service_product_id_fkey
        FOREIGN KEY (service_product_id)
        REFERENCES public.service_products(id)
        ON DELETE CASCADE;
    END IF;
    
    -- Si la colonne service_product_id n'existe toujours pas, l'ajouter
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'service_packages' 
      AND column_name = 'service_product_id'
    ) THEN
      -- Ajouter la colonne service_product_id
      ALTER TABLE public.service_packages
        ADD COLUMN service_product_id UUID;
      
      -- Ajouter la contrainte de clé étrangère
      ALTER TABLE public.service_packages
        ADD CONSTRAINT service_packages_service_product_id_fkey
        FOREIGN KEY (service_product_id)
        REFERENCES public.service_products(id)
        ON DELETE CASCADE;
    END IF;
    
    -- S'assurer que store_id existe
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'service_packages' 
      AND column_name = 'store_id'
    ) THEN
      -- Ajouter la colonne store_id
      ALTER TABLE public.service_packages
        ADD COLUMN store_id UUID;
      
      -- Ajouter la contrainte de clé étrangère vers stores
      ALTER TABLE public.service_packages
        ADD CONSTRAINT service_packages_store_id_fkey
        FOREIGN KEY (store_id)
        REFERENCES public.stores(id)
        ON DELETE CASCADE;
    END IF;
    
    -- S'assurer que product_id existe
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'service_packages' 
      AND column_name = 'product_id'
    ) THEN
      -- Ajouter la colonne product_id
      ALTER TABLE public.service_packages
        ADD COLUMN product_id UUID;
      
      -- Ajouter la contrainte de clé étrangère vers products
      ALTER TABLE public.service_packages
        ADD CONSTRAINT service_packages_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES public.products(id)
        ON DELETE CASCADE;
    END IF;
    
    -- Ajouter toutes les autres colonnes nécessaires si elles n'existent pas
    -- Informations package
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'name') THEN
      ALTER TABLE public.service_packages ADD COLUMN name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'description') THEN
      ALTER TABLE public.service_packages ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'slug') THEN
      ALTER TABLE public.service_packages ADD COLUMN slug TEXT;
    END IF;
    
    -- Configuration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'sessions_count') THEN
      ALTER TABLE public.service_packages ADD COLUMN sessions_count INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'price') THEN
      ALTER TABLE public.service_packages ADD COLUMN price NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'compare_at_price') THEN
      ALTER TABLE public.service_packages ADD COLUMN compare_at_price NUMERIC;
    END IF;
    
    -- Gestion crédits
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'credits_per_session') THEN
      ALTER TABLE public.service_packages ADD COLUMN credits_per_session INTEGER DEFAULT 1;
    END IF;
    
    -- Note: total_credits est une colonne générée, on ne peut pas l'ajouter directement avec ALTER TABLE
    -- Elle sera créée automatiquement lors de la création de la table si elle n'existe pas
    -- Si la table existe déjà sans cette colonne, il faudrait recréer la table (non recommandé en production)
    -- Pour l'instant, on laisse la création de la table gérer cette colonne
    
    -- Expiration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'expires_in_days') THEN
      ALTER TABLE public.service_packages ADD COLUMN expires_in_days INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'expires_at') THEN
      ALTER TABLE public.service_packages ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;
    
    -- Statut
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'is_active') THEN
      ALTER TABLE public.service_packages ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'is_featured') THEN
      ALTER TABLE public.service_packages ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Métadonnées
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'image_url') THEN
      ALTER TABLE public.service_packages ADD COLUMN image_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'terms_and_conditions') THEN
      ALTER TABLE public.service_packages ADD COLUMN terms_and_conditions TEXT;
    END IF;
    
    -- Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'created_at') THEN
      ALTER TABLE public.service_packages ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_packages' AND column_name = 'updated_at') THEN
      ALTER TABLE public.service_packages ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Table pour packages services
CREATE TABLE IF NOT EXISTS public.service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_product_id UUID NOT NULL REFERENCES public.service_products(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Informations package
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  
  -- Configuration
  sessions_count INTEGER NOT NULL, -- Nombre de séances incluses
  price NUMERIC NOT NULL, -- Prix total du package
  compare_at_price NUMERIC, -- Prix barré (optionnel)
  
  -- Gestion crédits
  credits_per_session INTEGER DEFAULT 1, -- Crédits nécessaires par séance
  total_credits INTEGER GENERATED ALWAYS AS (sessions_count * credits_per_session) STORED,
  
  -- Expiration
  expires_in_days INTEGER, -- Nombre de jours avant expiration (NULL = pas d'expiration)
  expires_at TIMESTAMPTZ, -- Date d'expiration calculée
  
  -- Statut
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Métadonnées
  image_url TEXT,
  terms_and_conditions TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, slug)
);

-- Table pour achats de packages
CREATE TABLE IF NOT EXISTS public.service_package_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.service_packages(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Crédits
  total_credits INTEGER NOT NULL,
  remaining_credits INTEGER NOT NULL,
  used_credits INTEGER DEFAULT 0,
  
  -- Expiration
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_expired BOOLEAN DEFAULT FALSE,
  
  -- Statut
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour utilisation des crédits
CREATE TABLE IF NOT EXISTS public.service_package_credits_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.service_package_purchases(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.service_bookings(id) ON DELETE SET NULL,
  
  -- Utilisation
  credits_used INTEGER NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Métadonnées
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
DROP INDEX IF EXISTS idx_service_packages_service_id;
CREATE INDEX IF NOT EXISTS idx_service_packages_service_product_id ON public.service_packages(service_product_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_product_id ON public.service_packages(product_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_store_id ON public.service_packages(store_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON public.service_packages(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_service_packages_featured ON public.service_packages(is_featured) WHERE is_featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_package_purchases_user_id ON public.service_package_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_package_purchases_package_id ON public.service_package_purchases(package_id);
CREATE INDEX IF NOT EXISTS idx_package_purchases_status ON public.service_package_purchases(status);
CREATE INDEX IF NOT EXISTS idx_package_purchases_expires_at ON public.service_package_purchases(expires_at);

CREATE INDEX IF NOT EXISTS idx_credits_usage_purchase_id ON public.service_package_credits_usage(purchase_id);
CREATE INDEX IF NOT EXISTS idx_credits_usage_booking_id ON public.service_package_credits_usage(booking_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_service_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_service_packages_updated_at ON public.service_packages;
CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON public.service_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_service_packages_updated_at();

-- Trigger pour calculer expires_at lors de l'achat
CREATE OR REPLACE FUNCTION calculate_package_expires_at()
RETURNS TRIGGER AS $$
DECLARE
  package_expires_in_days INTEGER;
BEGIN
  SELECT expires_in_days INTO package_expires_in_days
  FROM public.service_packages
  WHERE id = NEW.package_id;
  
  IF package_expires_in_days IS NOT NULL THEN
    NEW.expires_at = NEW.purchased_at + (package_expires_in_days || ' days')::INTERVAL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_package_expires_at_trigger ON public.service_package_purchases;
CREATE TRIGGER calculate_package_expires_at_trigger
  BEFORE INSERT ON public.service_package_purchases
  FOR EACH ROW
  EXECUTE FUNCTION calculate_package_expires_at();

-- Trigger pour mettre à jour remaining_credits lors utilisation
CREATE OR REPLACE FUNCTION update_package_credits()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.service_package_purchases
  SET 
    used_credits = used_credits + NEW.credits_used,
    remaining_credits = remaining_credits - NEW.credits_used,
    updated_at = NOW()
  WHERE id = NEW.purchase_id;
  
  -- Marquer comme complété si plus de crédits
  UPDATE public.service_package_purchases
  SET status = 'completed'
  WHERE id = NEW.purchase_id
  AND remaining_credits <= 0
  AND status = 'active';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_package_credits_trigger ON public.service_package_credits_usage;
CREATE TRIGGER update_package_credits_trigger
  AFTER INSERT ON public.service_package_credits_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_package_credits();

-- Fonction pour vérifier expiration packages
CREATE OR REPLACE FUNCTION check_expired_packages()
RETURNS void AS $$
BEGIN
  UPDATE public.service_package_purchases
  SET 
    status = 'expired',
    is_expired = TRUE,
    updated_at = NOW()
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW()
  AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_package_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_package_credits_usage ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "service_packages_select_public" ON public.service_packages;
DROP POLICY IF EXISTS "service_packages_manage_owners" ON public.service_packages;
DROP POLICY IF EXISTS "service_packages_manage_admins" ON public.service_packages;
DROP POLICY IF EXISTS "package_purchases_select_own" ON public.service_package_purchases;
DROP POLICY IF EXISTS "credits_usage_select_own" ON public.service_package_credits_usage;

-- Policy: Lecture publique des packages actifs
CREATE POLICY "service_packages_select_public"
  ON public.service_packages FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = service_packages.product_id
      AND p.is_active = TRUE
    )
  );

-- Policy: Propriétaires peuvent gérer leurs packages
CREATE POLICY "service_packages_manage_owners"
  ON public.service_packages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = service_packages.store_id
      AND s.user_id = auth.uid()
    )
  );

-- Policy: Admins peuvent tout gérer
CREATE POLICY "service_packages_manage_admins"
  ON public.service_packages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Policy: Utilisateurs peuvent voir leurs achats
CREATE POLICY "package_purchases_select_own"
  ON public.service_package_purchases FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Utilisateurs peuvent voir leur utilisation
CREATE POLICY "credits_usage_select_own"
  ON public.service_package_credits_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_package_purchases sp
      WHERE sp.id = service_package_credits_usage.purchase_id
      AND sp.user_id = auth.uid()
    )
  );

-- Commentaires
COMMENT ON TABLE public.service_packages IS 'Packages de services (ex: 10 séances coaching)';
COMMENT ON COLUMN public.service_packages.sessions_count IS 'Nombre de séances incluses dans le package';
COMMENT ON COLUMN public.service_packages.total_credits IS 'Total de crédits généré automatiquement';
COMMENT ON TABLE public.service_package_purchases IS 'Achats de packages par utilisateurs';
COMMENT ON TABLE public.service_package_credits_usage IS 'Historique utilisation crédits packages';
