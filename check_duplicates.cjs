#!/usr/bin/env node

/**
 * Vérification des doublons dans la table affiliate_short_links
 * Date: Janvier 2026
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
  console.log('🔍 VÉRIFICATION DES DOUBLONS DANS affiliate_short_links\n');

  try {
    // Compter les occurrences de chaque short_code
    const { data: codeCounts, error: countError } = await supabase
      .from('affiliate_short_links')
      .select('short_code')
      .order('short_code');

    if (countError) {
      console.error('❌ Erreur récupération:', countError.message);
      return;
    }

    // Compter manuellement les doublons
    const counts = {};
    codeCounts.forEach(item => {
      counts[item.short_code] = (counts[item.short_code] || 0) + 1;
    });

    console.log('📊 STATISTIQUES DES CODES:');
    Object.entries(counts).forEach(([code, count]) => {
      if (count > 1) {
        console.log(`   🚨 DOUBLON: "${code}" apparaît ${count} fois`);
      } else {
        console.log(`   ✅ Unique: "${code}"`);
      }
    });

    // Vérifier spécifiquement "ROGE"
    console.log('\n🔍 DÉTAIL POUR "ROGE":');
    const { data: rogeLinks, error: rogeError } = await supabase
      .from('affiliate_short_links')
      .select('*')
      .eq('short_code', 'ROGE');

    if (rogeError) {
      console.log('❌ Erreur requête ROGE:', rogeError.message);
    } else {
      console.log(`Nombre de liens avec code "ROGE": ${rogeLinks.length}`);
      rogeLinks.forEach((link, index) => {
        console.log(`${index + 1}. ID: ${link.id}`);
        console.log(`   Actif: ${link.is_active}`);
        console.log(`   Clics: ${link.total_clicks}`);
        console.log(`   Créé: ${link.created_at}`);
        console.log(`   URL: ${link.target_url}`);
        console.log('');
      });
    }

    // Vérifier si la fonction RPC elle-même a un problème
    console.log('\n🧪 TEST DIRECT DE LA FONCTION RPC:');

    // Test avec requête SQL directe (simulant ce que fait la fonction)
    const { data: directQuery, error: directError } = await supabase
      .from('affiliate_short_links')
      .select('*')
      .eq('short_code', 'ROGE')
      .eq('is_active', true);

    console.log('Requête directe (sans .single()):');
    if (directError) {
      console.log('❌ Erreur:', directError.message);
    } else {
      console.log(`✅ ${directQuery.length} résultat(s) trouvé(s)`);
      directQuery.forEach(link => {
        console.log(`   - ID: ${link.id}, Actif: ${link.is_active}`);
      });
    }

    // Simuler exactement ce que fait la fonction RPC
    console.log('\n🎯 SIMULATION EXACTE DE LA FONCTION RPC:');
    const queryResult = await supabase
      .from('affiliate_short_links')
      .select('*')
      .eq('short_code', 'ROGE')
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    console.log('Résultat de la requête complexe:');
    if (queryResult.error) {
      console.log('❌ Erreur:', queryResult.error.message);
    } else {
      console.log(`✅ ${queryResult.data.length} résultat(s) trouvé(s)`);
      if (queryResult.data.length > 0) {
        console.log('Premier résultat:', {
          id: queryResult.data[0].id,
          short_code: queryResult.data[0].short_code,
          is_active: queryResult.data[0].is_active,
          expires_at: queryResult.data[0].expires_at
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

checkDuplicates();