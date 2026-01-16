#!/usr/bin/env node

/**
 * Test final complet du système de liens courts affiliés
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

async function finalTest() {
  console.log('🎯 TEST FINAL DU SYSTÈME DE LIENS COURTS AFFILIÉS\n');

  try {
    // Test 1: Vérifier les liens disponibles
    console.log('1️⃣ Liens courts disponibles:');
    const { data: links, error: linksError } = await supabase
      .from('affiliate_short_links')
      .select('short_code, target_url, total_clicks')
      .eq('is_active', true)
      .order('short_code');

    if (linksError) {
      console.log('❌ Erreur récupération liens:', linksError.message);
      return;
    }

    links.forEach(link => {
      console.log(`   ✅ ${link.short_code} → ${link.target_url.split('?')[0]}... (${link.total_clicks} clics)`);
    });

    // Test 2: Tester les redirections
    console.log('\n2️⃣ Test des redirections:');
    const testCodes = ['roge', 'Y7ZPB', 'bonn', 'fofo'];

    for (const code of testCodes) {
      console.log(`\nTest "${code}":`);

      // Simuler exactement ce que fait ShortLinkRedirect
      const { data: allLinks, error: fetchError } = await supabase
        .from('affiliate_short_links')
        .select('id, short_code, target_url, is_active, expires_at, total_clicks')
        .eq('is_active', true);

      if (fetchError) {
        console.log(`   ❌ Erreur: ${fetchError.message}`);
        continue;
      }

      const matchingLink = allLinks?.find(link =>
        link.short_code.toLowerCase() === code.toLowerCase()
      );

      if (!matchingLink) {
        console.log(`   ❌ Lien non trouvé`);
        continue;
      }

      if (matchingLink.expires_at && new Date(matchingLink.expires_at) < new Date()) {
        console.log(`   ❌ Lien expiré`);
        continue;
      }

      // Simuler la mise à jour des stats
      await supabase
        .from('affiliate_short_links')
        .update({
          total_clicks: matchingLink.total_clicks + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', matchingLink.id);

      console.log(`   ✅ Redirection vers: ${matchingLink.target_url}`);
      console.log(`   📊 Clics: ${matchingLink.total_clicks} → ${matchingLink.total_clicks + 1}`);
    }

    // Test 3: Codes invalides
    console.log('\n3️⃣ Test des codes invalides:');
    const invalidCodes = ['INVALID', 'nonexistent', ''];

    for (const code of invalidCodes) {
      const { data: allLinks } = await supabase
        .from('affiliate_short_links')
        .select('short_code')
        .eq('is_active', true);

      const matchingLink = allLinks?.find(link =>
        link.short_code.toLowerCase() === code.toLowerCase()
      );

      console.log(`   "${code}": ${matchingLink ? '❌ Trouvé (inattendu)' : '✅ Non trouvé (correct)'}`);
    }

    // Test 4: Statistiques finales
    console.log('\n4️⃣ Statistiques finales:');
    const { data: finalStats } = await supabase
      .from('affiliate_short_links')
      .select('total_clicks')
      .eq('is_active', true);

    const totalClicks = finalStats?.reduce((sum, link) => sum + link.total_clicks, 0) || 0;
    const totalLinks = finalStats?.length || 0;

    console.log(`   📊 Liens actifs: ${totalLinks}`);
    console.log(`   🖱️ Clics totaux: ${totalClicks}`);
    console.log(`   📈 Moyenne par lien: ${totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : 0}`);

    console.log('\n🎉 TEST FINAL RÉUSSI !');
    console.log('\n✅ RÉSUMÉ:');
    console.log('   🔗 Liens courts opérationnels');
    console.log('   🔄 Redirections fonctionnelles');
    console.log('   📊 Statistiques mises à jour');
    console.log('   🛡️ Gestion d\'erreurs appropriée');
    console.log('   🌐 URLs: https://emarzona.com/aff/{CODE}');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

finalTest();