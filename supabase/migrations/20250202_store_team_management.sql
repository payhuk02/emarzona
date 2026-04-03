-- =====================================================
-- STORE TEAM MANAGEMENT SYSTEM
-- Date: 2 Février 2025
-- Description: Système complet de gestion d'équipe pour les vendeurs
--              Permet aux vendeurs d'inviter des membres et d'assigner des tâches
-- Version: 1.0
-- =====================================================

BEGIN;

-- =====================================================
-- 1. TABLE: store_members
-- =====================================================

CREATE TABLE IF NOT EXISTS public.store_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rôle et permissions
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'support', 'viewer')) DEFAULT 'staff',
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Invitation
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  invitation_token TEXT UNIQUE,
  invitation_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  
  -- Statut
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'inactive', 'removed')) DEFAULT 'pending',
  joined_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES auth.users(id),
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(store_id, user_id)
);

-- Indexes pour store_members
CREATE INDEX IF NOT EXISTS idx_store_members_store_id ON public.store_members(store_id);
CREATE INDEX IF NOT EXISTS idx_store_members_user_id ON public.store_members(user_id);
CREATE INDEX IF NOT EXISTS idx_store_members_status ON public.store_members(status);
CREATE INDEX IF NOT EXISTS idx_store_members_role ON public.store_members(role);
CREATE INDEX IF NOT EXISTS idx_store_members_invitation_token ON public.store_members(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_members_store_user_active ON public.store_members(store_id, user_id, status) WHERE status = 'active';

-- Trigger pour updated_at
CREATE TRIGGER update_store_members_updated_at
  BEFORE UPDATE ON public.store_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.store_members IS 'Membres de l''équipe d''une boutique';
COMMENT ON COLUMN public.store_members.role IS 'Rôle du membre: owner, manager, staff, support, viewer';
COMMENT ON COLUMN public.store_members.permissions IS 'Permissions personnalisées en JSONB';
COMMENT ON COLUMN public.store_members.invitation_token IS 'Token unique pour accepter l''invitation';
COMMENT ON COLUMN public.store_members.status IS 'Statut: pending (invitation), active (membre actif), inactive, removed';

-- =====================================================
-- 2. TABLE: store_tasks
-- =====================================================

CREATE TABLE IF NOT EXISTS public.store_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Création et assignation
  created_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID[] NOT NULL DEFAULT '{}', -- Array de user_id
  assigned_by UUID REFERENCES auth.users(id),
  
  -- Informations de la tâche
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('product', 'order', 'customer', 'marketing', 'inventory', 'other')) DEFAULT 'other',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  
  -- Statut et dates
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled', 'on_hold')) DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Organisation
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]'::jsonb, -- [{url, name, size, type}]
  
  -- Liens vers d'autres entités
  related_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  related_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour store_tasks
CREATE INDEX IF NOT EXISTS idx_store_tasks_store_id ON public.store_tasks(store_id);
CREATE INDEX IF NOT EXISTS idx_store_tasks_created_by ON public.store_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_store_tasks_assigned_to ON public.store_tasks USING GIN(assigned_to);
CREATE INDEX IF NOT EXISTS idx_store_tasks_status ON public.store_tasks(status);
CREATE INDEX IF NOT EXISTS idx_store_tasks_priority ON public.store_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_store_tasks_category ON public.store_tasks(category);
CREATE INDEX IF NOT EXISTS idx_store_tasks_due_date ON public.store_tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_tasks_related_product ON public.store_tasks(related_product_id) WHERE related_product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_tasks_related_order ON public.store_tasks(related_order_id) WHERE related_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_tasks_related_customer ON public.store_tasks(related_customer_id) WHERE related_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_tasks_store_status ON public.store_tasks(store_id, status);
CREATE INDEX IF NOT EXISTS idx_store_tasks_store_priority ON public.store_tasks(store_id, priority) WHERE status != 'completed';

-- Trigger pour updated_at
CREATE TRIGGER update_store_tasks_updated_at
  BEFORE UPDATE ON public.store_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.store_tasks IS 'Tâches assignées aux membres de l''équipe';
