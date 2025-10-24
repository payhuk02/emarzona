import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = "https://hbdnzajbyjakdhuavrvb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM";

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables des fonctionnalités avancées
const ADVANCED_TABLES = [
  'conversations',       // Conversations entre clients et vendeurs
  'messages',           // Messages dans les conversations
  'message_attachments', // Fichiers attachés
  'disputes',           // Litiges
  'partial_payments',   // Paiements partiels
  'secured_payments',   // Paiements sécurisés
];

// Colonnes ajoutées aux tables existantes
const MODIFIED_TABLES_COLUMNS = {
  payments: [
    'payment_type',
    'percentage_amount',
    'percentage_rate',
    'remaining_amount',
    'is_held',
    'held_until',
    'release_conditions',
    'delivery_confirmed_at',
    'delivery_confirmed_by',
    'dispute_opened_at',
    'dispute_resolved_at',
    'dispute_resolution',
  ],
  orders: [
    'payment_type',
    'percentage_paid',
    'remaining_amount',
    'delivery_status',
    'delivery_tracking',
    'delivery_notes',
    'delivery_confirmed_at',
    'delivery_confirmed_by',
  ],
};

async function checkTable(tableName) {
  try {
    console.log(`🔍 Vérification de la table: ${tableName}`);
    
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log(`❌ ${tableName} - Table n'existe PAS`);
        return { exists: false, accessible: false, error: error.message };
      } else {
        console.log(`⚠️  ${tableName} - Existe mais erreur d'accès: ${error.message}`);
        return { exists: true, accessible: false, error: error.message };
      }
    } else {
      console.log(`✅ ${tableName} - OK (${count || 0} lignes)`);
      return { exists: true, accessible: true, rowCount: count || 0 };
    }
  } catch (err) {
    console.log(`❌ ${tableName} - Erreur: ${err.message}`);
    return { exists: false, accessible: false, error: err.message };
  }
}

async function checkTableColumns(tableName, columns) {
  console.log(`\n🔍 Vérification des colonnes ajoutées à ${tableName}...`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(columns.join(','))
      .limit(1);

    if (error) {
      console.log(`❌ ${tableName} - Certaines colonnes manquent: ${error.message}`);
      return false;
    } else {
      console.log(`✅ ${tableName} - Toutes les nouvelles colonnes existent`);
      return true;
    }
  } catch (err) {
    console.log(`❌ ${tableName} - Erreur: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Vérification des tables et fonctionnalités avancées\n');
  console.log('📊 Tables à vérifier:', ADVANCED_TABLES.join(', '), '\n');

  let summary = {
    newTables: { total: ADVANCED_TABLES.length, exists: 0, missing: [] },
    modifiedTables: { total: Object.keys(MODIFIED_TABLES_COLUMNS).length, allColumnsExist: 0, missingColumns: [] },
  };

  // Vérifier les nouvelles tables
  console.log('=' .repeat(60));
  console.log('1️⃣  NOUVELLES TABLES');
  console.log('=' .repeat(60) + '\n');

  for (const table of ADVANCED_TABLES) {
    const result = await checkTable(table);
    if (result.exists) {
      summary.newTables.exists++;
    } else {
      summary.newTables.missing.push(table);
    }
  }

  // Vérifier les colonnes ajoutées aux tables existantes
  console.log('\n' + '=' .repeat(60));
  console.log('2️⃣  COLONNES AJOUTÉES AUX TABLES EXISTANTES');
  console.log('=' .repeat(60));

  for (const [table, columns] of Object.entries(MODIFIED_TABLES_COLUMNS)) {
    const allExist = await checkTableColumns(table, columns);
    if (allExist) {
      summary.modifiedTables.allColumnsExist++;
    } else {
      summary.modifiedTables.missingColumns.push(table);
    }
  }

  // Afficher le résumé
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RÉSUMÉ DE LA VÉRIFICATION');
  console.log('=' .repeat(60) + '\n');

  console.log('📋 Nouvelles tables:');
  console.log(`   ✅ Existantes: ${summary.newTables.exists}/${summary.newTables.total}`);
  if (summary.newTables.missing.length > 0) {
    console.log(`   ❌ Manquantes (${summary.newTables.missing.length}): ${summary.newTables.missing.join(', ')}`);
  }

  console.log('\n📋 Tables modifiées (colonnes ajoutées):');
  console.log(`   ✅ Complètes: ${summary.modifiedTables.allColumnsExist}/${summary.modifiedTables.total}`);
  if (summary.modifiedTables.missingColumns.length > 0) {
    console.log(`   ❌ Avec colonnes manquantes (${summary.modifiedTables.missingColumns.length}): ${summary.modifiedTables.missingColumns.join(', ')}`);
  }

  console.log('\n' + '=' .repeat(60));

  // Statut final
  const allOk = summary.newTables.exists === summary.newTables.total &&
                summary.modifiedTables.allColumnsExist === summary.modifiedTables.total;

  if (allOk) {
    console.log('🎉 STATUT: TOUTES LES FONCTIONNALITÉS AVANCÉES SONT OPÉRATIONNELLES !\n');
    console.log('✅ La migration a été appliquée avec succès.');
    console.log('✅ Vous pouvez utiliser:');
    console.log('   - Messagerie client-vendeur');
    console.log('   - Système de litiges');
    console.log('   - Paiements sécurisés');
    console.log('   - Paiements partiels\n');
  } else {
    console.log('⚠️  STATUT: MIGRATION PARTIELLE OU NON APPLIQUÉE\n');
    console.log('❌ Action requise: Exécuter la migration Supabase');
    console.log('📄 Fichier: supabase/migrations/20250122_advanced_payment_and_messaging.sql');
    console.log('\nÉtapes:');
    console.log('1. Ouvrir le dashboard Supabase');
    console.log('2. Aller dans "SQL Editor"');
    console.log('3. Coller le contenu du fichier de migration');
    console.log('4. Exécuter le script SQL\n');
  }

  console.log('=' .repeat(60) + '\n');
}

main();

