-- =========================================================
-- Migration : Intégration Calendriers Externes pour Services
-- Date : 31 Janvier 2025
-- Description : Système d'intégration avec Google Calendar et Outlook
-- =========================================================

-- ============================================================
-- 1. TABLE: service_calendar_integrations
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.products(id) ON DELETE CASCADE, -- NULL = tous les services du store
  
  -- Type de calendrier
  calendar_type TEXT NOT NULL CHECK (calendar_type IN (
    'google_calendar',
    'outlook',
    'ical',
    'other'
  )),
  
  -- Informations d'authentification (chiffrées)
  access_token TEXT NOT NULL, -- Token d'accès (chiffré)
  refresh_token TEXT, -- Token de rafraîchissement (chiffré)
  token_expires_at TIMESTAMPTZ, -- Expiration du token
  
  -- Informations calendrier
  calendar_id TEXT NOT NULL, -- ID du calendrier externe
  calendar_name TEXT, -- Nom du calendrier
  calendar_email TEXT, -- Email associé au calendrier
  
  -- Options de synchronisation
  sync_direction TEXT NOT NULL DEFAULT 'bidirectional' CHECK (sync_direction IN (
    'one_way_import',    -- Import uniquement (externe → Emarzona)
    'one_way_export',    -- Export uniquement (Emarzona → externe)
    'bidirectional'      -- Synchronisation bidirectionnelle
  )),
  auto_sync BOOLEAN DEFAULT true, -- Synchronisation automatique
  sync_interval_minutes INTEGER DEFAULT 15, -- Intervalle de synchronisation
  
  -- Options de création d'événements
  create_events_for_bookings BOOLEAN DEFAULT true, -- Créer événements pour réservations
  create_events_for_availability BOOLEAN DEFAULT false, -- Créer événements pour disponibilités
  event_title_template TEXT DEFAULT '{service_name} - {customer_name}', -- Template titre événement
  event_description_template TEXT, -- Template description événement
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ, -- Dernière synchronisation
  last_sync_status TEXT, -- 'success', 'error', 'partial'
  last_sync_error TEXT, -- Dernière erreur de synchronisation
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb, -- Données additionnelles
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(store_id, service_id, calendar_type, calendar_id)
);

-- ============================================================
-- 2. TABLE: service_calendar_events
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.service_calendar_integrations(id) ON DELETE CASCADE,
  
  -- Lien avec réservation/service
  booking_id UUID REFERENCES public.service_bookings(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Informations événement externe
  external_event_id TEXT NOT NULL, -- ID de l'événement dans le calendrier externe
  external_calendar_id TEXT NOT NULL, -- ID du calendrier externe
  
  -- Informations événement
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_start_time TIMESTAMPTZ NOT NULL,
  event_end_time TIMESTAMPTZ NOT NULL,
  event_location TEXT,
  event_timezone TEXT DEFAULT 'Africa/Ouagadougou',
  
  -- Participants
  attendees JSONB DEFAULT '[]'::jsonb, -- [{email, name, status}]
  organizer_email TEXT,
  organizer_name TEXT,
  
  -- Statut de synchronisation
  sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN (
    'pending',         -- En attente de synchronisation
    'syncing',         -- Synchronisation en cours
    'synced',          -- Synchronisé
    'error',           -- Erreur de synchronisation
    'conflict'         -- Conflit détecté
  )),
  sync_direction TEXT NOT NULL DEFAULT 'export' CHECK (sync_direction IN (
    'import',          -- Importé depuis calendrier externe
    'export',          -- Exporté vers calendrier externe
    'bidirectional'    -- Synchronisé bidirectionnellement
  )),
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(integration_id, external_event_id),
  CHECK (event_end_time > event_start_time)
);

