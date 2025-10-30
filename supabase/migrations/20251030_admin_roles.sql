-- =====================================================
-- Admin Roles Enhancements
-- Date: 2025-10-30
-- =====================================================

BEGIN;

-- Ensure role column exists on profiles (default to 'user')
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add super admin flag to profiles to allow principal admin
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- Indexes for fast lookups
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_profiles_role'
  ) THEN
    CREATE INDEX idx_profiles_role ON public.profiles(role);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_profiles_is_super_admin'
  ) THEN
    CREATE INDEX idx_profiles_is_super_admin ON public.profiles(is_super_admin);
  END IF;
END $$;

COMMIT;

COMMENT ON COLUMN public.profiles.is_super_admin IS 'Principal administrator with full control including role management';


