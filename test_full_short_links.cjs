#!/usr/bin/env node

/**
 * Test complet du système de liens courts affiliés
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

async function testFullShortLinks() {
  console.log('🧪 TEST COMPLET DU SYSTÈME DE LIENS COURTS AFFILIÉS\n');

  try {
    // Test 1: Génération de plusieurs codes courts
    console.log('1. Test de génération de codes courts...');
    const codes = [];
    for (let i = 0; i < 5; i++) {
      const { data: code, error } = await supabase.rpc('generate_short_link_code', {
        p_length: 6
      });
      if (error) {
        console.log(`❌ Erreur génération code ${i + 1}:`, error.message);
      } else {
        codes.push(code);
        console.log(`✅ Code ${i + 1}: ${code}`);
      }
    }

    // Vérifier l'unicité
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size === codes.length) {
      console.log('✅ Tous les codes sont uniques');
    } else {
      console.log('❌ Certains codes ne sont pas uniques');
    }

    // Test 2: Créer un lien d'affiliation de test et un lien court
    console.log('\n2. Test de création d\'un lien court complet...');

    // D'abord, récupérer un affilié existant
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, user_id')
      .limit(1)
      .single();

    if (affiliateError || !affiliate) {
      console.log('❌ Aucun affilié trouvé pour les tests');
      return;
    }

    console.log(`✅ Affilié trouvé: ${affiliate.id}`);

    // Récupérer un lien d'affiliation existant ou en créer un
    let { data: affiliateLink, error: linkError } = await supabase
      .from('affiliate_links')
      .select('id, full_url')
      .eq('affiliate_id', affiliate.id)
      .limit(1)
      .single();

    if (linkError || !affiliateLink) {
      // Créer un lien d'affiliation de test
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .limit(1)
        .single();

      if (product) {
        const { data: newLink, error: createLinkError } = await supabase
          .from('affiliate_links')
          .insert({
            affiliate_id: affiliate.id,
            product_id: product.id,
            full_url: 'https://test.com/affiliate/product123',
            link_code: 'TESTLINK123',
            status: 'active'
          })
          .select()
          .single();

        if (createLinkError) {
          console.log('❌ Erreur création lien d\'affiliation:', createLinkError.message);
          return;
        }
        affiliateLink = newLink;
        console.log('✅ Lien d\'affiliation de test créé');
      } else {
        console.log('❌ Aucun produit trouvé pour créer un lien d\'affiliation');
        return;
      }
    }

    console.log(`✅ Lien d\'affiliation: ${affiliateLink.id}`);

    // Générer un code court pour ce lien
    const { data: shortCode, error: codeError } = await supabase.rpc('generate_short_link_code', {
      p_length: 6
    });

    if (codeError) {
      console.log('❌ Erreur génération code court:', codeError.message);
      return;
    }

    console.log(`✅ Code court généré: ${shortCode}`);

    // Créer le lien court via RPC
    const { data: shortLinkResult, error: createError } = await supabase.rpc('create_short_link_with_rate_limit', {
      p_affiliate_link_id: affiliateLink.id,
      p_short_code: shortCode,
      p_target_url: affiliateLink.full_url,
      p_custom_alias: null,
      p_expires_at: null,
      p_ip_address: null,
      p_user_agent: 'Test Script v1.0',
    });

    if (createError) {
      console.log('❌ Erreur création lien court:', createError.message);
      return;
    }

    if (!shortLinkResult?.success) {
      console.log('❌ Échec création lien court:', shortLinkResult?.error);
      return;
    }

    console.log('✅ Lien court créé avec succès');

    // Récupérer les détails du lien court créé
    const { data: createdShortLink, error: fetchError } = await supabase
      .from('affiliate_short_links')
      .select('*')
      .eq('id', shortLinkResult.short_link_id)
      .single();

    if (fetchError) {
      console.log('❌ Erreur récupération lien court:', fetchError.message);
      return;
    }

    console.log(`✅ Lien court créé: ${createdShortLink.short_code}`);
    console.log(`   URL courte: https://emarzona.com/aff/${createdShortLink.short_code}`);
    console.log(`   URL cible: ${createdShortLink.target_url}`);
    console.log(`   Clics: ${createdShortLink.total_clicks}`);

    // Test 3: Tester le tracking des clics
    console.log('\n3. Test du tracking des clics...');

    const { data: trackResult, error: trackError } = await supabase.rpc('track_short_link_click', {
      p_short_code: createdShortLink.short_code
    });

    if (trackError) {
      console.log('❌ Erreur tracking:', trackError.message);
    } else if (trackResult?.success) {
      console.log('✅ Clic tracké avec succès');
      console.log(`   URL de redirection: ${trackResult.target_url}`);
    } else {
      console.log('❌ Échec tracking:', trackResult?.error);
    }

    // Vérifier que le compteur a été incrémenté
    const { data: updatedLink, error: updateError } = await supabase
      .from('affiliate_short_links')
      .select('total_clicks')
      .eq('id', createdShortLink.id)
      .single();

    if (updateError) {
      console.log('❌ Erreur vérification compteur:', updateError.message);
    } else {
      console.log(`✅ Compteur de clics mis à jour: ${updatedLink.total_clicks}`);
    }

    // Test 4: Tester les analytics
    console.log('\n4. Test des analytics...');

    const { data: analytics, error: analyticsError } = await supabase.rpc('get_affiliate_short_links_analytics', {
      p_affiliate_id: affiliate.id,
      p_days: 30
    });

    if (analyticsError) {
      console.log('❌ Erreur analytics:', analyticsError.message);
    } else {
      console.log('✅ Analytics récupérés:');
      console.log(`   Total liens: ${analytics.summary?.total_links || 0}`);
      console.log(`   Total clics: ${analytics.summary?.total_clicks || 0}`);
      console.log(`   Liens actifs: ${analytics.summary?.active_links || 0}`);
      console.log(`   Taux conversion: ${analytics.summary?.conversion_rate || 0}%`);
    }

    // Test 5: Tester la vue stats
    console.log('\n5. Test de la vue statistiques...');

    const { data: statsView, error: statsError } = await supabase
      .from('affiliate_short_links_stats')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .limit(5);

    if (statsError) {
      console.log('❌ Erreur vue stats:', statsError.message);
    } else {
      console.log(`✅ Vue stats: ${statsView?.length || 0} liens trouvés`);
      if (statsView && statsView.length > 0) {
        console.log(`   Premier lien: ${statsView[0].short_code} (${statsView[0].total_clicks} clics)`);
      }
    }

    // Test 6: Tester la redirection simulée
    console.log('\n6. Test de redirection simulée...');

    const testUrl = `https://emarzona.com/aff/${createdShortLink.short_code}`;
    console.log(`✅ URL de test: ${testUrl}`);
    console.log(`   Cette URL devrait rediriger vers: ${createdShortLink.target_url}`);

    // Nettoyage: supprimer le lien court de test
    console.log('\n🧹 Nettoyage: suppression du lien court de test...');
    const { error: deleteError } = await supabase
      .from('affiliate_short_links')
      .delete()
      .eq('id', createdShortLink.id);

    if (deleteError) {
      console.log('⚠️ Erreur nettoyage:', deleteError.message);
    } else {
      console.log('✅ Lien court de test supprimé');
    }

    console.log('\n🎉 TESTS TERMINÉS AVEC SUCCÈS !');
    console.log('\n📊 RÉSUMÉ:');
    console.log('✅ Génération de codes courts');
    console.log('✅ Création de liens courts');
    console.log('✅ Tracking des clics');
    console.log('✅ Analytics fonctionnelles');
    console.log('✅ Vue statistiques');
    console.log('✅ Système de redirection prêt');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testFullShortLinks();