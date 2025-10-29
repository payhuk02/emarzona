-- ============================================================================
-- MIGRATION: Digital Product License Management System
-- Date: 2025-10-29
-- Author: Payhula Team
-- Description: Système complet de gestion des licences pour produits digitaux
--              Inspiré de Gumroad, Sellfy, et SendOwl
-- ============================================================================

-- ============================================================================
-- 1. TYPES ENUMS
-- ============================================================================

-- Supprimer les types existants si présents (pour éviter les conflits)
DROP TYPE IF EXISTS license_type CASCADE;
DROP TYPE IF EXISTS license_status CASCADE;
DROP TYPE IF EXISTS activation_status CASCADE;

-- Type de licence
CREATE TYPE license_type AS ENUM (
  'single',      -- Une seule activation
  'multi',       -- Plusieurs activations (ex: 5 devices)
  'unlimited',   -- Activations illimitées
  'subscription' -- Licence par abonnement
);

-- Statut de la licence
CREATE TYPE license_status AS ENUM (
  'active',      -- Licence active et utilisable
  'expired',     -- Licence expirée
  'revoked',     -- Licence révoquée par le vendeur
  'suspended',   -- Licence suspendue temporairement
  'transferred'  -- Licence transférée à un autre utilisateur
);

-- Statut d'activation
CREATE TYPE activation_status AS ENUM (
  'active',      -- Activation en cours
  'deactivated', -- Désactivée par l'utilisateur
  'revoked'      -- Révoquée par le système/vendeur
);

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- Supprimer les tables existantes si présentes (pour développement)
-- ATTENTION: En production, commenter ces lignes après la première migration
DROP TABLE IF EXISTS public.license_events CASCADE;
DROP TABLE IF EXISTS public.license_activations CASCADE;
DROP TABLE IF EXISTS public.digital_product_licenses CASCADE;

-- ============================================================================
-- 2.1 TABLE: digital_product_licenses
-- ============================================================================

CREATE TABLE public.digital_product_licenses (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Clé de licence
  license_key TEXT NOT NULL UNIQUE,
  
  -- Type et configuration
  license_type license_type NOT NULL DEFAULT 'single',
  status license_status NOT NULL DEFAULT 'active',
  
  -- Limites d'activation
  max_activations INTEGER DEFAULT 1,
  current_activations INTEGER DEFAULT 0,
  
  -- Dates
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- NULL = lifetime license
  last_used_at TIMESTAMPTZ,
  
  -- Transfert de licence
  transferable BOOLEAN DEFAULT false,
  transferred_from UUID REFERENCES public.digital_product_licenses(id),
  transferred_to UUID REFERENCES public.digital_product_licenses(id),
  transferred_at TIMESTAMPTZ,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT, -- Notes internes pour le vendeur
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT valid_activations CHECK (current_activations >= 0),
  CONSTRAINT valid_max_activations CHECK (max_activations > 0 OR license_type = 'unlimited'),
  CONSTRAINT activations_within_limit CHECK (
    license_type = 'unlimited' OR 
    current_activations <= max_activations
  )
);

-- Index pour performance
CREATE INDEX idx_licenses_product_id ON public.digital_product_licenses(product_id);
CREATE INDEX idx_licenses_order_id ON public.digital_product_licenses(order_id);
CREATE INDEX idx_licenses_customer_id ON public.digital_product_licenses(customer_id);
CREATE INDEX idx_licenses_store_id ON public.digital_product_licenses(store_id);
CREATE INDEX idx_licenses_key ON public.digital_product_licenses(license_key);
CREATE INDEX idx_licenses_status ON public.digital_product_licenses(status);
CREATE INDEX idx_licenses_expires_at ON public.digital_product_licenses(expires_at);

-- ============================================================================
-- 2.2 TABLE: license_activations
-- ============================================================================