COMMENT ON COLUMN public.store_tasks.assigned_to IS 'Array de user_id des membres assignés';
COMMENT ON COLUMN public.store_tasks.category IS 'Catégorie: product, order, customer, marketing, inventory, other';
COMMENT ON COLUMN public.store_tasks.priority IS 'Priorité: low, medium, high, urgent';
COMMENT ON COLUMN public.store_tasks.status IS 'Statut: pending, in_progress, review, completed, cancelled, on_hold';

-- =====================================================
-- 3. TABLE: store_task_comments
-- =====================================================

CREATE TABLE IF NOT EXISTS public.store_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.store_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contenu
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  is_internal BOOLEAN DEFAULT false, -- Commentaire interne (non visible par tous)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour store_task_comments
CREATE INDEX IF NOT EXISTS idx_store_task_comments_task_id ON public.store_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_store_task_comments_user_id ON public.store_task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_store_task_comments_created_at ON public.store_task_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_task_comments_task_created ON public.store_task_comments(task_id, created_at DESC);

-- Trigger pour updated_at
CREATE TRIGGER update_store_task_comments_updated_at
  BEFORE UPDATE ON public.store_task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.store_task_comments IS 'Commentaires sur les tâches';
COMMENT ON COLUMN public.store_task_comments.is_internal IS 'Si true, commentaire interne visible uniquement par les managers';

-- =====================================================
-- 4. TABLE: store_task_history
-- =====================================================

CREATE TABLE IF NOT EXISTS public.store_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.store_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Changement
  action TEXT NOT NULL, -- 'created', 'assigned', 'status_changed', 'priority_changed', 'due_date_changed', etc.
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour store_task_history
CREATE INDEX IF NOT EXISTS idx_store_task_history_task_id ON public.store_task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_store_task_history_user_id ON public.store_task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_store_task_history_created_at ON public.store_task_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_task_history_task_created ON public.store_task_history(task_id, created_at DESC);

-- Comments
COMMENT ON TABLE public.store_task_history IS 'Historique des modifications des tâches';
COMMENT ON COLUMN public.store_task_history.action IS 'Type d''action: created, assigned, status_changed, etc.';

-- =====================================================
-- 5. ENABLE RLS
-- =====================================================

ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_task_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. RLS POLICIES: store_members
-- =====================================================

-- Les membres actifs peuvent voir les autres membres de leur boutique
DROP POLICY IF EXISTS "Members can view team members" ON public.store_members;
CREATE POLICY "Members can view team members"
  ON public.store_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_members.store_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id
      AND s.user_id = auth.uid()
    )
  );

-- Seul le propriétaire peut inviter des membres
DROP POLICY IF EXISTS "Store owners can invite members" ON public.store_members;
CREATE POLICY "Store owners can invite members"
  ON public.store_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id
      AND s.user_id = auth.uid()
    )
  );

-- Le propriétaire et les managers peuvent modifier les membres
DROP POLICY IF EXISTS "Owners and managers can update members" ON public.store_members;
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

-- Seul le propriétaire peut supprimer des membres
DROP POLICY IF EXISTS "Store owners can remove members" ON public.store_members;
CREATE POLICY "Store owners can remove members"
  ON public.store_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_members.store_id
      AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- 7. RLS POLICIES: store_tasks
-- =====================================================

-- Les membres actifs peuvent voir les tâches de leur boutique
DROP POLICY IF EXISTS "Members can view tasks" ON public.store_tasks;
CREATE POLICY "Members can view tasks"
  ON public.store_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_tasks.store_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_tasks.store_id
      AND s.user_id = auth.uid()
    )
  );

-- Les membres avec permission peuvent créer des tâches
DROP POLICY IF EXISTS "Members can create tasks" ON public.store_tasks;
CREATE POLICY "Members can create tasks"
  ON public.store_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_tasks.store_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
      AND (
        sm.role IN ('owner', 'manager', 'staff')
        OR (sm.permissions->>'tasks.manage')::boolean = true
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_tasks.store_id
      AND s.user_id = auth.uid()
    )
  );

-- Les membres peuvent modifier leurs propres tâches ou celles qui leur sont assignées
DROP POLICY IF EXISTS "Members can update tasks" ON public.store_tasks;
CREATE POLICY "Members can update tasks"
  ON public.store_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_tasks.store_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
      AND (
        store_tasks.created_by = auth.uid()
        OR auth.uid() = ANY(store_tasks.assigned_to)
        OR sm.role IN ('owner', 'manager')
        OR (sm.permissions->>'tasks.manage')::boolean = true
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_tasks.store_id
      AND s.user_id = auth.uid()
    )
  );

