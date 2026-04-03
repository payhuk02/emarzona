-- =========================================================
-- Migration : Système de Rappels Automatiques pour Services
-- Date : 1 Février 2025
-- Description : Système complet de rappels automatiques pour réservations de services
-- =========================================================

-- ============================================================
-- 1. TABLE: service_booking_reminders
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.service_bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de rappel
  reminder_type TEXT NOT NULL CHECK (reminder_type IN (
    'email',        -- Email
    'sms',          -- SMS
    'push',         -- Notification push
    'in_app'        -- Notification in-app
  )),
  
  -- Timing
  reminder_scheduled_at TIMESTAMPTZ NOT NULL, -- Quand envoyer le rappel
  reminder_sent_at TIMESTAMPTZ, -- Quand le rappel a été envoyé
  reminder_sent BOOLEAN DEFAULT false,
  
  -- Contenu
  reminder_subject TEXT, -- Pour email
  reminder_message TEXT NOT NULL,
  reminder_template TEXT, -- Template utilisé
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- En attente
    'sent',         -- Envoyé
    'failed',       -- Échec
    'cancelled'     -- Annulé
  )),
  
  -- Résultat
  delivery_status TEXT, -- 'delivered', 'bounced', 'failed'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  CHECK (reminder_scheduled_at > created_at)
);