CREATE TABLE public.license_activations (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.digital_product_licenses(id) ON DELETE CASCADE,
  
  -- Informations d'activation
  device_name TEXT,
  device_fingerprint TEXT, -- Hash unique du device (hardware ID, MAC, etc.)
  
  -- Informations réseau
  ip_address INET,
  user_agent TEXT,
  location JSONB, -- {country, city, etc.}
  
  -- Statut
  status activation_status NOT NULL DEFAULT 'active',
  
  -- Dates
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  deactivated_at TIMESTAMPTZ,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contrainte d'unicité : un device ne peut pas être activé 2 fois pour la même licence
  CONSTRAINT unique_license_device UNIQUE (license_id, device_fingerprint)
);

-- Index
CREATE INDEX idx_activations_license_id ON public.license_activations(license_id);
CREATE INDEX idx_activations_status ON public.license_activations(status);
CREATE INDEX idx_activations_device ON public.license_activations(device_fingerprint);
CREATE INDEX idx_activations_ip ON public.license_activations(ip_address);

-- ============================================================================
-- 2.3 TABLE: license_events (Audit trail)
-- ============================================================================

CREATE TABLE public.license_events (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.digital_product_licenses(id) ON DELETE CASCADE,
  activation_id UUID REFERENCES public.license_activations(id) ON DELETE SET NULL,
  
  -- Type d'événement
  event_type TEXT NOT NULL, -- 'issued', 'activated', 'deactivated', 'expired', 'revoked', 'transferred', etc.
  
  -- Détails
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Acteur (qui a déclenché l'événement)
  triggered_by UUID, -- User ID or NULL for system
  
  -- Informations réseau
  ip_address INET,
  user_agent TEXT,
  
  -- Date
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_events_license_id ON public.license_events(license_id);
CREATE INDEX idx_events_type ON public.license_events(event_type);
CREATE INDEX idx_events_created_at ON public.license_events(created_at DESC);

-- ============================================================================
-- 3. FONCTIONS & TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_license_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.digital_product_licenses
  FOR EACH ROW EXECUTE FUNCTION update_license_updated_at();

CREATE TRIGGER update_activations_updated_at
  BEFORE UPDATE ON public.license_activations
  FOR EACH ROW EXECUTE FUNCTION update_license_updated_at();

-- Fonction pour générer une clé de licence unique
CREATE OR REPLACE FUNCTION generate_license_key()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars (I, O, 1, 0)
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Format: XXXX-XXXX-XXXX-XXXX (16 chars)
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    IF i < 4 THEN
      result := result || '-';
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider une licence
CREATE OR REPLACE FUNCTION validate_license(
  p_license_key TEXT,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_license RECORD;
  v_result JSONB;
BEGIN
  -- Récupérer la licence
  SELECT * INTO v_license
  FROM public.digital_product_licenses
  WHERE license_key = p_license_key;
  
  -- Licence introuvable
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'license_not_found',
      'message', 'Clé de licence invalide'
    );
  END IF;
  
  -- Vérifier le statut
  IF v_license.status != 'active' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'license_' || v_license.status,
      'message', 'Cette licence est ' || v_license.status
    );
  END IF;
  
  -- Vérifier l'expiration
  IF v_license.expires_at IS NOT NULL AND v_license.expires_at < now() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'license_expired',
      'message', 'Cette licence a expiré le ' || v_license.expires_at::date
    );
  END IF;
  
  -- Vérifier les activations si un device_fingerprint est fourni
  IF p_device_fingerprint IS NOT NULL THEN
    -- Vérifier si le device est déjà activé
    IF EXISTS (
      SELECT 1 FROM public.license_activations
      WHERE license_id = v_license.id
      AND device_fingerprint = p_device_fingerprint
      AND status = 'active'
    ) THEN
      -- Device déjà activé, c'est OK
      RETURN jsonb_build_object(
        'valid', true,
        'license', row_to_json(v_license),
        'already_activated', true
      );
    END IF;
    
    -- Vérifier la limite d'activations
    IF v_license.license_type != 'unlimited' AND 
       v_license.current_activations >= v_license.max_activations THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'activation_limit_reached',
        'message', 'Limite d''activations atteinte (' || v_license.max_activations || ')',
        'current_activations', v_license.current_activations,
        'max_activations', v_license.max_activations
      );
    END IF;
  END IF;
  
  -- Licence valide
  RETURN jsonb_build_object(
    'valid', true,
    'license', row_to_json(v_license),
    'can_activate', (
      v_license.license_type = 'unlimited' OR 
      v_license.current_activations < v_license.max_activations
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.digital_product_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_events ENABLE ROW LEVEL SECURITY;

-- Policies pour digital_product_licenses

-- Les vendeurs peuvent voir leurs propres licences
CREATE POLICY "Vendors can view their licenses"
  ON public.digital_product_licenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = digital_product_licenses.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Les clients peuvent voir leurs licences via leur email (customer_id → email)
-- Note: Customers n'ont pas de user_id, on utilise l'email de la commande
CREATE POLICY "Customers can view their licenses"
  ON public.digital_product_licenses
  FOR SELECT
  USING (
    customer_id IN (
      SELECT c.id FROM public.customers c
      JOIN auth.users u ON u.email = c.email
      WHERE u.id = auth.uid()
    )
  );

-- Les vendeurs peuvent créer des licences pour leurs produits
CREATE POLICY "Vendors can create licenses"
  ON public.digital_product_licenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = digital_product_licenses.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Les vendeurs peuvent mettre à jour leurs licences
CREATE POLICY "Vendors can update their licenses"
  ON public.digital_product_licenses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = digital_product_licenses.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Policies pour license_activations

-- Les vendeurs et clients peuvent voir les activations
CREATE POLICY "Users can view activations"
  ON public.license_activations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_product_licenses l
      WHERE l.id = license_activations.license_id
      AND (
        -- Vendeur
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = l.store_id AND s.user_id = auth.uid()
        )
        OR
        -- Client (via email)
        l.customer_id IN (
          SELECT c.id FROM public.customers c
          JOIN auth.users u ON u.email = c.email
          WHERE u.id = auth.uid()
        )
      )
    )
  );

