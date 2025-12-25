-- ============================================================
-- CORRECTION: Remplacer owner_id par user_id dans les policies RLS
-- Date: 1er Février 2025
-- Description: Script de correction pour les politiques RLS qui utilisent
--              stores.owner_id au lieu de stores.user_id
-- ============================================================

-- Supprimer les anciennes policies incorrectes
DROP POLICY IF EXISTS "Store owners can manage own campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Store owners can manage own segments" ON public.email_segments;
DROP POLICY IF EXISTS "Store owners can manage own sequences" ON public.email_sequences;
DROP POLICY IF EXISTS "Store owners can manage own sequence steps" ON public.email_sequence_steps;
DROP POLICY IF EXISTS "Store owners can view enrollments of own sequences" ON public.email_sequence_enrollments;
DROP POLICY IF EXISTS "Store owners can manage tags in own store" ON public.email_user_tags;

-- Recréer les policies avec user_id au lieu de owner_id

-- email_campaigns
CREATE POLICY "Store owners can manage own campaigns"
  ON public.email_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = email_campaigns.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- email_segments
CREATE POLICY "Store owners can manage own segments"
  ON public.email_segments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = email_segments.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- email_sequences
CREATE POLICY "Store owners can manage own sequences"
  ON public.email_sequences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = email_sequences.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- email_sequence_steps
CREATE POLICY "Store owners can manage own sequence steps"
  ON public.email_sequence_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.email_sequences
      JOIN public.stores ON stores.id = email_sequences.store_id
      WHERE email_sequences.id = email_sequence_steps.sequence_id
      AND stores.user_id = auth.uid()
    )
  );

-- email_sequence_enrollments
CREATE POLICY "Store owners can view enrollments of own sequences"
  ON public.email_sequence_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.email_sequences
      JOIN public.stores ON stores.id = email_sequences.store_id
      WHERE email_sequences.id = email_sequence_enrollments.sequence_id
      AND stores.user_id = auth.uid()
    )
  );

-- email_user_tags
CREATE POLICY "Store owners can manage tags in own store"
  ON public.email_user_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = email_user_tags.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- ============================================================
-- FIN DE LA CORRECTION
-- ============================================================

