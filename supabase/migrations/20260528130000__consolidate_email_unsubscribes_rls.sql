-- Consolidate email_unsubscribes RLS (remove prod drift: lot4_*, generic templates).
-- Target: 1 public INSERT, 2 SELECT (admin + user), 1 admin DELETE. No public UPDATE.

-- Legacy / duplicate INSERT & UPDATE
DROP POLICY IF EXISTS "Anyone can unsubscribe" ON public.email_unsubscribes;
DROP POLICY IF EXISTS "Anyone can unsubscribe with email" ON public.email_unsubscribes;
DROP POLICY IF EXISTS "Public update unsubscribe on conflict" ON public.email_unsubscribes;
DROP POLICY IF EXISTS email_unsubscribes_insert_policy ON public.email_unsubscribes;
DROP POLICY IF EXISTS email_unsubscribes_update_policy ON public.email_unsubscribes;
DROP POLICY IF EXISTS lot4_public_insert ON public.email_unsubscribes;

-- Duplicate SELECT / dangerous public DELETE
DROP POLICY IF EXISTS email_unsubscribes_select_policy ON public.email_unsubscribes;
DROP POLICY IF EXISTS email_unsubscribes_delete_policy ON public.email_unsubscribes;
DROP POLICY IF EXISTS lot4_admin_select ON public.email_unsubscribes;

-- Direct table UPDATE not needed (RPC insert + ON CONFLICT DO NOTHING)
DROP POLICY IF EXISTS lot4_admin_update ON public.email_unsubscribes;

-- Replace lot4_admin_delete with named admin policy
DROP POLICY IF EXISTS lot4_admin_delete ON public.email_unsubscribes;

-- Canonical public INSERT (hardened)
DROP POLICY IF EXISTS "Public insert unsubscribe by email" ON public.email_unsubscribes;
CREATE POLICY "Public insert unsubscribe by email"
  ON public.email_unsubscribes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND char_length(trim(email)) >= 5
    AND trim(email) LIKE '%@%'
    AND unsubscribe_type IN ('all', 'marketing', 'newsletter', 'transactional')
  );

-- Canonical SELECT (idempotent)
DROP POLICY IF EXISTS "Admins can view all unsubscribes" ON public.email_unsubscribes;
CREATE POLICY "Admins can view all unsubscribes"
  ON public.email_unsubscribes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "Users can view own unsubscribes" ON public.email_unsubscribes;
CREATE POLICY "Users can view own unsubscribes"
  ON public.email_unsubscribes
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can delete unsubscribes" ON public.email_unsubscribes;
CREATE POLICY "Admins can delete unsubscribes"
  ON public.email_unsubscribes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff')
    )
  );
