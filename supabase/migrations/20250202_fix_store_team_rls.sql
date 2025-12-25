-- =====================================================
-- FIX: Store Team RLS Policies
-- Date: 2 Février 2025
-- Description: Correction des politiques RLS pour permettre
--              aux propriétaires de boutique d'accéder aux données
--              même s'ils ne sont pas encore dans store_members
-- =====================================================

BEGIN;

-- =====================================================
-- 1. TRIGGER: Ajouter automatiquement le propriétaire comme membre
-- =====================================================

-- Fonction pour ajouter le propriétaire comme membre owner
CREATE OR REPLACE FUNCTION public.add_store_owner_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si le propriétaire n'est pas déjà membre
  IF NOT EXISTS (
    SELECT 1 FROM public.store_members
    WHERE store_id = NEW.id
    AND user_id = NEW.user_id
  ) THEN
    -- Ajouter le propriétaire comme membre owner
    INSERT INTO public.store_members (
      store_id,
      user_id,
      role,
      status,
      invited_by,
      joined_at,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.user_id,
      'owner',
      'active',
      NEW.user_id,
      now(),
      now(),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trg_add_store_owner_as_member ON public.stores;

-- Créer le trigger
CREATE TRIGGER trg_add_store_owner_as_member
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.add_store_owner_as_member();

-- =====================================================
-- 2. Ajouter les propriétaires existants comme membres
-- =====================================================

-- Insérer les propriétaires existants qui ne sont pas encore membres
INSERT INTO public.store_members (
  store_id,
  user_id,
  role,
  status,
  invited_by,
  joined_at,
  created_at,
  updated_at
)
SELECT 
  s.id,
  s.user_id,
  'owner',
  'active',
  s.user_id,
  s.created_at,
  s.created_at,
  s.updated_at
FROM public.stores s
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_members sm
  WHERE sm.store_id = s.id
  AND sm.user_id = s.user_id
)
ON CONFLICT (store_id, user_id) DO NOTHING;

-- =====================================================
-- 3. AMÉLIORER LES POLITIQUES RLS pour être plus permissives
-- =====================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Members can view team members" ON public.store_members;
DROP POLICY IF EXISTS "Store owners can invite members" ON public.store_members;
DROP POLICY IF EXISTS "Owners and managers can update members" ON public.store_members;
DROP POLICY IF EXISTS "Store owners can remove members" ON public.store_members;

DROP POLICY IF EXISTS "Members can view tasks" ON public.store_tasks;
DROP POLICY IF EXISTS "Members can create tasks" ON public.store_tasks;
DROP POLICY IF EXISTS "Members can update tasks" ON public.store_tasks;
DROP POLICY IF EXISTS "Members can delete tasks" ON public.store_tasks;

-- NOUVELLES POLITIQUES: store_members

-- Les membres actifs ET les propriétaires peuvent voir les membres
-- Utilise une fonction pour éviter la récursion
CREATE POLICY "Members and owners can view team members"
  ON public.store_members FOR SELECT
  USING (
    -- Propriétaire de la boutique (vérifié en premier, pas de récursion)
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id
      AND s.user_id = auth.uid()
    )
    OR
    -- Utiliser la fonction is_store_member pour éviter la récursion
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
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id
      AND s.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_members.store_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'manager')
      AND sm.status = 'active'
    )
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

-- NOUVELLES POLITIQUES: store_tasks

-- Les membres actifs ET les propriétaires peuvent voir les tâches
CREATE POLICY "Members and owners can view tasks"
  ON public.store_tasks FOR SELECT
  USING (
    -- Propriétaire de la boutique (vérifié en premier, pas de récursion)
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_tasks.store_id
      AND s.user_id = auth.uid()
    )
    OR
    -- Utiliser la fonction is_store_member pour éviter la récursion
    public.is_store_member(store_tasks.store_id, auth.uid())
  );

-- Les membres actifs ET les propriétaires peuvent créer des tâches
CREATE POLICY "Members and owners can create tasks"
  ON public.store_tasks FOR INSERT
  WITH CHECK (
    -- Propriétaire de la boutique (vérifié en premier, pas de récursion)
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_tasks.store_id
      AND s.user_id = auth.uid()
    )
    OR
    -- Utiliser la fonction has_store_permission pour éviter la récursion
    public.has_store_permission(store_tasks.store_id, auth.uid(), 'tasks.manage')
  );

-- Les membres peuvent modifier les tâches
CREATE POLICY "Members and owners can update tasks"
  ON public.store_tasks FOR UPDATE
  USING (
    -- Propriétaire de la boutique (vérifié en premier, pas de récursion)
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_tasks.store_id
      AND s.user_id = auth.uid()
    )
    OR
    -- Créateur ou assigné de la tâche
    (
      store_tasks.created_by = auth.uid()
      OR auth.uid() = ANY(store_tasks.assigned_to)
    )
    OR
    -- Utiliser la fonction has_store_permission pour éviter la récursion
    public.has_store_permission(store_tasks.store_id, auth.uid(), 'tasks.manage')
  );

-- Les membres avec permission peuvent supprimer des tâches
CREATE POLICY "Members and owners can delete tasks"
  ON public.store_tasks FOR DELETE
  USING (
    -- Propriétaire de la boutique (vérifié en premier, pas de récursion)
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_tasks.store_id
      AND s.user_id = auth.uid()
    )
    OR
    -- Créateur de la tâche
    store_tasks.created_by = auth.uid()
    OR
    -- Utiliser la fonction has_store_permission pour éviter la récursion
    public.has_store_permission(store_tasks.store_id, auth.uid(), 'tasks.manage')
  );

COMMIT;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

