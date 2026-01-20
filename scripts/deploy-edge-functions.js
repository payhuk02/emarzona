#!/usr/bin/env node

/**
 * Script pour déployer les fonctions Edge Supabase
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const functionsDir = path.join(process.cwd(), 'supabase', 'functions');

console.log('🚀 Déploiement des fonctions Edge Supabase\n');

// Vérifier si Supabase CLI est installé
try {
  execSync('supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI détecté');
} catch (error) {
  console.log('❌ Supabase CLI non installé');
  console.log('📦 Installation: npm install -g supabase');
  console.log('🔗 https://supabase.com/docs/guides/cli');
  process.exit(1);
}

// Vérifier si on est connecté à Supabase
try {
  execSync('supabase projects list', { stdio: 'pipe' });
  console.log('✅ Connecté à Supabase');
} catch (error) {
  console.log('❌ Non connecté à Supabase');
  console.log('🔐 Connexion: supabase login');
  process.exit(1);
}

// Lister les fonctions disponibles
if (!fs.existsSync(functionsDir)) {
  console.log('❌ Dossier des fonctions non trouvé:', functionsDir);
  process.exit(1);
}

const functions = fs.readdirSync(functionsDir)
  .filter(dir => fs.statSync(path.join(functionsDir, dir)).isDirectory())
  .filter(dir => fs.existsSync(path.join(functionsDir, dir, 'index.ts')));

console.log(`📁 ${functions.length} fonctions trouvées:`, functions.join(', '));

// Fonctions critiques à déployer en priorité
const criticalFunctions = ['rate-limiter', 'moneroo', 'send-email'];

console.log('\n🎯 Déploiement des fonctions critiques...\n');

for (const func of criticalFunctions) {
  if (functions.includes(func)) {
    try {
      console.log(`🚀 Déploiement de ${func}...`);
      execSync(`supabase functions deploy ${func}`, { stdio: 'inherit' });
      console.log(`✅ ${func} déployée avec succès\n`);
    } catch (error) {
      console.log(`❌ Échec du déploiement de ${func}:`, error.message);
    }
  } else {
    console.log(`⚠️ Fonction ${func} non trouvée dans le dossier functions`);
  }
}

console.log('🎉 Déploiement terminé!');
console.log('\n📋 Vérification:');
console.log('supabase functions list');
console.log('\n🧪 Test:');
console.log('curl -X POST https://your-project.supabase.co/functions/v1/rate-limiter \\');
console.log('  -H "Authorization: Bearer YOUR_ANON_KEY" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d "{}"');