-- ============================================================
-- 3. TABLE: service_calendar_sync_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_calendar_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.service_calendar_integrations(id) ON DELETE CASCADE,
  
  -- Informations synchronisation
  sync_type TEXT NOT NULL CHECK (sync_type IN (
    'full',            -- Synchronisation complète
    'incremental',     -- Synchronisation incrémentale
    'manual'            -- Synchronisation manuelle
  )),
  sync_direction TEXT NOT NULL CHECK (sync_direction IN (
    'import',
    'export',
    'bidirectional'
  )),
  
  -- Résultats
  status TEXT NOT NULL CHECK (status IN (
    'success',
    'error',
    'partial'
  )),
  events_created INTEGER DEFAULT 0,
  events_updated INTEGER DEFAULT 0,
  events_deleted INTEGER DEFAULT 0,
  events_failed INTEGER DEFAULT 0,
  
  -- Erreurs
  error_message TEXT,
  error_details JSONB,
  
  -- Durée
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_store_id ON public.service_calendar_integrations(store_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_service_id ON public.service_calendar_integrations(service_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_type ON public.service_calendar_integrations(calendar_type);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_active ON public.service_calendar_integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_last_sync ON public.service_calendar_integrations(last_sync_at);

CREATE INDEX IF NOT EXISTS idx_calendar_events_integration_id ON public.service_calendar_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_booking_id ON public.service_calendar_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_service_id ON public.service_calendar_events(service_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_external_id ON public.service_calendar_events(external_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_sync_status ON public.service_calendar_events(sync_status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.service_calendar_events(event_start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON public.service_calendar_events(event_end_time);

CREATE INDEX IF NOT EXISTS idx_sync_logs_integration_id ON public.service_calendar_sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON public.service_calendar_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON public.service_calendar_sync_logs(started_at DESC);

-- ============================================================
-- 5. FUNCTIONS
-- ============================================================

-- Fonction pour créer un événement dans le calendrier externe
CREATE OR REPLACE FUNCTION create_calendar_event(
  p_integration_id UUID,
  p_booking_id UUID,
  p_event_title TEXT,
  p_event_description TEXT,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_location TEXT DEFAULT NULL,
  p_attendees JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_integration public.service_calendar_integrations%ROWTYPE;
BEGIN
  -- Récupérer l'intégration
  SELECT * INTO v_integration
  FROM public.service_calendar_integrations
  WHERE id = p_integration_id
  AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intégration calendrier non trouvée ou inactive';
  END IF;
  
  -- Note: La création réelle dans le calendrier externe se fait côté application
  -- Cette fonction crée uniquement l'enregistrement local
  
  INSERT INTO public.service_calendar_events (
    integration_id,
    booking_id,
    service_id,
    external_event_id, -- Sera mis à jour après création externe
    external_calendar_id,
    event_title,
    event_description,
    event_start_time,
    event_end_time,
    event_location,
    sync_status,
    sync_direction
  ) VALUES (
    p_integration_id,
    p_booking_id,
    (SELECT product_id FROM public.service_bookings WHERE id = p_booking_id),
    'pending-' || gen_random_uuid()::TEXT, -- ID temporaire
    v_integration.calendar_id,
    p_event_title,
    p_event_description,
    p_start_time,
    p_end_time,
    p_location,
    'pending',
    'export'
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour synchroniser les événements
CREATE OR REPLACE FUNCTION sync_calendar_events(
  p_integration_id UUID,
  p_sync_type TEXT DEFAULT 'incremental'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_integration public.service_calendar_integrations%ROWTYPE;
BEGIN
  -- Récupérer l'intégration
  SELECT * INTO v_integration
  FROM public.service_calendar_integrations
  WHERE id = p_integration_id
  AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intégration calendrier non trouvée ou inactive';
  END IF;
  
  -- Créer un log de synchronisation
  INSERT INTO public.service_calendar_sync_logs (
    integration_id,
    sync_type,
    sync_direction,
    status
  ) VALUES (
    p_integration_id,
    p_sync_type,
    v_integration.sync_direction,
    'success' -- Sera mis à jour après synchronisation
  )
  RETURNING id INTO v_log_id;
  
  -- Note: La synchronisation réelle se fait côté application
  -- Cette fonction crée uniquement le log
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour détecter les conflits
CREATE OR REPLACE FUNCTION detect_calendar_conflicts(
  p_service_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflict_type TEXT,
  conflict_event_id UUID,
  conflict_start_time TIMESTAMPTZ,
  conflict_end_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'booking'::TEXT,
    b.id,
    (b.scheduled_date + b.scheduled_start_time)::TIMESTAMPTZ,
    (b.scheduled_date + b.scheduled_end_time)::TIMESTAMPTZ
  FROM public.service_bookings b
  WHERE b.product_id = p_service_id
  AND b.status IN ('confirmed', 'pending')
  AND b.id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::UUID)
  AND (
    ((b.scheduled_date + b.scheduled_start_time)::TIMESTAMPTZ <= p_start_time AND (b.scheduled_date + b.scheduled_end_time)::TIMESTAMPTZ > p_start_time) OR
    ((b.scheduled_date + b.scheduled_start_time)::TIMESTAMPTZ < p_end_time AND (b.scheduled_date + b.scheduled_end_time)::TIMESTAMPTZ >= p_end_time) OR
    ((b.scheduled_date + b.scheduled_start_time)::TIMESTAMPTZ >= p_start_time AND (b.scheduled_date + b.scheduled_end_time)::TIMESTAMPTZ <= p_end_time)
  )
  
  UNION ALL
  
  SELECT
    'calendar_event'::TEXT,
    e.id,
    e.event_start_time,
    e.event_end_time
  FROM public.service_calendar_events e
  WHERE e.service_id = p_service_id
  AND e.sync_status = 'synced'
  AND (
    (e.event_start_time <= p_start_time AND e.event_end_time > p_start_time) OR
    (e.event_start_time < p_end_time AND e.event_end_time >= p_end_time) OR
    (e.event_start_time >= p_start_time AND e.event_end_time <= p_end_time)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- Trigger pour updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_calendar_integrations_updated_at'
  ) THEN
    CREATE TRIGGER update_calendar_integrations_updated_at
      BEFORE UPDATE ON public.service_calendar_integrations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_calendar_events_updated_at'
  ) THEN
    CREATE TRIGGER update_calendar_events_updated_at
      BEFORE UPDATE ON public.service_calendar_events
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

-- Activer RLS seulement si les tables existent
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_calendar_integrations') THEN
    ALTER TABLE public.service_calendar_integrations ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_calendar_events') THEN
    ALTER TABLE public.service_calendar_events ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_calendar_sync_logs') THEN
    ALTER TABLE public.service_calendar_sync_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Intégrations : Propriétaires peuvent gérer leurs intégrations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_calendar_integrations') THEN
    DROP POLICY IF EXISTS "Store owners can manage their calendar integrations" ON public.service_calendar_integrations;
    CREATE POLICY "Store owners can manage their calendar integrations"
    ON public.service_calendar_integrations FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = service_calendar_integrations.store_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_calendar_events') THEN
    DROP POLICY IF EXISTS "Store owners can view their calendar events" ON public.service_calendar_events;
    CREATE POLICY "Store owners can view their calendar events"
    ON public.service_calendar_events FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.service_calendar_integrations
        JOIN public.stores ON stores.id = service_calendar_integrations.store_id
        WHERE service_calendar_integrations.id = service_calendar_events.integration_id
        AND stores.user_id = auth.uid()
      )
    );
    
    DROP POLICY IF EXISTS "Store owners can manage their calendar events" ON public.service_calendar_events;
    CREATE POLICY "Store owners can manage their calendar events"
    ON public.service_calendar_events FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.service_calendar_integrations
        JOIN public.stores ON stores.id = service_calendar_integrations.store_id
        WHERE service_calendar_integrations.id = service_calendar_events.integration_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_calendar_sync_logs') THEN
    DROP POLICY IF EXISTS "Store owners can view their sync logs" ON public.service_calendar_sync_logs;
    CREATE POLICY "Store owners can view their sync logs"
    ON public.service_calendar_sync_logs FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.service_calendar_integrations
        JOIN public.stores ON stores.id = service_calendar_integrations.store_id
        WHERE service_calendar_integrations.id = service_calendar_sync_logs.integration_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ============================================================
-- 8. COMMENTS
-- ============================================================

COMMENT ON TABLE public.service_calendar_integrations IS 'Intégrations calendriers externes pour services';
COMMENT ON TABLE public.service_calendar_events IS 'Événements synchronisés avec calendriers externes';
COMMENT ON TABLE public.service_calendar_sync_logs IS 'Logs de synchronisation calendriers';

