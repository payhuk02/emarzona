-- Migration: Fix platform_assets RLS policies
-- Uses public.is_platform_admin() instead of direct profile role checking

BEGIN;

-- Drop the old policies
DROP POLICY IF EXISTS "Admins can upload platform assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update platform assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete platform assets" ON storage.objects;

-- Create the new policies
CREATE POLICY "Admins can upload platform assets" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'platform_assets' 
    AND public.is_platform_admin()
);

CREATE POLICY "Admins can update platform assets" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'platform_assets' 
    AND public.is_platform_admin()
);

CREATE POLICY "Admins can delete platform assets" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'platform_assets' 
    AND public.is_platform_admin()
);

COMMIT;
