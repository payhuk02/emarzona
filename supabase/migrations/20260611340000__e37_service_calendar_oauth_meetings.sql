-- E37 Epic 3.3.4 + 3.3.5: Google Calendar OAuth (read busy) + Zoom/Meet live sessions

-- OAuth CSRF state (service_role only)
CREATE TABLE IF NOT EXISTS public.service_oauth_states (
  state_token TEXT PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google_calendar',
  redirect_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_service_oauth_states_expires
  ON public.service_oauth_states(expires_at)
  WHERE consumed_at IS NULL;

ALTER TABLE public.service_oauth_states ENABLE ROW LEVEL SECURITY;
-- No policies: service_role / edge functions only

COMMENT ON TABLE public.service_oauth_states IS
  'Epic 3.3.4 — états OAuth temporaires pour connexion Google Calendar.';

-- Extend store_integrations for google_meet
ALTER TABLE public.store_integrations
  DROP CONSTRAINT IF EXISTS store_integrations_integration_type_check;

ALTER TABLE public.store_integrations
  ADD CONSTRAINT store_integrations_integration_type_check
  CHECK (integration_type IN (
    'zoom',
    'google_meet',
    'openai',
    'claude',
    'shipping_fedex',
    'shipping_dhl',
    'shipping_ups',
    'shipping_chronopost',
    'shipping_colissimo',
    'custom'
  ));

-- Preferred meeting platform per service (online sessions)
ALTER TABLE public.service_products
  ADD COLUMN IF NOT EXISTS preferred_meeting_platform TEXT
  CHECK (
    preferred_meeting_platform IS NULL
    OR preferred_meeting_platform IN ('zoom', 'google_meet')
  );

COMMENT ON COLUMN public.service_products.preferred_meeting_platform IS
  'Epic 3.3.5 — plateforme vidéo par défaut pour services en ligne (zoom | google_meet).';

-- Upsert busy blocks imported from Google Calendar freebusy
CREATE OR REPLACE FUNCTION public.upsert_google_calendar_busy_events(
  p_integration_id UUID,
  p_busy_blocks JSONB
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_service_id UUID;
  v_block JSONB;
  v_count INT := 0;
  v_external_id TEXT;
BEGIN
  IF p_integration_id IS NULL THEN
    RAISE EXCEPTION 'p_integration_id is required';
  END IF;

  SELECT sci.store_id, sci.service_id
  INTO v_store_id, v_service_id
  FROM public.service_calendar_integrations sci
  WHERE sci.id = p_integration_id
    AND sci.calendar_type = 'google_calendar'
    AND sci.is_active = true;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Google Calendar integration not found or inactive';
  END IF;

  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = v_store_id AND s.user_id = auth.uid()
  ) AND NOT COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role), false) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Remove prior imported busy blocks for this integration
  DELETE FROM public.service_calendar_events e
  WHERE e.integration_id = p_integration_id
    AND e.sync_direction = 'import'
    AND COALESCE(e.metadata->>'source', '') = 'google_freebusy';

  IF p_busy_blocks IS NULL OR jsonb_typeof(p_busy_blocks) <> 'array' THEN
    RETURN 0;
  END IF;

  FOR v_block IN SELECT * FROM jsonb_array_elements(p_busy_blocks)
  LOOP
    v_external_id := COALESCE(v_block->>'external_id', gen_random_uuid()::TEXT);

    INSERT INTO public.service_calendar_events (
      integration_id,
      service_id,
      external_event_id,
      external_calendar_id,
      event_title,
      event_description,
      event_start_time,
      event_end_time,
      event_timezone,
      sync_status,
      sync_direction,
      last_synced_at,
      metadata
    ) VALUES (
      p_integration_id,
      v_service_id,
      v_external_id,
      COALESCE(v_block->>'calendar_id', 'primary'),
      COALESCE(v_block->>'title', 'Occupé (Google Calendar)'),
      'Imported from Google Calendar freebusy',
      (v_block->>'start')::TIMESTAMPTZ,
      (v_block->>'end')::TIMESTAMPTZ,
      COALESCE(v_block->>'timezone', 'UTC'),
      'synced',
      'import',
      now(),
      jsonb_build_object('source', 'google_freebusy')
    )
    ON CONFLICT (integration_id, external_event_id) DO UPDATE SET
      event_start_time = EXCLUDED.event_start_time,
      event_end_time = EXCLUDED.event_end_time,
      sync_status = 'synced',
      last_synced_at = now(),
      updated_at = now();

    v_count := v_count + 1;
  END LOOP;

  UPDATE public.service_calendar_integrations
  SET last_sync_at = now(),
      last_sync_status = 'success',
      last_sync_error = NULL,
      updated_at = now()
  WHERE id = p_integration_id;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.upsert_google_calendar_busy_events(UUID, JSONB) IS
  'Epic 3.3.4 — remplace les blocs occupés importés depuis Google Calendar freebusy.';

GRANT EXECUTE ON FUNCTION public.upsert_google_calendar_busy_events(UUID, JSONB) TO authenticated, service_role;