-- ============================================================
-- 2. TABLE: service_reminder_templates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_reminder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Informations template
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN (
    'email',
    'sms',
    'push',
    'in_app'
  )),
  
  -- Timing
  reminder_timing_hours INTEGER NOT NULL, -- Nombre d'heures avant le rendez-vous
  
  -- Contenu
  subject_template TEXT, -- Pour email
  message_template TEXT NOT NULL,
  
  -- Variables disponibles: {service_name}, {customer_name}, {booking_date}, {booking_time}, {location}, etc.
  
  -- Options
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(store_id, template_type, reminder_timing_hours)
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_reminders_booking_id ON public.service_booking_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_reminders_service_id ON public.service_booking_reminders(service_id);
CREATE INDEX IF NOT EXISTS idx_reminders_store_id ON public.service_booking_reminders(store_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.service_booking_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.service_booking_reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_at ON public.service_booking_reminders(reminder_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_sent ON public.service_booking_reminders(reminder_sent, reminder_scheduled_at);

CREATE INDEX IF NOT EXISTS idx_reminder_templates_store_id ON public.service_reminder_templates(store_id);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_type ON public.service_reminder_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_active ON public.service_reminder_templates(is_active);

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

-- Fonction pour créer automatiquement des rappels lors de la création d'une réservation
CREATE OR REPLACE FUNCTION create_booking_reminders(p_booking_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_booking RECORD;
  v_templates RECORD;
  v_reminder_count INTEGER := 0;
  v_scheduled_at TIMESTAMPTZ;
BEGIN
  -- Récupérer les détails de la réservation
  SELECT 
    sb.id,
    sb.product_id,
    sb.user_id,
    sb.scheduled_date,
    sb.scheduled_start_time,
    sb.status,
    p.store_id,
    p.name AS service_name
  INTO v_booking
  FROM public.service_bookings sb
  INNER JOIN public.products p ON p.id = sb.product_id
  WHERE sb.id = p_booking_id;

  IF NOT FOUND OR v_booking.status != 'confirmed' THEN
    RETURN 0;
  END IF;

  -- Récupérer les templates actifs pour ce store
  FOR v_templates IN
    SELECT *
    FROM public.service_reminder_templates
    WHERE store_id = v_booking.store_id
      AND is_active = true
      AND template_type = 'email' -- Par défaut, on crée des rappels email
    ORDER BY reminder_timing_hours ASC
  LOOP
    -- Calculer la date/heure du rappel
    v_scheduled_at := (v_booking.scheduled_date + v_booking.scheduled_start_time)::TIMESTAMPTZ 
                      - (v_templates.reminder_timing_hours || ' hours')::INTERVAL;

    -- Ne créer le rappel que s'il est dans le futur
    IF v_scheduled_at > now() THEN
      INSERT INTO public.service_booking_reminders (
        booking_id,
        service_id,
        store_id,
        user_id,
        reminder_type,
        reminder_scheduled_at,
        reminder_subject,
        reminder_message,
        reminder_template,
        status
      )
      VALUES (
        v_booking.id,
        v_booking.product_id,
        v_booking.store_id,
        v_booking.user_id,
        v_templates.template_type,
        v_scheduled_at,
        v_templates.subject_template,
        v_templates.message_template,
        v_templates.template_name,
        'pending'
      );
      
      v_reminder_count := v_reminder_count + 1;
    END IF;
  END LOOP;

  RETURN v_reminder_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les rappels à envoyer
CREATE OR REPLACE FUNCTION get_pending_reminders(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  reminder_id UUID,
  booking_id UUID,
  user_id UUID,
  user_email TEXT,
  user_phone TEXT,
  service_name TEXT,
  booking_date DATE,
  booking_time TIME,
  reminder_type TEXT,
  reminder_subject TEXT,
  reminder_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id AS reminder_id,
    r.booking_id,
    r.user_id,
    u.email AS user_email,
    u.raw_user_meta_data->>'phone' AS user_phone,
    p.name AS service_name,
    sb.scheduled_date AS booking_date,
    sb.scheduled_start_time AS booking_time,
    r.reminder_type,
    r.reminder_subject,
    r.reminder_message
  FROM public.service_booking_reminders r
  INNER JOIN public.service_bookings sb ON sb.id = r.booking_id
  INNER JOIN public.products p ON p.id = r.service_id
  INNER JOIN auth.users u ON u.id = r.user_id
  WHERE r.status = 'pending'
    AND r.reminder_sent = false
    AND r.reminder_scheduled_at <= now()
    AND sb.status = 'confirmed' -- Seulement pour les réservations confirmées
  ORDER BY r.reminder_scheduled_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer un rappel comme envoyé
CREATE OR REPLACE FUNCTION mark_reminder_sent(
  p_reminder_id UUID,
  p_delivery_status TEXT DEFAULT 'delivered',
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.service_booking_reminders
  SET 
    reminder_sent = true,
    reminder_sent_at = now(),
    status = CASE 
      WHEN p_delivery_status = 'delivered' THEN 'sent'
      ELSE 'failed'
    END,
    delivery_status = p_delivery_status,
    error_message = p_error_message
  WHERE id = p_reminder_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

-- Trigger pour créer automatiquement des rappels lors de la confirmation d'une réservation
CREATE OR REPLACE FUNCTION trigger_create_booking_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la réservation vient d'être confirmée, créer les rappels
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    PERFORM create_booking_reminders(NEW.id);
  END IF;
  
  -- Si la réservation est annulée, annuler les rappels en attente
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.service_booking_reminders
    SET status = 'cancelled'
    WHERE booking_id = NEW.id
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_booking_reminders'
  ) THEN
    CREATE TRIGGER trigger_create_booking_reminders
    AFTER INSERT OR UPDATE ON public.service_bookings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_booking_reminders();
  END IF;
END $$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_reminders_updated_at'
  ) THEN
    CREATE TRIGGER update_reminders_updated_at
    BEFORE UPDATE ON public.service_booking_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_reminders_updated_at();
  END IF;
END $$;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

ALTER TABLE public.service_booking_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reminder_templates ENABLE ROW LEVEL SECURITY;

-- Store owners can manage reminders for their services
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'service_booking_reminders' AND policyname = 'Store owners can manage reminders'
  ) THEN
    CREATE POLICY "Store owners can manage reminders"
    ON public.service_booking_reminders
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = service_booking_reminders.store_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Users can view their own reminders
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'service_booking_reminders' AND policyname = 'Users can view their reminders'
  ) THEN
    CREATE POLICY "Users can view their reminders"
    ON public.service_booking_reminders
    FOR SELECT
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Store owners can manage reminder templates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'service_reminder_templates' AND policyname = 'Store owners can manage templates'
  ) THEN
    CREATE POLICY "Store owners can manage templates"
    ON public.service_reminder_templates
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = service_reminder_templates.store_id
        AND stores.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ============================================================
-- 7. TEMPLATES PAR DÉFAUT
-- ============================================================

-- Insérer des templates par défaut pour chaque store (sera fait via trigger ou application)
-- Template 24h avant
-- Template 2h avant
-- Template 1h avant

