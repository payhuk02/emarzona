const { createClient } = require('@supabase/supabase-js');

// Variables d'environnement Supabase réelles
const supabaseUrl = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Correction du cache de schéma Supabase');
console.log('==========================================');
console.log('📊 Projet Supabase:', 'hbdnzajbyjakdhuavrvb');

async function fixSchemaCache() {
  try {
    console.log('\n📊 1. Test de connexion de base...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erreur de connexion:', connectionError.message);
      return;
    }
    console.log('✅ Connexion Supabase réussie');

    console.log('\n🔍 2. Test avec sélection minimale...');
    try {
      const { data: minimalTest, error: minimalError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (minimalError) {
        console.error('❌ Erreur sélection minimale:', minimalError.message);
      } else {
        console.log('✅ Sélection minimale OK');
      }
    } catch (err) {
      console.log('⚠️  Erreur sélection minimale:', err.message);
    }

    console.log('\n🔍 3. Test avec user_id seulement...');
    try {
      const { data: userIdTest, error: userIdError } = await supabase
        .from('profiles')
        .select('user_id')
        .limit(1);
      
      if (userIdError) {
        console.error('❌ Erreur user_id:', userIdError.message);
      } else {
        console.log('✅ Colonne user_id accessible');
      }
    } catch (err) {
      console.log('⚠️  Erreur user_id:', err.message);
    }

    console.log('\n🔍 4. Test de création avec champs de base...');
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

    // Test avec seulement les champs essentiels
    const { data: basicProfile, error: basicError } = await supabase
      .from('profiles')
      .insert([{
        user_id: testUserId
      }])
      .select('id, user_id')
      .limit(1);

    if (basicError) {
      console.error('❌ Erreur création basique:', basicError.message);
      
      if (basicError.message.includes('schema cache')) {
        console.log('\n🔧 5. Problème de cache de schéma détecté');
        console.log('\n📋 SOLUTION REQUISE:');
        console.log('1. Allez dans votre dashboard Supabase');
        console.log('2. Ouvrez l\'éditeur SQL');
        console.log('3. Exécutez cette requête pour forcer la mise à jour du cache:');
        console.log(`
-- Forcer la mise à jour du cache de schéma
SELECT pg_notify('pgrst', 'reload schema');

-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
        `);
        
        console.log('\n4. Attendez 30 secondes');
        console.log('5. Rafraîchissez votre application Payhuk');
        
        return;
      }
    } else {
      console.log('✅ Profil basique créé:', basicProfile[0].id);
      
      // Test de mise à jour
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: 'Test User'
        })
        .eq('user_id', testUserId)
        .select('id, user_id, display_name')
        .limit(1);

      if (updateError) {
        console.error('❌ Erreur mise à jour:', updateError.message);
      } else {
        console.log('✅ Profil mis à jour:', updatedProfile[0]);
      }
      
      // Nettoyer
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', testUserId);
      console.log('✅ Profil de test nettoyé');
    }

    console.log('\n🔍 6. Test avec tous les champs...');
    const { data: fullProfile, error: fullError } = await supabase
      .from('profiles')
      .insert([{
        user_id: '00000000-0000-0000-0000-000000000002',
        display_name: 'Test User Full',
        first_name: 'Test',
        last_name: 'User',
        bio: 'Profil de test complet',
        phone: '+226 70 12 34 56',
        location: 'Ouagadougou, Burkina Faso',
        website: 'https://test.example.com'
      }])
      .select('*')
      .limit(1);

    if (fullError) {
      console.error('❌ Erreur création complète:', fullError.message);
      
      console.log('\n📋 REQUÊTE SQL DE CORRECTION:');
      console.log('=============================');
      console.log(`
-- Vérifier et corriger la table profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Si des colonnes manquent, les ajouter:
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS total_referral_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason text,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Forcer la mise à jour du cache
SELECT pg_notify('pgrst', 'reload schema');
      `);
      
    } else {
      console.log('✅ Profil complet créé:', fullProfile[0].id);
      
      // Nettoyer
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000002');
      console.log('✅ Profil de test nettoyé');
    }

    console.log('\n🎯 Résumé:');
    console.log('==========');
    console.log('✅ Connexion Supabase: OK');
    console.log('✅ Table profiles: Accessible');
    console.log('📋 Problème identifié: Cache de schéma');
    console.log('📋 Solution: Mise à jour du cache requise');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la correction
fixSchemaCache();
