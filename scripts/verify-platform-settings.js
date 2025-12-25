/**
 * Script de vérification de la table platform_settings
 * Vérifie que la migration a été appliquée correctement
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPlatformSettings() {
  console.log('\n🔍 Vérification de platform_settings...\n');

  try {
    // 1. Vérifier que la table existe et contient des données
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .single();

    if (error) {
      console.error('❌ Erreur lors de la récupération des paramètres:', error.message);
      console.error('\n💡 Solution : Exécutez la migration SQL dans Supabase SQL Editor');
      console.error('   Fichier : supabase/migrations/20250124_platform_settings.sql\n');
      return false;
    }

    if (!data) {
      console.error('❌ La table existe mais ne contient pas de données');
      console.error('\n💡 Solution : Exécutez la partie INSERT de la migration SQL\n');
      return false;
    }

    // 2. Vérifier les colonnes obligatoires
    const requiredFields = [
      'id',
      'platform_commission_rate',
      'referral_commission_rate',
      'min_withdrawal_amount',
      'auto_approve_withdrawals',
      'email_notifications',
      'sms_notifications',
      'created_at',
      'updated_at',
    ];

    const missingFields = requiredFields.filter(field => !(field in data));

    if (missingFields.length > 0) {
      console.error('❌ Colonnes manquantes:', missingFields.join(', '));
      return false;
    }

    // 3. Afficher les paramètres actuels
    console.log('✅ Table platform_settings vérifiée avec succès!\n');
    console.log('📊 Paramètres actuels:');
    console.log('  ├─ Commission Plateforme:', data.platform_commission_rate + '%');
    console.log('  ├─ Commission Parrainage:', data.referral_commission_rate + '%');
    console.log('  ├─ Montant minimum retrait:', data.min_withdrawal_amount + ' XOF');
    console.log('  ├─ Auto-approbation retraits:', data.auto_approve_withdrawals ? 'Activé' : 'Désactivé');
    console.log('  ├─ Notifications Email:', data.email_notifications ? 'Activé' : 'Désactivé');
    console.log('  ├─ Notifications SMS:', data.sms_notifications ? 'Activé' : 'Désactivé');
    console.log('  ├─ Créé le:', new Date(data.created_at).toLocaleString('fr-FR'));
    console.log('  └─ Mis à jour le:', new Date(data.updated_at).toLocaleString('fr-FR'));

    if (data.updated_by) {
      console.log('  └─ Mis à jour par:', data.updated_by);
    }

    console.log('\n✨ Tout est prêt ! AdminSettings fonctionne correctement.\n');
    return true;

  } catch (err) {
    console.error('❌ Erreur inattendue:', err.message);
    return false;
  }
}

// Exécuter la vérification
verifyPlatformSettings()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });

