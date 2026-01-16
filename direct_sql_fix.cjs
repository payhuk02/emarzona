#!/usr/bin/env node

/**
 * Correction directe via SQL de la fonction RPC
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

async function directSQLFix() {
  console.log('🔧 CORRECTION DIRECTE DE LA FONCTION RPC VIA SQL\n');

  try {
    // Exécuter directement la commande SQL pour recréer la fonction
    const sql = `
      CREATE OR REPLACE FUNCTION public.track_short_link_click(p_short_code TEXT)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        v_short_link affiliate_short_links%ROWTYPE;
      BEGIN
        -- Recherche insensible à la casse
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

        -- Mise à jour des statistiques
        UPDATE affiliate_short_links
        SET total_clicks = total_clicks + 1,
            last_used_at = now(),
            updated_at = now()
        WHERE id = v_short_link.id;

        RETURN jsonb_build_object(
          'success', true,
          'target_url', v_short_link.target_url,
          'affiliate_link_id', v_short_link.affiliate_link_id
        );
      END;
      $$;
    `;

    console.log('📡 Exécution de la requête SQL...');

    // Cette approche ne marchera pas avec le client standard
    // Essayons plutôt de tester avec une requête directe

    console.log('🧪 Test avec la logique corrigée...');

    // Test direct de la logique corrigée
    const testCodes = ['roge', 'Y7ZPB'];

    for (const code of testCodes) {
      console.log(`\nTest pour "${code}":`);

      // Simuler la nouvelle logique
      const { data: links, error } = await supabase
        .from('affiliate_short_links')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.log('❌ Erreur:', error.message);
        continue;
      }

      // Filtrer manuellement avec logique insensible à la casse
      const matchingLink = links.find(link =>
        link.short_code.toUpperCase() === code.toUpperCase()
      );

      if (matchingLink) {
        console.log(`✅ Trouvé: ${matchingLink.short_code} -> ${matchingLink.target_url}`);
      } else {
        console.log('❌ Non trouvé');
      }
    }

    console.log('\n💡 CONCLUSION: La logique corrigée fonctionnerait');
    console.log('   Il faut modifier la fonction RPC côté serveur');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

directSQLFix();