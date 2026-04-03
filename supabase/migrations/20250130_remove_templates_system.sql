-- =========================================================
-- Migration: Remove Templates System
-- Date: 30/01/2025
-- Description: Suppression complète du système de templates utilisateur
-- =========================================================

-- Supprimer les policies RLS
DROP POLICY IF EXISTS "Users can view their own templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can view public templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.user_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.user_templates;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS update_user_templates_updated_at ON public.user_templates;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.update_user_templates_updated_at();

-- Supprimer les indexes
DROP INDEX IF EXISTS idx_user_templates_user_id;
DROP INDEX IF EXISTS idx_user_templates_product_type;
DROP INDEX IF EXISTS idx_user_templates_category;
DROP INDEX IF EXISTS idx_user_templates_is_public;
DROP INDEX IF EXISTS idx_user_templates_created_at;
DROP INDEX IF EXISTS idx_user_templates_usage_count;
DROP INDEX IF EXISTS idx_user_templates_template_data;

-- Supprimer la table
DROP TABLE IF EXISTS public.user_templates;

-- Commentaire de confirmation
COMMENT ON SCHEMA public IS 'Système de templates utilisateur supprimé le 30/01/2025';

