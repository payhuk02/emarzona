-- Migration: Ajout de politique RLS pour permettre aux clients de voir leur propre enregistrement
-- Date: 2 Février 2025
-- Description: Permet aux utilisateurs authentifiés de voir leur propre enregistrement dans customers via leur email

-- Ajouter une politique RLS pour permettre aux clients de voir leur propre enregistrement
-- Cette politique permet à un utilisateur authentifié de voir son propre enregistrement customer
-- en comparant son email avec l'email dans la table customers
CREATE POLICY "Customers can view their own record"
  ON public.customers
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND email = (
      SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1
    )
  );

-- Vérifier que RLS est activé
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