-- Les clients peuvent créer des activations pour leurs licences
CREATE POLICY "Customers can create activations"
  ON public.license_activations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.digital_product_licenses l
      WHERE l.id = license_activations.license_id
      AND l.customer_id IN (
        SELECT c.id FROM public.customers c
        JOIN auth.users u ON u.email = c.email
        WHERE u.id = auth.uid()
      )
      AND l.status = 'active'
    )
  );

-- Policies pour license_events (lecture seule)
CREATE POLICY "Users can view events"
  ON public.license_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.digital_product_licenses l
      WHERE l.id = license_events.license_id
      AND (
        -- Vendeur
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = l.store_id AND s.user_id = auth.uid()
        )
        OR
        -- Client (via email)
        l.customer_id IN (
          SELECT c.id FROM public.customers c
          JOIN auth.users u ON u.email = c.email
          WHERE u.id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- 5. COMMENTAIRES & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.digital_product_licenses IS 
'Licences de produits digitaux avec gestion des activations, expirations, et transferts';

COMMENT ON TABLE public.license_activations IS 
'Activations de licences sur différents appareils avec tracking';

COMMENT ON TABLE public.license_events IS 
'Historique des événements de licence pour audit et tracking';

COMMENT ON COLUMN public.digital_product_licenses.license_key IS 
'Clé de licence unique au format XXXX-XXXX-XXXX-XXXX';

COMMENT ON COLUMN public.digital_product_licenses.max_activations IS 
'Nombre maximum d''activations autorisées (NULL pour unlimited)';

COMMENT ON COLUMN public.license_activations.device_fingerprint IS 
'Empreinte unique du device (hash de hardware ID, MAC, etc.)';

COMMENT ON FUNCTION generate_license_key() IS 
'Génère une clé de licence unique au format XXXX-XXXX-XXXX-XXXX';

COMMENT ON FUNCTION validate_license(TEXT, TEXT) IS 
'Valide une licence et vérifie les limites d''activation';

-- ============================================================================
-- 6. DONNÉES DE TEST (OPTIONNEL - Commenté par défaut)
-- ============================================================================

/*
-- Exemple d'insertion de licence de test
INSERT INTO public.digital_product_licenses (
  product_id,
  store_id,
  license_key,
  license_type,
  max_activations
) VALUES (
  'uuid-of-product',
  'uuid-of-store',
  generate_license_key(),
  'multi',
  5
);
*/

