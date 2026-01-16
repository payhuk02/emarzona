#!/usr/bin/env node

/**
 * Debug de la fonction RPC track_short_link_click
 * Test direct de la requête SQL
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

async function debugRPCFunction() {
  console.log('🔧 DEBUG FONCTION RPC track_short_link_click\n');

  const testCodes = ['roge', 'Y7ZPB', 'INVALID'];

  for (const code of testCodes) {
    console.log(`\n📝 Test pour code: "${code}" (majuscules: "${code.toUpperCase()}")`);
    console.log('='.repeat(50));

    // 1. Vérifier si le lien existe dans la base
    console.log('1️⃣ Vérification existence en base:');
    const { data: existingLink, error: existError } = await supabase
      .from('affiliate_short_links')
      .select('*')
      .eq('short_code', code.toUpperCase())
      .single();

    if (existError) {
      console.log(`   ❌ Lien "${code.toUpperCase()}" n'existe pas:`, existError.message);
    } else {
      console.log(`   ✅ Lien trouvé:`, {
        id: existingLink.id,
        short_code: existingLink.short_code,
        is_active: existingLink.is_active,
        expires_at: existingLink.expires_at,
        target_url: existingLink.target_url.substring(0, 50) + '...'
      });
    }

    // 2. Tester la requête exacte que fait la RPC
    console.log('\n2️⃣ Test de la requête RPC (même conditions):');
    const upperCode = code.toUpperCase();

    // Simuler la requête: SELECT * FROM affiliate_short_links WHERE short_code = 'ROGE' AND is_active = true AND (expires_at IS NULL OR expires_at > now())
    const { data: rpcQueryResult, error: rpcQueryError } = await supabase
      .from('affiliate_short_links')
      .select('*')
      .eq('short_code', upperCode)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .single();

    if (rpcQueryError) {
      console.log(`   ❌ Requête RPC échoue:`, rpcQueryError.message);
      console.log(`   Code d'erreur:`, rpcQueryError.code);
    } else {
      console.log(`   ✅ Requête RPC réussie:`, {
        id: rpcQueryResult.id,
        short_code: rpcQueryResult.short_code,
        target_url: rpcQueryResult.target_url.substring(0, 50) + '...'
      });
    }

    // 3. Tester la fonction RPC elle-même
    console.log('\n3️⃣ Test de la fonction RPC:');
    const { data: rpcResult, error: rpcError } = await supabase.rpc('track_short_link_click', {
      p_short_code: upperCode
    });

    if (rpcError) {
      console.log(`   ❌ Erreur RPC:`, rpcError.message);
    } else {
      console.log(`   ✅ Résultat RPC:`, rpcResult);
    }

    console.log('');
  }

  // 4. Vérifier tous les liens actifs
  console.log('📋 VÉRIFICATION DE TOUS LES LIENS ACTIFS:');
  const { data: allActive, error: allError } = await supabase
    .from('affiliate_short_links')
    .select('short_code, is_active, expires_at')
    .eq('is_active', true);

  if (!allError && allActive) {
    console.log('Liens actifs trouvés:');
    allActive.forEach(link => {
      console.log(`   "${link.short_code}" - Actif: ${link.is_active}, Expiration: ${link.expires_at || 'Aucune'}`);
    });
  }
}

debugRPCFunction();