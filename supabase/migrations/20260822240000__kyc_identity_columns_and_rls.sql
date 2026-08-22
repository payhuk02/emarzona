-- Identity KYC form writes full_name / city / country / document_front_url, but prod
-- kyc_submissions is the older store-KYC shape (document_url + store_id RLS).
-- Extend the table and allow both identity (store_id IS NULL) and store KYC.

ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS document_front_url TEXT,
  ADD COLUMN IF NOT EXISTS document_back_url TEXT;

UPDATE public.kyc_submissions
SET document_front_url = document_url
WHERE document_front_url IS NULL
  AND document_url IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_kyc_document_urls()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.document_front_url IS NULL AND NEW.document_url IS NOT NULL THEN
    NEW.document_front_url := NEW.document_url;
  END IF;
  IF NEW.document_url IS NULL AND NEW.document_front_url IS NOT NULL THEN
    NEW.document_url := NEW.document_front_url;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_kyc_document_urls_before_write ON public.kyc_submissions;
CREATE TRIGGER sync_kyc_document_urls_before_write
  BEFORE INSERT OR UPDATE ON public.kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_kyc_document_urls();

CREATE UNIQUE INDEX IF NOT EXISTS kyc_submissions_one_identity_per_user
  ON public.kyc_submissions (user_id)
  WHERE store_id IS NULL;

DROP POLICY IF EXISTS "kyc_submissions_select_policy" ON public.kyc_submissions;
DROP POLICY IF EXISTS "kyc_submissions_insert_policy" ON public.kyc_submissions;
DROP POLICY IF EXISTS "kyc_submissions_update_policy" ON public.kyc_submissions;
DROP POLICY IF EXISTS "kyc_submissions_delete_policy" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Users can view their own KYC submission" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Users can view their own KYC submissions" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Users can create their own KYC submission" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Users can create their own KYC submissions" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Users can update their own pending KYC submission" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Users can update their own pending identity KYC" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Store owners can update their store KYC" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Store owners can delete their store KYC" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Admins can view all KYC submissions" ON public.kyc_submissions;
DROP POLICY IF EXISTS "Admins can update KYC submissions" ON public.kyc_submissions;

CREATE POLICY "Users can view their own KYC submissions"
  ON public.kyc_submissions
  FOR SELECT
  TO authenticated
  USING (
    (store_id IS NULL AND user_id = auth.uid())
    OR (
      store_id IS NOT NULL
      AND store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create their own KYC submissions"
  ON public.kyc_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      store_id IS NULL
      OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own pending identity KYC"
  ON public.kyc_submissions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND store_id IS NULL
    AND status = 'pending'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND store_id IS NULL
  );

CREATE POLICY "Store owners can update their store KYC"
  ON public.kyc_submissions
  FOR UPDATE
  TO authenticated
  USING (
    store_id IS NOT NULL
    AND store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  )
  WITH CHECK (
    store_id IS NOT NULL
    AND store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update KYC submissions"
  ON public.kyc_submissions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Store owners can delete their store KYC"
  ON public.kyc_submissions
  FOR DELETE
  TO authenticated
  USING (
    store_id IS NOT NULL
    AND store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_submissions TO authenticated;

NOTIFY pgrst, 'reload schema';
