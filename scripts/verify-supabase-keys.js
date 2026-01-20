#!/usr/bin/env node

/**
 * Script pour vérifier les clés Supabase et afficher les instructions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function main() {
  console.log('🔍 Vérification des clés Supabase - Emarzona\n');

  const currentUrl = process.env.VITE_SUPABASE_URL;
  const currentKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  console.log('📋 État actuel:');
  console.log('URL:', currentUrl || '❌ NON DÉFINIE');
  console.log('Key:', currentKey ? '✅ DÉFINIE' : '❌ NON DÉFINIE');

  if (currentUrl && currentKey) {
    console.log('\n🧪 Test de connexion...');

    try {
      const supabase = createClient(currentUrl, currentKey);
      const { data, error } = await supabase.from('profiles').select('count').limit(1).single();

      if (error && error.code !== 'PGRST116') {
        console.log('❌ ÉCHEC:', error.message);
        console.log('\n📝 Les clés actuelles sont invalides ou expirées.');
      } else {
        console.log('✅ SUCCÈS: Connexion Supabase fonctionnelle!');
        console.log('🎉 Vos clés sont correctes. Le problème vient d\'autre chose.');
        return;
      }
    } catch (error) {
      console.log('❌ ÉCHEC:', error.message);
    }
  }

  console.log('\n🚨 PROBLÈME IDENTIFIÉ: Clés Supabase invalides');
  console.log('\n📋 INSTRUCTIONS DE CORRECTION:');
  console.log('========================================');
  console.log('1️⃣ Allez sur: https://app.supabase.com');
  console.log('2️⃣ Connectez-vous à votre compte');
  console.log('3️⃣ Ouvrez votre projet Emarzona');
  console.log('4️⃣ Allez dans: Settings > API');
  console.log('5️⃣ Copiez:');
  console.log('   • Project URL');
  console.log('   • anon/public key');
  console.log('');
  console.log('6️⃣ Modifiez le fichier .env avec les vraies valeurs:');
  console.log('');
  console.log('VITE_SUPABASE_URL=https://votre-vrai-project-id.supabase.co');
  console.log('VITE_SUPABASE_PUBLISHABLE_KEY=votre-vraie-anon-key');
  console.log('');
  console.log('7️⃣ Redémarrez l\'application: npm run dev');
  console.log('========================================');

  console.log('\n🔧 CORRECTION RAPIDE:');
  console.log('Si vous avez les clés, collez-les ci-dessous (ou modifiez .env directement)');

  // Vérifier si le projet existe sur Supabase
  console.log('\n🔍 Vérification du projet Supabase...');
  const projectId = currentUrl?.match(/https:\/\/([a-zA-Z0-9]+)\.supabase\.co/)?.[1];
  if (projectId) {
    console.log(`ID du projet détecté: ${projectId}`);
    console.log('⚠️  Si cet ID est incorrect, corrigez-le dans .env');
  } else {
    console.log('❌ URL du projet mal formatée');
  }
}

main().catch(console.error);