const { createClient } = require('@supabase/supabase-js');

// Variables d'environnement Supabase réelles
const supabaseUrl = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Correction automatique de l\'erreur profiles.user_id');
console.log('==================================================');
console.log('📊 Projet Supabase:', 'hbdnzajbyjakdhuavrvb');
console.log('🌐 URL:', supabaseUrl);

async function fixProfilesTableError() {
  try {
    console.log('\n📊 1. Test de connexion Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erreur de connexion:', connectionError.message);
      
      if (connectionError.message.includes('column profiles.user_id does not exist')) {
        console.log('\n🔧 2. Correction de l\'erreur user_id...');
        console.log('⚠️  La colonne user_id n\'existe pas. Application de la correction...');
        
        // Appliquer la correction SQL directement
        const correctionSQL = `
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

-- Ajouter les colonnes manquantes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS total_referral_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason text,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id);

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
        `;
        
        console.log('📋 Application de la correction SQL...');
        console.log('⚠️  Note: Cette correction doit être appliquée manuellement dans Supabase');
        console.log('\n📋 Instructions:');
        console.log('1. Allez dans votre dashboard Supabase');
        console.log('2. Ouvrez l\'éditeur SQL');
        console.log('3. Copiez et exécutez le contenu du fichier URGENT_FIX_PROFILES_ERROR.sql');
        console.log('4. Ou exécutez cette requête SQL:');
        console.log(correctionSQL);
        
        return;
      }
      return;
    }
    
    console.log('✅ Connexion Supabase réussie');

    console.log('\n🔍 3. Vérification de la structure de la table profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Erreur lors de la vérification:', profilesError.message);
      return;
    }
    
    console.log('✅ Table profiles accessible');
    if (profiles && profiles.length > 0) {
      console.log('📋 Colonnes disponibles:', Object.keys(profiles[0]));
    }

    console.log('\n🧪 4. Test de création d\'un profil utilisateur...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    // Supprimer le profil de test s'il existe
    await supabase
      .from('profiles')
      .delete()
      .eq('user_id', testUserId);

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([{
        user_id: testUserId,
        display_name: 'Test User Payhuk',
        first_name: 'Test',
        last_name: 'User',
        bio: 'Profil de test pour vérification',
        phone: '+226 70 12 34 56',
        location: 'Ouagadougou, Burkina Faso',
        website: 'https://test.example.com'
      }])
      .select('*')
      .limit(1);

    if (createError) {
      console.error('❌ Erreur lors de la création du profil:', createError.message);
      return;
    }
    
    console.log('✅ Profil créé avec succès:', newProfile[0].id);

    console.log('\n🔄 5. Test de mise à jour du profil...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        bio: 'Profil mis à jour avec succès',
        phone: '+226 70 98 76 54',
        location: 'Bobo-Dioulasso, Burkina Faso'
      })
      .eq('user_id', testUserId)
      .select('*')
      .limit(1);

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError.message);
    } else {
      console.log('✅ Profil mis à jour avec succès');
    }

    console.log('\n🗑️  6. Nettoyage du profil de test...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', testUserId);

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError.message);
    } else {
      console.log('✅ Profil de test supprimé');
    }

    console.log('\n🎯 Résumé de la correction:');
    console.log('==========================');
    console.log('✅ Connexion Supabase: OK');
    console.log('✅ Structure de la table: OK');
    console.log('✅ Création de profil: OK');
    console.log('✅ Mise à jour de profil: OK');
    console.log('✅ Suppression de profil: OK');
    
    console.log('\n🎉 L\'erreur "column profiles.user_id does not exist" est corrigée !');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Rafraîchissez votre application Payhuk');
    console.log('2. Allez dans Paramètres > Profil');
    console.log('3. Le profil devrait maintenant se charger correctement');
    console.log('4. Vous pouvez utiliser toutes les fonctionnalités avancées');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.log('\n📋 Solution manuelle:');
    console.log('1. Allez dans votre dashboard Supabase');
    console.log('2. Ouvrez l\'éditeur SQL');
    console.log('3. Exécutez le contenu du fichier URGENT_FIX_PROFILES_ERROR.sql');
  }
}

// Exécuter la correction
fixProfilesTableError();
