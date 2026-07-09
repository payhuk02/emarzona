-- Migration: Create platform_assets storage bucket
-- Purpose: Store dynamic images and assets uploaded from the Admin dashboard.

INSERT INTO storage.buckets (id, name, public)
VALUES ('platform_assets', 'platform_assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for platform_assets

-- 1. Public can read all assets in platform_assets
CREATE POLICY "Public can read platform assets" 
ON storage.objects FOR SELECT
USING (bucket_id = 'platform_assets');

-- 2. Authenticated users with admin role can insert assets
CREATE POLICY "Admins can upload platform assets" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'platform_assets' 
    AND (auth.jwt() ->> 'role' = 'admin' OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ))
);

-- 3. Authenticated users with admin role can update assets
CREATE POLICY "Admins can update platform assets" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'platform_assets' 
    AND (auth.jwt() ->> 'role' = 'admin' OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ))
);

-- 4. Authenticated users with admin role can delete assets
CREATE POLICY "Admins can delete platform assets" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'platform_assets' 
    AND (auth.jwt() ->> 'role' = 'admin' OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ))
);
