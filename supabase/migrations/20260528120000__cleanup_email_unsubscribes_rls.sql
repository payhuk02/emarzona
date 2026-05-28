-- Cleanup redundant / overly permissive RLS on email_unsubscribes (prod drift).
-- Safe to re-run.

DROP POLICY IF EXISTS "Anyone can unsubscribe" ON public.email_unsubscribes;
DROP POLICY IF EXISTS "Anyone can unsubscribe with email" ON public.email_unsubscribes;
DROP POLICY IF EXISTS "Public update unsubscribe on conflict" ON public.email_unsubscribes;

-- Dashboard-generated policies: remove broad INSERT/UPDATE (keep SELECT/DELETE if you use them)
DROP POLICY IF EXISTS email_unsubscribes_insert_policy ON public.email_unsubscribes;
DROP POLICY IF EXISTS email_unsubscribes_update_policy ON public.email_unsubscribes;

-- Hardened public INSERT (idempotent)
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
