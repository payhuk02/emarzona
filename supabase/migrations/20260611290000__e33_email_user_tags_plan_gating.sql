-- E33: Compléter le gating emailing Professional sur email_user_tags
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.email_user_tags') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Store owners can manage tags in own store" ON public.email_user_tags';
    EXECUTE 'CREATE POLICY "Store owners can manage tags in own store" ON public.email_user_tags
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = email_user_tags.store_id AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(email_user_tags.store_id, ''emails.manage'')
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = email_user_tags.store_id AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(email_user_tags.store_id, ''emails.manage'')
      )';
  END IF;
END;
$$;

COMMIT;
