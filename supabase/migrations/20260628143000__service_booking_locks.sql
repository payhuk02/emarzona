-- =========================================================
-- Migration : Réservations de Service Sécurisées & Atomicité
-- Date : 28 Juin 2026
-- Description : Fonction de réservation avec verrouillage pessimiste
-- =========================================================

CREATE OR REPLACE FUNCTION public.reserve_service_booking(
  p_product_id UUID,
  p_user_id UUID,
  p_staff_member_id UUID,
  p_scheduled_date DATE,
  p_scheduled_start_time TIME,
  p_scheduled_end_time TIME,
  p_timezone TEXT,
  p_duration_minutes INTEGER,
  p_participants_count INTEGER,
  p_customer_notes TEXT
)
RETURNS TABLE (
  booking_id UUID,
  error_message TEXT
) AS $$
DECLARE
  v_lock_key BIGINT;
  v_conflict_check RECORD;
  v_max_bookings_check RECORD;
  v_advance_check RECORD;
  v_new_booking_id UUID;
BEGIN
  -- 1. Générer une clé de verrouillage basée sur le produit et la date
  -- Cela garantit que toutes les tentatives de réservation pour ce produit à cette date
  -- sont traitées de manière séquentielle, évitant ainsi le risque d'overselling (race conditions).
  v_lock_key := hashtext(p_product_id::text || p_scheduled_date::text);
  
  -- 2. Acquérir un verrou transactionnel (Pessimistic Locking)
  -- Ce verrou sera automatiquement libéré à la fin de la transaction.
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 3. Validation: Advance Booking Days
  SELECT * INTO v_advance_check FROM public.check_advance_booking_days(p_product_id, p_scheduled_date);
  IF v_advance_check.is_valid = FALSE THEN
    RETURN QUERY SELECT NULL::UUID, v_advance_check.message;
    RETURN;
  END IF;

  -- 4. Validation: Max Bookings Per Day
  SELECT * INTO v_max_bookings_check FROM public.check_max_bookings_per_day(p_product_id, p_scheduled_date);
  IF v_max_bookings_check.is_within_limit = FALSE THEN
    RETURN QUERY SELECT NULL::UUID, v_max_bookings_check.message;
    RETURN;
  END IF;

  -- 5. Validation: Conflits de Créneaux et Temps de Battement (Buffer Time)
  SELECT * INTO v_conflict_check FROM public.check_booking_conflicts(
    p_product_id, 
    p_scheduled_date, 
    p_scheduled_start_time, 
    p_scheduled_end_time, 
    p_staff_member_id
  );
  
  IF v_conflict_check.has_conflict = TRUE THEN
    RETURN QUERY SELECT NULL::UUID, v_conflict_check.conflict_message;
    RETURN;
  END IF;

  -- 6. Tout est valide et le verrou nous assure qu'aucune autre transaction
  -- n'a pu prendre le créneau entre temps. On peut insérer en toute sécurité.
  INSERT INTO public.service_bookings (
    product_id,
    user_id,
    staff_member_id,
    scheduled_date,
    scheduled_start_time,
    scheduled_end_time,
    timezone,
    duration_minutes,
    status,
    participants_count,
    customer_notes
  ) VALUES (
    p_product_id,
    p_user_id,
    p_staff_member_id,
    p_scheduled_date,
    p_scheduled_start_time,
    p_scheduled_end_time,
    p_timezone,
    p_duration_minutes,
    'pending',
    p_participants_count,
    p_customer_notes
  ) RETURNING id INTO v_new_booking_id;

  RETURN QUERY SELECT v_new_booking_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reserve_service_booking IS 
  'Fonction atomique de réservation de service. Utilise un verrou (pg_advisory_xact_lock) pour empêcher les doubles réservations (race conditions).';
