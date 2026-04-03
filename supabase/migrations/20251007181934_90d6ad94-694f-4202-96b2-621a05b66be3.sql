-- Ajouter des colonnes pour la gestion des comptes utilisateurs
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id);

-- Ajouter une table pour l'historique des actions admin
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS sur admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Policy pour que les admins voient toutes les actions
CREATE POLICY "Admins can view all actions"
ON public.admin_actions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Policy pour que les admins créent des actions
CREATE POLICY "Admins can create actions"
ON public.admin_actions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Ajouter un index pour les recherches
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);