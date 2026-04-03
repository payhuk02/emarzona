-- =====================================================
-- FIX: Store Team RLS Policies - Correction Récursion Infinie V2
-- Date: 2 Février 2025
-- Description: Correction définitive de la récursion infinie dans les politiques RLS
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Supprimer TOUTES les anciennes politiques problématiques
-- =====================================================

DROP POLICY IF EXISTS "Members can view team members" ON public.store_members;
DROP POLICY IF EXISTS "Members and owners can view team members" ON public.store_members;
DROP POLICY IF EXISTS "Store owners can invite members" ON public.store_members;
DROP POLICY IF EXISTS "Owners and managers can update members" ON public.store_members;
DROP POLICY IF EXISTS "Store owners can remove members" ON public.store_members;

DROP POLICY IF EXISTS "Members can view tasks" ON public.store_tasks;
DROP POLICY IF EXISTS "Members and owners can view tasks" ON public.store_tasks;
DROP POLICY IF EXISTS "Members can create tasks" ON public.store_tasks;
DROP POLICY IF EXISTS "Members and owners can create tasks" ON public.store_tasks;
DROP POLICY IF EXISTS "Members can update tasks" ON public.store_tasks;
DROP POLICY IF EXISTS "Members and owners can update tasks" ON public.store_tasks;
DROP POLICY IF EXISTS "Members can delete tasks" ON public.store_tasks;
DROP POLICY IF EXISTS "Members and owners can delete tasks" ON public.store_tasks;

-- =====================================================
-- 2. Créer/Recréer les fonctions utilitaires avec SECURITY DEFINER
-- =====================================================

-- Fonction pour vérifier si un utilisateur est membre (SECURITY DEFINER évite la récursion)
CREATE OR REPLACE FUNCTION public.is_store_member(_store_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.store_members
    WHERE store_id = _store_id
    AND user_id = _user_id
    AND status = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.stores
    WHERE id = _store_id
    AND user_id = _user_id
  );
$$;

-- Fonction pour vérifier les permissions (SECURITY DEFINER évite la récursion)
CREATE OR REPLACE FUNCTION public.has_store_permission(_store_id UUID, _user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
  _permissions JSONB;
BEGIN
  -- Vérifier si c'est le propriétaire (pas de récursion ici)
  IF EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND user_id = _user_id
  ) THEN
    RETURN true;
  END IF;

  -- Récupérer le rôle et les permissions (SECURITY DEFINER permet de contourner RLS)
  SELECT role, permissions INTO _role, _permissions
  FROM public.store_members
  WHERE store_id = _store_id
  AND user_id = _user_id
  AND status = 'active'
  LIMIT 1;

  IF _role IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier la permission dans les permissions personnalisées
  IF _permissions ? _permission THEN
    IF (_permissions->>_permission)::boolean THEN
      RETURN true;
    END IF;
  END IF;

  -- Vérifier selon le rôle par défaut
  CASE _role
    WHEN 'owner' THEN RETURN true;
    WHEN 'manager' THEN 
      RETURN _permission IN ('products.manage', 'products.view', 'orders.manage', 'orders.view', 
                            'customers.manage', 'customers.view', 'analytics.view', 'team.manage', 
                            'tasks.assign', 'tasks.manage');
    WHEN 'staff' THEN
      RETURN _permission IN ('products.manage', 'products.view', 'orders.manage', 'orders.view', 
                            'customers.manage', 'customers.view', 'tasks.assign', 'tasks.manage');
    WHEN 'support' THEN
      RETURN _permission IN ('products.view', 'orders.manage', 'orders.view', 
                            'customers.manage', 'customers.view');
    WHEN 'viewer' THEN
      RETURN _permission IN ('products.view', 'orders.view', 'customers.view', 'analytics.view');
    ELSE RETURN false;
  END CASE;
END;
$$;

-- =====================================================
-- 3. NOUVELLES POLITIQUES RLS (sans récursion)
-- =====================================================

-- POLITIQUES: store_members

-- Les propriétaires et membres peuvent voir les membres
-- Utilise la fonction is_store_member pour éviter la récursion
CREATE POLICY "Members and owners can view team members"
  ON public.store_members FOR SELECT
  USING (
    -- Vérifier d'abord si c'est le propriétaire (pas de récursion)
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id
      AND s.user_id = auth.uid()
    )
    OR
    -- Utiliser la fonction SECURITY DEFINER pour éviter la récursion
    public.is_store_member(store_members.store_id, auth.uid())
  );

-- Les propriétaires peuvent inviter des membres
CREATE POLICY "Store owners can invite members"
  ON public.store_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id
      AND s.user_id = auth.uid()
    )
  );

-- Les propriétaires et managers peuvent modifier les membres
CREATE POLICY "Owners and managers can update members"
  ON public.store_members FOR UPDATE
  USING (
    -- Propriétaire (pas de récursion)
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id
      AND s.user_id = auth.uid()
    )
    OR
    -- Utiliser la fonction pour vérifier les permissions (évite la récursion)
    public.has_store_permission(store_members.store_id, auth.uid(), 'team.manage')
  );

-- Les propriétaires peuvent supprimer des membres
CREATE POLICY "Store owners can remove members"
  ON public.store_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id
      AND s.user_id = auth.uid()
    )
  );

-- POLITIQUES: store_tasks

-- Les propriétaires et membres peuvent voir les tâches
CREATE POLICY "Members and owners can view tasks"
  ON public.store_tasks FOR SELECT
  USING (
    -- Vérifier d'abord si c'est le propriétaire (pas de récursion)
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_tasks.store_id
      AND s.user_id = auth.uid()
    )
    OR
    -- Utiliser la fonction SECURITY DEFINER pour éviter la récursion
    public.is_store_member(store_tasks.store_id, auth.uid())
  );

-- Les propriétaires et membres peuvent créer des tâches
CREATE POLICY "Members and owners can create tasks"
  ON public.store_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_tasks.store_id
      AND s.user_id = auth.uid()
    )
    OR
    public.has_store_permission(store_tasks.store_id, auth.uid(), 'tasks.manage')
  );

-- Les membres peuvent modifier les tâches
CREATE POLICY "Members and owners can update tasks"
  ON public.store_tasks FOR UPDATE
  USING (
    -- Propriétaire
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_tasks.store_id
      AND s.user_id = auth.uid()
    )
    OR
    -- Créateur ou assigné (pas besoin de vérifier store_members)
    (
      store_tasks.created_by = auth.uid()
      OR auth.uid() = ANY(store_tasks.assigned_to)
    )
    OR
    -- Utiliser la fonction pour vérifier les permissions
    public.has_store_permission(store_tasks.store_id, auth.uid(), 'tasks.manage')
  );

-- Les membres peuvent supprimer des tâches
CREATE POLICY "Members and owners can delete tasks"
  ON public.store_tasks FOR DELETE
  USING (
    -- Propriétaire
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_tasks.store_id
      AND s.user_id = auth.uid()
    )
    OR
    -- Créateur (pas besoin de vérifier store_members)
    store_tasks.created_by = auth.uid()
    OR
    -- Utiliser la fonction pour vérifier les permissions
    public.has_store_permission(store_tasks.store_id, auth.uid(), 'tasks.manage')
  );

COMMIT;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

