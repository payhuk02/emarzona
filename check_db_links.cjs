#!/usr/bin/env node

/**
 * Vérification directe des liens courts dans la base de données
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

async function checkDatabaseLinks() {
  console.log('🗄️ VÉRIFICATION DIRECTE DES LIENS COURTS EN BASE\n');

  try {
    // Récupérer tous les liens courts
    const { data: allLinks, error: allError } = await supabase
      .from('affiliate_short_links')
      .select('*')
      .order('short_code');

    if (allError) {
      console.error('❌ Erreur récupération liens:', allError.message);
      return;
    }

    console.log(`📊 Total des liens courts: ${allLinks?.length || 0}\n`);

    if (allLinks && allLinks.length > 0) {
      console.log('📋 DÉTAIL DE CHAQUE LIEN:');
      console.log('='.repeat(80));

      allLinks.forEach((link, index) => {
        console.log(`${index + 1}. Code: "${link.short_code}"`);
        console.log(`   ID: ${link.id}`);
        console.log(`   Actif: ${link.is_active}`);
        console.log(`   Clics: ${link.total_clicks}`);
        console.log(`   Expiration: ${link.expires_at || 'Aucune'}`);
        console.log(`   URL cible: ${link.target_url}`);
        console.log(`   Créé le: ${link.created_at}`);
        console.log(`   Affiliate Link ID: ${link.affiliate_link_id}`);
        console.log(`   Affiliate ID: ${link.affiliate_id}`);
        console.log('');
      });

      // Tester chaque lien avec la RPC
      console.log('🧪 TEST RPC POUR CHAQUE LIEN:');
      console.log('='.repeat(80));

      for (const link of allLinks) {
        console.log(`Test du code "${link.short_code}":`);

        const { data: rpcResult, error: rpcError } = await supabase.rpc('track_short_link_click', {
          p_short_code: link.short_code
        });

        if (rpcError) {
          console.log(`   ❌ Erreur RPC: ${rpcError.message}`);
        } else if (rpcResult?.success) {
          console.log(`   ✅ Succès: ${rpcResult.target_url}`);
        } else {
          console.log(`   ❌ Échec: ${rpcResult?.error}`);
        }

        console.log('');
      }
    } else {
      console.log('⚠️ Aucun lien court trouvé dans la base de données');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

checkDatabaseLinks();