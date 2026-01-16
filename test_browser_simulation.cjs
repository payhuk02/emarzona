#!/usr/bin/env node

/**
 * Simulation exacte du comportement du composant ShortLinkRedirect
 * Comme il se comporte dans le navigateur
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

async function simulateBrowserRedirect(code) {
  console.log(`🌐 SIMULATION NAVIGATEUR - Redirection pour code: "${code}"\n`);

  // Simulation de useParams
  const params = { code };

  if (!params.code) {
    console.log('❌ ERREUR: Code de lien court manquant');
    return 'Code de lien court manquant';
  }

  try {
    console.log('🚀 Démarrage de la redirection...');

    // Simulation de useEffect - redirectToTarget
    const redirectToTarget = async () => {
      console.log('📡 Appel RPC: track_short_link_click');
      const { data, error: rpcError } = await supabase.rpc('track_short_link_click', {
        p_short_code: params.code.toUpperCase(),
      });

      if (rpcError) {
        console.log('❌ RPC Error:', rpcError);
        console.log('🔄 Fallback: requête directe');

        const { data: shortLinkData, error: queryError } = await supabase
          .from('affiliate_short_links')
          .select('target_url, is_active, expires_at')
          .eq('short_code', params.code.toUpperCase())
          .single();

        if (queryError || !shortLinkData) {
          console.log('❌ Requête directe échouée:', queryError?.message);
          return 'Lien court introuvable ou expiré';
        }

        if (!shortLinkData.is_active) {
          console.log('❌ Lien désactivé');
          return 'Ce lien court a été désactivé';
        }

        if (shortLinkData.expires_at && new Date(shortLinkData.expires_at) < new Date()) {
          console.log('❌ Lien expiré');
          return 'Ce lien court a expiré';
        }

        console.log('✅ Redirection manuelle vers:', shortLinkData.target_url);
        return `REDIRECT:${shortLinkData.target_url}`;
      }

      // RPC a réussi
      if (data && data.success && data.target_url) {
        console.log('✅ Redirection RPC vers:', data.target_url);
        return `REDIRECT:${data.target_url}`;
      } else {
        console.log('❌ RPC retournée erreur:', data?.error);
        return data?.error || 'Lien court introuvable ou expiré';
      }
    };

    const result = await redirectToTarget();
    console.log('📋 Résultat final:', result);
    return result;

  } catch (err) {
    console.log('❌ Exception générale:', err.message);
    return 'Une erreur est survenue lors de la redirection';
  }
}

async function runBrowserTests() {
  const testCodes = [
    'roge',        // Devrait marcher
    'Y7ZPB',      // Devrait marcher
    'INVALID123', // Ne devrait pas marcher
    'nonexistent', // Ne devrait pas marcher
  ];

  console.log('🧪 TESTS DE SIMULATION NAVIGATEUR\n');

  for (const code of testCodes) {
    console.log('='.repeat(60));
    const result = await simulateBrowserRedirect(code);
    console.log('='.repeat(60));
    console.log('');

    // Petite pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('✅ TESTS TERMINÉS');
}

runBrowserTests();