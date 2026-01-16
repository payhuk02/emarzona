#!/usr/bin/env node

/**
 * Correction directe de la fonction RPC track_short_link_click
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

async function fixRPCFunction() {
  console.log('🔧 CORRECTION DE LA FONCTION RPC track_short_link_click\n');

  try {
    // Recréer la fonction avec la recherche insensible à la casse
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.track_short_link_click(
          p_short_code TEXT
        )
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          v_short_link affiliate_short_links%ROWTYPE;
          v_target_url TEXT;
        BEGIN
          -- Récupérer le lien court (recherche insensible à la casse)
          SELECT * INTO v_short_link
          FROM affiliate_short_links
          WHERE upper(short_code) = upper(p_short_code)
            AND is_active = true
            AND (expires_at IS NULL OR expires_at > now());

          IF v_short_link IS NULL THEN
            RETURN jsonb_build_object(
              'success', false,
              'error', 'Lien court introuvable ou expiré'
            );
          END IF;

          -- Mettre à jour les statistiques
          UPDATE affiliate_short_links
          SET
            total_clicks = total_clicks + 1,
            last_used_at = now(),
            updated_at = now()
          WHERE id = v_short_link.id;

          -- Retourner l'URL cible
          RETURN jsonb_build_object(
            'success', true,
            'target_url', v_short_link.target_url,
            'affiliate_link_id', v_short_link.affiliate_link_id
          );
        END;
        $$;
      `
    });

    if (error) {
      console.log('❌ Erreur lors de la création de la fonction:', error.message);

      // Essayer une approche différente - exécuter directement
      console.log('🔄 Tentative avec approche directe...');

      const directSQL = `
        CREATE OR REPLACE FUNCTION public.track_short_link_click(p_short_code TEXT)
        RETURNS JSONB AS $$
        DECLARE v_short_link affiliate_short_links%ROWTYPE;
        BEGIN
          SELECT * INTO v_short_link FROM affiliate_short_links
          WHERE upper(short_code) = upper(p_short_code) AND is_active = true
          AND (expires_at IS NULL OR expires_at > now());

          IF v_short_link IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Lien court introuvable ou expiré');
          END IF;

          UPDATE affiliate_short_links SET total_clicks = total_clicks + 1, last_used_at = now(), updated_at = now() WHERE id = v_short_link.id;

          RETURN jsonb_build_object('success', true, 'target_url', v_short_link.target_url, 'affiliate_link_id', v_short_link.affiliate_link_id);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;

      // Cette approche ne marchera probablement pas car exec_sql n'est pas disponible
      // Essayons de tester directement avec une requête de mise à jour
      console.log('⚠️ Impossible de modifier la fonction RPC directement via le client');

    } else {
      console.log('✅ Fonction RPC recréée avec succès');
    }

    // Tester immédiatement après
    console.log('\n🧪 TEST DE LA FONCTION CORRIGÉE:');

    const testCodes = ['roge', 'Y7ZPB', 'INVALID'];

    for (const code of testCodes) {
      const { data: result, error: testError } = await supabase.rpc('track_short_link_click', {
        p_short_code: code
      });

      console.log(`Code "${code}":`, testError ? `❌ ${testError.message}` : result);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

fixRPCFunction();