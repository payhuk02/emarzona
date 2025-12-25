-- =========================================================
-- Migration : Système de Liste d'Attente pour Services
-- Date : 1 Février 2025
-- Description : Système complet de waitlist pour services avec notifications automatiques
-- =========================================================

-- ============================================================
-- 1. TABLE: service_waitlist
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations client
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN (
    'waiting',      -- En attente
    'notified',     -- Notifié (créneau disponible)
    'converted',    -- Converti en réservation
    'expired',      -- Expiré (pas de réponse)
    'cancelled'     -- Annulé par le client
  )),
  
  -- Priorité
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN (
    'normal',       -- Priorité normale
    'high',         -- Priorité élevée
    'urgent'        -- Priorité urgente
  )),
  
  -- Position dans la liste
  position INTEGER NOT NULL DEFAULT 1,
  
  -- Préférences
  preferred_date DATE,
  preferred_time TIME,
  preferred_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,
  
  -- Notifications
  notified_at TIMESTAMPTZ,
  notification_count INTEGER DEFAULT 0,
  last_notification_sent_at TIMESTAMPTZ,
  
  -- Conversion
  converted_to_booking_id UUID REFERENCES public.service_bookings(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  
  -- Expiration
  expires_at TIMESTAMPTZ, -- Date d'expiration de la demande
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(service_id, user_id, status) -- Un utilisateur ne peut être qu'une fois en attente par service
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_waitlist_service_id ON public.service_waitlist(service_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_store_id ON public.service_waitlist(store_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON public.service_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.service_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON public.service_waitlist(service_id, position);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.service_waitlist(created_at DESC);

-- ============================================================
-- 3. FUNCTIONS
-- ============================================================

-- Fonction pour calculer la position dans la waitlist
CREATE OR REPLACE FUNCTION calculate_waitlist_position(p_service_id UUID, p_waitlist_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_position INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1
  INTO v_position
  FROM public.service_waitlist
  WHERE service_id = p_service_id
    AND status = 'waiting'
    AND id != p_waitlist_id;
  
  RETURN v_position;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour notifier automatiquement les clients en waitlist
CREATE OR REPLACE FUNCTION notify_waitlist_customers(p_service_id UUID, p_available_slot_date DATE, p_available_slot_time TIME)
RETURNS INTEGER AS $$
DECLARE
  v_notified_count INTEGER := 0;
  v_waitlist_entry RECORD;
BEGIN
  -- Trouver les clients en attente pour ce service
  FOR v_waitlist_entry IN
    SELECT *
    FROM public.service_waitlist
    WHERE service_id = p_service_id
      AND status = 'waiting'
      AND (preferred_date IS NULL OR preferred_date = p_available_slot_date)
      AND (preferred_time IS NULL OR preferred_time = p_available_slot_time)
    ORDER BY 
      CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        ELSE 3
      END,
      position ASC
    LIMIT 10 -- Notifier les 10 premiers
  LOOP
    -- Mettre à jour le statut
    UPDATE public.service_waitlist
    SET 
      status = 'notified',
      notified_at = now(),
      notification_count = notification_count + 1,
      last_notification_sent_at = now()
    WHERE id = v_waitlist_entry.id;
    
    v_notified_count := v_notified_count + 1;
  END LOOP;
  
  RETURN v_notified_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour convertir une entrée waitlist en réservation
CREATE OR REPLACE FUNCTION convert_waitlist_to_booking(p_waitlist_id UUID, p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_waitlist_entry RECORD;
BEGIN
  -- Récupérer l'entrée waitlist
  SELECT * INTO v_waitlist_entry
  FROM public.service_waitlist
  WHERE id = p_waitlist_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mettre à jour le statut
  UPDATE public.service_waitlist
  SET 
    status = 'converted',
    converted_to_booking_id = p_booking_id,
    converted_at = now()
  WHERE id = p_waitlist_id;
  
  -- Réorganiser les positions des autres entrées
  UPDATE public.service_waitlist
  SET position = position - 1
  WHERE service_id = v_waitlist_entry.service_id
    AND status = 'waiting'
    AND position > v_waitlist_entry.position;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_service_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_service_waitlist_updated_at'
  ) THEN
    CREATE TRIGGER update_service_waitlist_updated_at
    BEFORE UPDATE ON public.service_waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_service_waitlist_updated_at();
  END IF;
END $$;

-- Trigger pour calculer automatiquement la position
CREATE OR REPLACE FUNCTION set_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'waiting' AND NEW.position IS NULL THEN
    NEW.position = calculate_waitlist_position(NEW.service_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_waitlist_position'
  ) THEN
    CREATE TRIGGER set_waitlist_position
    BEFORE INSERT ON public.service_waitlist
    FOR EACH ROW
    EXECUTE FUNCTION set_waitlist_position();
  END IF;
END $$;

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

ALTER TABLE public.service_waitlist ENABLE ROW LEVEL SECURITY;

-- Store owners can manage waitlist for their services
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'service_waitlist' AND policyname = 'Store owners can manage waitlist'
  ) THEN
    CREATE POLICY "Store owners can manage waitlist"
    ON public.service_waitlist
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = service_waitlist.store_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Users can view and manage their own waitlist entries
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'service_waitlist' AND policyname = 'Users can manage their waitlist entries'
  ) THEN
    CREATE POLICY "Users can manage their waitlist entries"
    ON public.service_waitlist
    FOR ALL
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Public can view waitlist stats (anonymized)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'service_waitlist' AND policyname = 'Public can view waitlist stats'
  ) THEN
    CREATE POLICY "Public can view waitlist stats"
    ON public.service_waitlist
    FOR SELECT
    USING (true);
  END IF;
END $$;

