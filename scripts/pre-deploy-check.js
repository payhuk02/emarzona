#!/usr/bin/env node

/**
 * Script de vérification pré-déploiement
 * Vérifie que tout est prêt pour la production
 * Date : 27 octobre 2025
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 VÉRIFICATION PRÉ-DÉPLOIEMENT PAYHUK\n');

const checks = [];
let hasErrors = false;

// 1. Vérifier package.json
console.log('📦 Vérification package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (!pkg.name) {
    checks.push({ status: '❌', msg: 'package.json: name manquant' });
    hasErrors = true;
  } else {
    checks.push({ status: '✅', msg: `Nom du projet: ${pkg.name}` });
  }
  
  if (!pkg.version) {
    checks.push({ status: '❌', msg: 'package.json: version manquante' });
    hasErrors = true;
  } else {
    checks.push({ status: '✅', msg: `Version: ${pkg.version}` });
  }
  
  const requiredScripts = ['build', 'preview'];
  requiredScripts.forEach(script => {
    if (!pkg.scripts || !pkg.scripts[script]) {
      checks.push({ status: '❌', msg: `Script "${script}" manquant` });
      hasErrors = true;
    } else {
      checks.push({ status: '✅', msg: `Script "${script}" présent` });
    }
  });
} catch (error) {
  checks.push({ status: '❌', msg: 'Erreur lecture package.json' });
  hasErrors = true;
}

// 2. Vérifier index.html
console.log('\n📄 Vérification index.html...');
try {
  const html = fs.readFileSync('index.html', 'utf8');
  
  if (html.includes('<title>')) {
    checks.push({ status: '✅', msg: 'Title tag présent' });
  } else {
    checks.push({ status: '⚠️', msg: 'Title tag manquant' });
  }
  
  if (html.includes('meta name="description"')) {
    checks.push({ status: '✅', msg: 'Meta description présente' });
  } else {
    checks.push({ status: '⚠️', msg: 'Meta description manquante' });
  }
} catch (error) {
  checks.push({ status: '❌', msg: 'index.html introuvable' });
  hasErrors = true;
}

// 3. Vérifier vercel.json
console.log('\n⚙️ Vérification vercel.json...');
try {
  const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercel.rewrites) {
    checks.push({ status: '✅', msg: 'Rewrites configurés (SPA)' });
  }
  
  if (vercel.headers) {
    checks.push({ status: '✅', msg: 'Headers de sécurité configurés' });
  }
} catch (error) {
  checks.push({ status: '⚠️', msg: 'vercel.json non trouvé (optionnel)' });
}

// 4. Vérifier structure des dossiers
console.log('\n📁 Vérification structure...');
const requiredDirs = ['src', 'public'];
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    checks.push({ status: '✅', msg: `Dossier "${dir}" présent` });
  } else {
    checks.push({ status: '❌', msg: `Dossier "${dir}" manquant` });
    hasErrors = true;
  }
});

// 5. Vérifier fichiers critiques
console.log('\n📝 Vérification fichiers critiques...');
const requiredFiles = [
  'src/main.tsx',
  'src/App.tsx',
  'vite.config.ts',
  'tsconfig.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    checks.push({ status: '✅', msg: `${file} présent` });
  } else {
    checks.push({ status: '❌', msg: `${file} manquant` });
    hasErrors = true;
  }
});

// 6. Vérifier node_modules
console.log('\n📚 Vérification dépendances...');
if (fs.existsSync('node_modules')) {
  checks.push({ status: '✅', msg: 'node_modules présent' });
} else {
  checks.push({ status: '⚠️', msg: 'node_modules manquant - exécuter npm install' });
}

// 7. Vérifier .gitignore
console.log('\n🔒 Vérification .gitignore...');
try {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  
  const requiredIgnores = ['node_modules', '.env', 'dist'];
  requiredIgnores.forEach(pattern => {
    if (gitignore.includes(pattern)) {
      checks.push({ status: '✅', msg: `"${pattern}" dans .gitignore` });
    } else {
      checks.push({ status: '⚠️', msg: `"${pattern}" absent de .gitignore` });
    }
  });
} catch (error) {
  checks.push({ status: '⚠️', msg: '.gitignore non trouvé' });
}

// Afficher tous les résultats
console.log('\n' + '='.repeat(50));
console.log('📊 RÉSULTATS\n');

checks.forEach(check => {
  console.log(`${check.status} ${check.msg}`);
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('\n❌ ERREURS DÉTECTÉES - Corrigez avant de déployer\n');
  process.exit(1);
} else {
  console.log('\n✅ TOUT EST PRÊT POUR LE DÉPLOIEMENT !\n');
  console.log('📝 Prochaines étapes:');
  console.log('1. npm run build (tester le build)');
  console.log('2. git add . && git commit -m "Production ready"');
  console.log('3. git push origin main');
  console.log('4. Déployer sur Vercel\n');
  process.exit(0);
}