-- Les membres avec permission peuvent supprimer des tâches
DROP POLICY IF EXISTS "Members can delete tasks" ON public.store_tasks;
CREATE POLICY "Members can delete tasks"
  ON public.store_tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.store_members sm
      WHERE sm.store_id = store_tasks.store_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
      AND (
        store_tasks.created_by = auth.uid()
        OR sm.role IN ('owner', 'manager')
        OR (sm.permissions->>'tasks.manage')::boolean = true
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_tasks.store_id
      AND s.user_id = auth.uid()
    )
  );

-- =====================================================
-- 8. RLS POLICIES: store_task_comments
-- =====================================================

-- Les membres actifs peuvent voir les commentaires des tâches de leur boutique
DROP POLICY IF EXISTS "Members can view task comments" ON public.store_task_comments;
CREATE POLICY "Members can view task comments"
  ON public.store_task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_tasks st
      JOIN public.store_members sm ON sm.store_id = st.store_id
      WHERE st.id = store_task_comments.task_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
      AND (
        NOT store_task_comments.is_internal
        OR sm.role IN ('owner', 'manager')
        OR (sm.permissions->>'tasks.manage')::boolean = true
      )
    )
  );

-- Les membres actifs peuvent créer des commentaires
DROP POLICY IF EXISTS "Members can create task comments" ON public.store_task_comments;
CREATE POLICY "Members can create task comments"
  ON public.store_task_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_tasks st
      JOIN public.store_members sm ON sm.store_id = st.store_id
      WHERE st.id = store_task_comments.task_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
  );

-- Les membres peuvent modifier leurs propres commentaires
DROP POLICY IF EXISTS "Members can update own comments" ON public.store_task_comments;
CREATE POLICY "Members can update own comments"
  ON public.store_task_comments FOR UPDATE
  USING (user_id = auth.uid());

-- Les membres peuvent supprimer leurs propres commentaires ou les managers peuvent supprimer tous
DROP POLICY IF EXISTS "Members can delete comments" ON public.store_task_comments;
CREATE POLICY "Members can delete comments"
  ON public.store_task_comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.store_tasks st
      JOIN public.store_members sm ON sm.store_id = st.store_id
      WHERE st.id = store_task_comments.task_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
      AND sm.role IN ('owner', 'manager')
    )
  );

-- =====================================================
-- 9. RLS POLICIES: store_task_history
-- =====================================================

-- Les membres actifs peuvent voir l'historique des tâches de leur boutique
DROP POLICY IF EXISTS "Members can view task history" ON public.store_task_history;
CREATE POLICY "Members can view task history"
  ON public.store_task_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_tasks st
      JOIN public.store_members sm ON sm.store_id = st.store_id
      WHERE st.id = store_task_history.task_id
      AND sm.user_id = auth.uid()
      AND sm.status = 'active'
    )
  );

-- L'historique est créé automatiquement par les triggers, pas besoin de INSERT policy

-- =====================================================
-- 10. FUNCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour vérifier si un utilisateur est membre d'une boutique
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

COMMENT ON FUNCTION public.is_store_member IS 'Vérifie si un utilisateur est membre actif d''une boutique ou en est le propriétaire';

-- Fonction pour obtenir le rôle d'un membre dans une boutique
CREATE OR REPLACE FUNCTION public.get_store_member_role(_store_id UUID, _user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.stores
        WHERE id = _store_id AND user_id = _user_id
      ) THEN 'owner'
      ELSE (
        SELECT role
        FROM public.store_members
        WHERE store_id = _store_id
        AND user_id = _user_id
        AND status = 'active'
        LIMIT 1
      )
    END;
$$;

COMMENT ON FUNCTION public.get_store_member_role IS 'Retourne le rôle d''un utilisateur dans une boutique (owner si propriétaire, sinon le rôle du membre)';

-- Fonction pour vérifier si un membre a une permission spécifique
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
  _has_permission BOOLEAN := false;
BEGIN
  -- Vérifier si c'est le propriétaire
  IF EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND user_id = _user_id
  ) THEN
    RETURN true; -- Le propriétaire a toutes les permissions
  END IF;

  -- Récupérer le rôle et les permissions
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
    _has_permission := (_permissions->>_permission)::boolean;
    IF _has_permission THEN
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

