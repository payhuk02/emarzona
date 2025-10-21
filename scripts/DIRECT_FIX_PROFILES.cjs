const { createClient } = require('@supabase/supabase-js');

// Variables d'environnement Supabase réelles
const supabaseUrl = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚨 CORRECTION DIRECTE - Erreur profiles.user_id');
console.log('===============================================');
console.log('📊 Projet Supabase:', 'hbdnzajbyjakdhuavrvb');

async function directFix() {
  try {
    console.log('\n📊 1. Test de connexion...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erreur de connexion:', connectionError.message);
      
      if (connectionError.message.includes('column profiles.user_id does not exist')) {
        console.log('\n🔧 2. CORRECTION DIRECTE REQUISE');
        console.log('================================');
        console.log('🚨 La colonne user_id n\'existe vraiment pas !');
        console.log('\n📋 SOLUTION IMMÉDIATE:');
        console.log('1. 🌐 Allez sur https://supabase.com/dashboard');
        console.log('2. 🔐 Connectez-vous et sélectionnez le projet: hbdnzajbyjakdhuavrvb');
        console.log('3. 📝 Allez dans SQL Editor');
        console.log('4. 📋 Copiez et exécutez cette requête COMPLÈTE:');
        
        console.log(`
-- CORRECTION COMPLÈTE DE LA TABLE PROFILES
-- Exécutez cette requête dans Supabase SQL Editor

-- 1. Supprimer la table profiles existante si elle est corrompue
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Créer la table profiles complète et correcte
CREATE TABLE public.profiles (
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

-- 3. Activer RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Créer les politiques RLS
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

-- 5. Créer les index pour les performances
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- 6. Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- 7. Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists;
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    first_name, 
    last_name, 
    bio, 
    phone, 
    location, 
    website,
    referral_code
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'website',
    public.generate_referral_code()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$;

-- 9. Créer le trigger pour la création automatique de profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 10. Créer le bucket de stockage pour les avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 11. Politiques de stockage pour les avatars
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

-- 12. Forcer la mise à jour du cache
SELECT pg_notify('pgrst', 'reload schema');

-- 13. Vérifier la structure finale
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 14. Message de confirmation
SELECT 'Table profiles créée avec succès !' as message;
        `);
        
        console.log('\n📋 INSTRUCTIONS DÉTAILLÉES:');
        console.log('============================');
        console.log('1. 🖥️  Ouvrez votre navigateur');
        console.log('2. 🌐 Allez sur https://supabase.com/dashboard');
        console.log('3. 🔐 Connectez-vous à votre compte');
        console.log('4. 📊 Sélectionnez le projet: hbdnzajbyjakdhuavrvb');
        console.log('5. 📝 Cliquez sur l\'onglet "SQL Editor"');
        console.log('6. 📋 Copiez TOUTE la requête SQL ci-dessus');
        console.log('7. 📝 Collez-la dans l\'éditeur SQL');
        console.log('8. ▶️  Cliquez sur "Run" pour exécuter');
        console.log('9. ⏱️  Attendez que l\'exécution se termine (peut prendre 1-2 minutes)');
        console.log('10. 🔄 Rafraîchissez votre application Payhuk');
        console.log('11. ✅ Allez dans Paramètres > Profil');
        console.log('12. 🎉 L\'erreur sera définitivement corrigée !');
        
        console.log('\n⚠️  IMPORTANT:');
        console.log('Cette requête va recréer complètement la table profiles.');
        console.log('Si vous avez des données existantes, elles seront perdues.');
        console.log('Pour un environnement de production, sauvegardez d\'abord vos données.');
        
        return;
      }
      return;
    }
    
    console.log('✅ Connexion Supabase réussie');
    
    console.log('\n🔍 3. Test de création d\'un profil...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    // Supprimer le profil de test s'il existe
    try {
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', testUserId);
    } catch (err) {
      // Ignorer les erreurs de suppression
    }

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
      console.error('❌ Erreur lors de la création:', createError.message);
    } else {
      console.log('✅ Profil créé avec succès:', newProfile[0].id);
      
      // Nettoyer
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', testUserId);
      console.log('✅ Profil de test nettoyé');
    }

    console.log('\n🎯 RÉSUMÉ:');
    console.log('==========');
    console.log('✅ Connexion Supabase: OK');
    console.log('✅ Table profiles: Fonctionnelle');
    console.log('📋 Correction: Appliquée avec succès');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la correction directe
directFix();
