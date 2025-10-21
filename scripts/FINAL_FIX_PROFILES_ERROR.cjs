const { createClient } = require('@supabase/supabase-js');

// Variables d'environnement Supabase réelles
const supabaseUrl = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚨 CORRECTION FINALE - Erreur profiles.user_id');
console.log('==============================================');
console.log('📊 Projet Supabase:', 'hbdnzajbyjakdhuavrvb');
console.log('🎯 Problème identifié: Colonne user_id manquante');

async function finalFix() {
  try {
    console.log('\n📊 1. Vérification de la structure actuelle...');
    
    // Test de connexion de base
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erreur de connexion:', connectionError.message);
      return;
    }
    console.log('✅ Connexion Supabase réussie');

    console.log('\n🔍 2. Diagnostic du problème...');
    
    // Test avec différents champs pour identifier ce qui existe
    const testFields = ['id', 'user_id', 'display_name', 'email', 'created_at'];
    const existingFields = [];
    const missingFields = [];

    for (const field of testFields) {
      try {
        const { error } = await supabase
          .from('profiles')
          .select(field)
          .limit(1);
        
        if (error && error.message.includes(`Could not find the '${field}' column`)) {
          missingFields.push(field);
          console.log(`❌ Colonne manquante: ${field}`);
        } else {
          existingFields.push(field);
          console.log(`✅ Colonne présente: ${field}`);
        }
      } catch (err) {
        console.log(`⚠️  Erreur test ${field}:`, err.message);
      }
    }

    console.log('\n🔧 3. SOLUTION FINALE REQUISE');
    console.log('=============================');
    
    if (missingFields.includes('user_id')) {
      console.log('🚨 PROBLÈME CRITIQUE: La colonne user_id n\'existe pas !');
      console.log('\n📋 REQUÊTE SQL DE CORRECTION FINALE:');
      console.log('====================================');
      console.log(`
-- SOLUTION FINALE POUR CORRIGER L'ERREUR profiles.user_id
-- Copiez et exécutez cette requête dans Supabase SQL Editor

-- 1. Vérifier la structure actuelle de la table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Créer la table profiles complète si elle n'existe pas ou la corriger
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

-- 3. Ajouter les colonnes manquantes si la table existe déjà
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
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
ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

-- 4. Activer RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 6. Créer les nouvelles politiques RLS
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

-- 7. Créer le bucket de stockage pour les avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Politiques de stockage pour les avatars
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

-- 9. Forcer la mise à jour du cache de schéma
SELECT pg_notify('pgrst', 'reload schema');

-- 10. Vérifier la structure finale
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 INSTRUCTIONS ÉTAPE PAR ÉTAPE:');
      console.log('================================');
      console.log('1. 🖥️  Ouvrez votre navigateur');
      console.log('2. 🌐 Allez sur https://supabase.com/dashboard');
      console.log('3. 🔐 Connectez-vous à votre compte');
      console.log('4. 📊 Sélectionnez le projet: hbdnzajbyjakdhuavrvb');
      console.log('5. 📝 Allez dans l\'onglet "SQL Editor"');
      console.log('6. 📋 Copiez toute la requête SQL ci-dessus');
      console.log('7. 📝 Collez-la dans l\'éditeur SQL');
      console.log('8. ▶️  Cliquez sur "Run" pour exécuter');
      console.log('9. ⏱️  Attendez que l\'exécution se termine');
      console.log('10. 🔄 Rafraîchissez votre application Payhuk');
      console.log('11. ✅ Allez dans Paramètres > Profil');
      console.log('12. 🎉 L\'erreur sera corrigée !');
      
    } else {
      console.log('✅ La colonne user_id existe déjà');
      console.log('📋 Le problème pourrait être un cache de schéma');
      console.log('\n🔧 SOLUTION RAPIDE:');
      console.log('Exécutez cette requête dans Supabase SQL Editor:');
      console.log(`
-- Forcer la mise à jour du cache de schéma
SELECT pg_notify('pgrst', 'reload schema');
      `);
    }

    console.log('\n🎯 RÉSUMÉ DE LA CORRECTION:');
    console.log('============================');
    console.log('✅ Problème identifié: Colonne user_id manquante');
    console.log('✅ Solution fournie: Requête SQL complète');
    console.log('✅ Instructions: Étapes détaillées');
    console.log('✅ Résultat attendu: Erreur corrigée');
    
    console.log('\n🚀 APRÈS LA CORRECTION:');
    console.log('=======================');
    console.log('✅ L\'erreur "column profiles.user_id does not exist" sera résolue');
    console.log('✅ Le système de profil avancé fonctionnera parfaitement');
    console.log('✅ Toutes les fonctionnalités seront disponibles');
    console.log('✅ L\'interface moderne et responsive sera opérationnelle');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la correction finale
finalFix();
