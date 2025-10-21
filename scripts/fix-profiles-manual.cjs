const { createClient } = require('@supabase/supabase-js');

// Utiliser les variables d'environnement Supabase directement
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

console.log('🔧 Correction de l\'erreur profiles.user_id');
console.log('=========================================');

console.log('\n📋 Instructions pour corriger l\'erreur:');
console.log('1. Connectez-vous à votre dashboard Supabase');
console.log('2. Allez dans l\'éditeur SQL');
console.log('3. Exécutez cette requête SQL:');

console.log(`
-- Créer ou corriger la table profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url text,
  display_name text,
  first_name text,
  last_name text,
  bio text,
  phone text,
  location text,
  website text,
  referral_code text UNIQUE,
  referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_referral_earnings numeric DEFAULT 0,
  is_suspended boolean DEFAULT false,
  suspension_reason text,
  suspended_at timestamp with time zone,
  suspended_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Créer les nouvelles politiques RLS
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Créer le bucket de stockage pour les avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques de stockage pour les avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
`);

console.log('\n🎯 Après avoir exécuté cette requête:');
console.log('1. Rafraîchissez votre application web');
console.log('2. Allez dans Paramètres > Profil');
console.log('3. L\'erreur devrait être corrigée');
console.log('4. Vous pourrez utiliser toutes les fonctionnalités avancées');

console.log('\n✅ Le système de profil avancé sera entièrement fonctionnel !');
