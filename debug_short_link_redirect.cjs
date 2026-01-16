#!/usr/bin/env node

/**
 * Debug du composant ShortLinkRedirect
 * Simule exactement le comportement du composant
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

async function debugRedirect(code) {
  console.log(`🔍 DEBUG REDIRECTION POUR CODE: "${code}"\n`);

  if (!code) {
    console.log('❌ Code manquant');
    return;
  }

  console.log(`📝 Code original: "${code}"`);
  console.log(`🔄 Code en majuscules: "${code.toUpperCase()}"`);

  try {
    // Étape 1: Essayer la fonction RPC
    console.log('\n1️⃣ Test de la fonction RPC track_short_link_click...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('track_short_link_click', {
      p_short_code: code.toUpperCase(),
    });

    if (rpcError) {
      console.log(`❌ Erreur RPC:`, rpcError.message);
      console.log('   Passage à la requête directe...');

      // Étape 2: Requête directe
      console.log('\n2️⃣ Requête directe sur la table affiliate_short_links...');
      const { data: shortLinkData, error: queryError } = await supabase
        .from('affiliate_short_links')
        .select('target_url, is_active, expires_at, short_code')
        .eq('short_code', code.toUpperCase())
        .single();

      console.log('   Requête SQL exécutée:');
      console.log(`   SELECT target_url, is_active, expires_at, short_code FROM affiliate_short_links WHERE short_code = '${code.toUpperCase()}'`);

      if (queryError) {
        console.log(`❌ Erreur requête:`, queryError.message);
        console.log(`❌ Code d'erreur:`, queryError.code);

        if (queryError.code === 'PGRST116') {
          console.log('ℹ️ PGRST116 = Aucune ligne trouvée (lien n\'existe pas)');
        }

        console.log('\n🔍 Recherche de liens similaires...');
        const { data: similarLinks, error: similarError } = await supabase
          .from('affiliate_short_links')
          .select('short_code')
          .ilike('short_code', `%${code.toUpperCase().substring(0, 2)}%`)
          .limit(5);

        if (!similarError && similarLinks) {
          console.log('Liens similaires trouvés:', similarLinks.map(l => l.short_code));
        }

        return;
      }

      if (!shortLinkData) {
        console.log('❌ Aucun lien trouvé (shortLinkData est null/undefined)');
        return;
      }

      console.log('✅ Lien trouvé:', {
        short_code: shortLinkData.short_code,
        target_url: shortLinkData.target_url,
        is_active: shortLinkData.is_active,
        expires_at: shortLinkData.expires_at
      });

      // Étape 3: Vérifications
      if (!shortLinkData.is_active) {
        console.log('❌ Lien désactivé');
        return;
      }

      if (shortLinkData.expires_at && new Date(shortLinkData.expires_at) < new Date()) {
        console.log('❌ Lien expiré');
        console.log('   Date d\'expiration:', shortLinkData.expires_at);
        console.log('   Date actuelle:', new Date().toISOString());
        return;
      }

      console.log('✅ Toutes les vérifications passées');
      console.log('🎯 Redirection vers:', shortLinkData.target_url);

    } else {
      // RPC a fonctionné
      console.log('✅ RPC réussi:', rpcData);
      if (rpcData?.success && rpcData?.target_url) {
        console.log('🎯 Redirection vers:', rpcData.target_url);
      } else {
        console.log('❌ RPC a échoué:', rpcData?.error);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Test avec différents codes
async function runTests() {
  const testCodes = [
    'roge',      // Existe
    'INVALID',   // N'existe pas
    'test123',   // N'existe pas
    'Y7ZPB',     // Existe
    '',          // Vide
  ];

  for (const code of testCodes) {
    await debugRedirect(code);
    console.log('\n' + '='.repeat(50) + '\n');
  }

  // Afficher tous les liens disponibles
  console.log('📋 LIENS COURTS DISPONIBLES:');
  const { data: allLinks, error: allError } = await supabase
    .from('affiliate_short_links')
    .select('short_code, target_url, is_active')
    .eq('is_active', true)
    .order('short_code');

  if (!allError && allLinks) {
    allLinks.forEach(link => {
      console.log(`   ${link.short_code} → ${link.target_url.substring(0, 50)}...`);
    });
  }
}

runTests();