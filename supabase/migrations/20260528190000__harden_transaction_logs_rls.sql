-- P1 audit: replace transaction_logs INSERT WITH CHECK (true) with scoped policies.
-- Service role (webhooks, edge functions) bypasses RLS; client inserts must match transaction ownership.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'transaction_logs'
  ) THEN
    RAISE NOTICE 'transaction_logs: table absent, skipping';
    RETURN;
  END IF;

  -- Remove permissive insert policy (20260330000000 batch)
  DROP POLICY IF EXISTS "Authenticated insert transaction_logs" ON public.transaction_logs;

  DROP POLICY IF EXISTS "Store owners insert transaction logs" ON public.transaction_logs;
  CREATE POLICY "Store owners insert transaction logs"
    ON public.transaction_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.transactions t
        JOIN public.stores s ON s.id = t.store_id
        WHERE t.id::text = transaction_logs.transaction_id::text
          AND s.user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Buyers insert own transaction logs" ON public.transaction_logs;
  CREATE POLICY "Buyers insert own transaction logs"
    ON public.transaction_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.transactions t
        WHERE t.id::text = transaction_logs.transaction_id::text
          AND t.user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Admins insert transaction logs" ON public.transaction_logs;
  CREATE POLICY "Admins insert transaction logs"
    ON public.transaction_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

  -- SELECT: buyers can read logs for their transactions (if not already covered)
  DROP POLICY IF EXISTS "Buyers read own transaction logs" ON public.transaction_logs;
  CREATE POLICY "Buyers read own transaction logs"
    ON public.transaction_logs
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.transactions t
        WHERE t.id::text = transaction_logs.transaction_id::text
          AND t.user_id = auth.uid()
      )
    );

  -- Legacy policy used user_id on transaction_logs (optional column)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transaction_logs'
      AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users read own transaction_logs" ON public.transaction_logs;
    CREATE POLICY "Users read own transaction_logs"
      ON public.transaction_logs
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      );
  END IF;

  -- Ensure store-owner read policy exists (older migrations)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'transaction_logs'
      AND policyname = 'Store owners can view their transaction logs'
  ) THEN
    CREATE POLICY "Store owners can view their transaction logs"
      ON public.transaction_logs
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.transactions t
          JOIN public.stores s ON s.id = t.store_id
          WHERE t.id::text = transaction_logs.transaction_id::text
            AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

COMMIT;
