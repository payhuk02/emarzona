-- P1 audit: replace shipping_tracking_events FOR ALL USING (true) with store-scoped policies.
-- Public SELECT remains allowed for customer parcel tracking (same intent as FedEx migration).

BEGIN;

DROP POLICY IF EXISTS "Store owners manage shipping_tracking_events" ON public.shipping_tracking_events;
DROP POLICY IF EXISTS "Anyone can view tracking events" ON public.shipping_tracking_events;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'shipping_tracking_events'
  ) THEN
    RAISE NOTICE 'shipping_tracking_events: table absent, skipping';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shipping_tracking_events'
      AND policyname = 'Public read shipping tracking events'
  ) THEN
    CREATE POLICY "Public read shipping tracking events"
      ON public.shipping_tracking_events
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shipping_tracking_events'
      AND column_name = 'shipment_id'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Store owners manage shipping_tracking_events"
      ON public.shipping_tracking_events
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.shipments s
          JOIN public.stores st ON st.id = s.store_id
          WHERE s.id = shipping_tracking_events.shipment_id
            AND st.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.shipments s
          JOIN public.stores st ON st.id = s.store_id
          WHERE s.id = shipping_tracking_events.shipment_id
            AND st.user_id = auth.uid()
        )
      )
    $policy$;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shipping_tracking_events'
      AND column_name = 'shipping_label_id'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Store owners manage shipping_tracking_events"
      ON public.shipping_tracking_events
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.shipping_labels sl
          JOIN public.shipments s ON s.id = sl.shipment_id
          JOIN public.stores st ON st.id = s.store_id
          WHERE sl.id = shipping_tracking_events.shipping_label_id
            AND st.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.shipping_labels sl
          JOIN public.shipments s ON s.id = sl.shipment_id
          JOIN public.stores st ON st.id = s.store_id
          WHERE sl.id = shipping_tracking_events.shipping_label_id
            AND st.user_id = auth.uid()
        )
      )
    $policy$;
  ELSE
    RAISE NOTICE 'shipping_tracking_events: no shipment_id/shipping_label_id column, owner policy skipped';
  END IF;
END $$;

COMMIT;
