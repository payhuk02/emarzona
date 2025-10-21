const { createClient } = require('@supabase/supabase-js');

// Variables d'environnement Supabase réelles
const supabaseUrl = 'https://hbdnzajbyjakdhuavrvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Correction des colonnes manquantes dans la table profiles');
console.log('============================================================');
console.log('📊 Projet Supabase:', 'hbdnzajbyjakdhuavrvb');

async function fixMissingColumns() {
  try {
    console.log('\n📊 1. Vérification de la structure actuelle...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Erreur:', profilesError.message);
      return;
    }
    
    console.log('✅ Table profiles accessible');
    if (profiles && profiles.length > 0) {
      console.log('📋 Colonnes actuelles:', Object.keys(profiles[0]));
    } else {
      console.log('📋 Table profiles vide - colonnes à vérifier');
    }

    console.log('\n🔍 2. Test des colonnes manquantes...');
    
    // Tester chaque colonne individuellement
    const columnsToTest = [
      'user_id',
      'display_name', 
      'first_name',
      'last_name',
      'bio',
      'phone',
      'location',
      'website',
      'avatar_url',
      'referral_code',
      'referred_by',
      'total_referral_earnings',
      'is_suspended',
      'suspension_reason',
      'suspended_at',
      'suspended_by',
      'created_at',
      'updated_at'
    ];

    const missingColumns = [];
    
    for (const column of columnsToTest) {
      try {
        const { error } = await supabase
          .from('profiles')
          .select(column)
          .limit(1);
        
        if (error && error.message.includes(`Could not find the '${column}' column`)) {
          missingColumns.push(column);
          console.log(`❌ Colonne manquante: ${column}`);
        } else {
          console.log(`✅ Colonne présente: ${column}`);
        }
      } catch (err) {
        console.log(`⚠️  Erreur lors du test de ${column}:`, err.message);
      }
    }

    if (missingColumns.length > 0) {
      console.log('\n🔧 3. Colonnes à ajouter:', missingColumns);
      console.log('\n📋 REQUÊTE SQL À EXÉCUTER DANS SUPABASE:');
      console.log('==========================================');
      
      let alterSQL = '-- Ajouter les colonnes manquantes\n';
      alterSQL += 'ALTER TABLE public.profiles\n';
      
      missingColumns.forEach((column, index) => {
        let columnDef = '';
        switch (column) {
          case 'user_id':
            columnDef = 'ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE';
            break;
          case 'display_name':
            columnDef = 'ADD COLUMN IF NOT EXISTS display_name text';
            break;
          case 'first_name':
            columnDef = 'ADD COLUMN IF NOT EXISTS first_name text';
            break;
          case 'last_name':
            columnDef = 'ADD COLUMN IF NOT EXISTS last_name text';
            break;
          case 'bio':
            columnDef = 'ADD COLUMN IF NOT EXISTS bio text';
            break;
          case 'phone':
            columnDef = 'ADD COLUMN IF NOT EXISTS phone text';
            break;
          case 'location':
            columnDef = 'ADD COLUMN IF NOT EXISTS location text';
            break;
          case 'website':
            columnDef = 'ADD COLUMN IF NOT EXISTS website text';
            break;
          case 'avatar_url':
            columnDef = 'ADD COLUMN IF NOT EXISTS avatar_url text';
            break;
          case 'referral_code':
            columnDef = 'ADD COLUMN IF NOT EXISTS referral_code text UNIQUE';
            break;
          case 'referred_by':
            columnDef = 'ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL';
            break;
          case 'total_referral_earnings':
            columnDef = 'ADD COLUMN IF NOT EXISTS total_referral_earnings numeric DEFAULT 0';
            break;
          case 'is_suspended':
            columnDef = 'ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false';
            break;
          case 'suspension_reason':
            columnDef = 'ADD COLUMN IF NOT EXISTS suspension_reason text';
            break;
          case 'suspended_at':
            columnDef = 'ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone';
            break;
          case 'suspended_by':
            columnDef = 'ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id)';
            break;
          case 'created_at':
            columnDef = 'ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now()';
            break;
          case 'updated_at':
            columnDef = 'ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now()';
            break;
          default:
            columnDef = `ADD COLUMN IF NOT EXISTS ${column} text`;
        }
        
        alterSQL += `  ${columnDef}`;
        if (index < missingColumns.length - 1) {
          alterSQL += ',';
        }
        alterSQL += '\n';
      });
      
      alterSQL += ';';
      
      console.log(alterSQL);
      
      console.log('\n📋 INSTRUCTIONS:');
      console.log('1. Copiez la requête SQL ci-dessus');
      console.log('2. Allez dans votre dashboard Supabase');
      console.log('3. Ouvrez l\'éditeur SQL');
      console.log('4. Collez et exécutez la requête');
      console.log('5. Rafraîchissez votre application Payhuk');
      
    } else {
      console.log('\n✅ Toutes les colonnes sont présentes !');
      
      console.log('\n🧪 4. Test de création d\'un profil...');
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
    }

    console.log('\n🎯 Résumé:');
    console.log('==========');
    console.log('✅ Connexion Supabase: OK');
    console.log('✅ Table profiles: Accessible');
    if (missingColumns.length > 0) {
      console.log(`⚠️  Colonnes manquantes: ${missingColumns.length}`);
      console.log('📋 Correction nécessaire: OUI');
    } else {
      console.log('✅ Toutes les colonnes: Présentes');
      console.log('📋 Correction nécessaire: NON');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la vérification
fixMissingColumns();