COMMENT ON FUNCTION public.has_store_permission IS 'Vérifie si un membre a une permission spécifique dans une boutique';

-- Fonction pour accepter une invitation
CREATE OR REPLACE FUNCTION public.accept_store_invitation(_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _member_id UUID;
BEGIN
  -- Vérifier que le token existe et n'est pas expiré
  SELECT id INTO _member_id
  FROM public.store_members
  WHERE invitation_token = _token
  AND status = 'pending'
  AND invitation_expires_at > now()
  AND user_id = auth.uid()
  LIMIT 1;

  IF _member_id IS NULL THEN
    RETURN false;
  END IF;

  -- Mettre à jour le statut
  UPDATE public.store_members
  SET 
    status = 'active',
    joined_at = now(),
    invitation_token = NULL
  WHERE id = _member_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.accept_store_invitation IS 'Accepte une invitation à rejoindre une boutique';

-- =====================================================
-- 11. TRIGGERS POUR L'HISTORIQUE DES TÂCHES
-- =====================================================

-- Trigger pour enregistrer l'historique des changements de tâches
CREATE OR REPLACE FUNCTION public.log_store_task_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enregistrer la création
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.store_task_history (task_id, user_id, action, new_value, metadata)
    VALUES (NEW.id, NEW.created_by, 'created', NEW.title, jsonb_build_object('status', NEW.status, 'priority', NEW.priority));
    RETURN NEW;
  END IF;

  -- Enregistrer les modifications
  IF TG_OP = 'UPDATE' THEN
    -- Changement de statut
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.store_task_history (task_id, user_id, action, old_value, new_value, metadata)
      VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status, NEW.status, '{}'::jsonb);
    END IF;

    -- Changement de priorité
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO public.store_task_history (task_id, user_id, action, old_value, new_value, metadata)
      VALUES (NEW.id, auth.uid(), 'priority_changed', OLD.priority, NEW.priority, '{}'::jsonb);
    END IF;

    -- Changement d'assignation
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO public.store_task_history (task_id, user_id, action, old_value, new_value, metadata)
      VALUES (NEW.id, auth.uid(), 'assigned', 
              array_to_string(OLD.assigned_to, ','), 
              array_to_string(NEW.assigned_to, ','), 
              '{}'::jsonb);
    END IF;

    -- Changement de date d'échéance
    IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
      INSERT INTO public.store_task_history (task_id, user_id, action, old_value, new_value, metadata)
      VALUES (NEW.id, auth.uid(), 'due_date_changed', 
              COALESCE(OLD.due_date::text, ''), 
              COALESCE(NEW.due_date::text, ''), 
              '{}'::jsonb);
    END IF;

    -- Tâche commencée
    IF OLD.started_at IS NULL AND NEW.started_at IS NOT NULL THEN
      INSERT INTO public.store_task_history (task_id, user_id, action, metadata)
      VALUES (NEW.id, auth.uid(), 'started', '{}'::jsonb);
    END IF;

    -- Tâche terminée
    IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
      INSERT INTO public.store_task_history (task_id, user_id, action, metadata)
      VALUES (NEW.id, auth.uid(), 'completed', '{}'::jsonb);
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_log_store_task_history ON public.store_tasks;
CREATE TRIGGER trigger_log_store_task_history
  AFTER INSERT OR UPDATE ON public.store_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_store_task_history();

COMMENT ON FUNCTION public.log_store_task_history IS 'Enregistre automatiquement l''historique des modifications de tâches';

-- =====================================================
-- 12. TRIGGER POUR AUTO-ASSIGNER LE PROPRIÉTAIRE
-- =====================================================

-- Trigger pour ajouter automatiquement le propriétaire comme membre owner
CREATE OR REPLACE FUNCTION public.auto_add_store_owner_as_member()
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
      invited_by,
      status,
      joined_at
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'owner',
      NEW.user_id,
      'active',
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger (seulement pour les nouvelles boutiques)
DROP TRIGGER IF EXISTS trigger_auto_add_store_owner ON public.stores;
CREATE TRIGGER trigger_auto_add_store_owner
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_store_owner_as_member();

COMMENT ON FUNCTION public.auto_add_store_owner_as_member IS 'Ajoute automatiquement le propriétaire comme membre owner lors de la création d''une boutique';

COMMIT;

