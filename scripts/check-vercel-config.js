// Test de la configuration Vercel
// Ce script vérifie que tous les fichiers nécessaires sont présents

import fs from 'fs';
import path from 'path';

const requiredFiles = [
  'vercel.json',
  '.vercelignore',
  'package.json',
  'public/manifest.json',
  'public/sw.js',
  'index.html'
];

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_PROJECT_ID'
];

function checkFiles() {
  console.log('🔍 Vérification des fichiers Vercel...\n');
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MANQUANT`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

function checkVercelConfig() {
  console.log('\n🔧 Vérification de la configuration Vercel...\n');
  
  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    
    console.log('✅ vercel.json valide');
    console.log(`📦 Version: ${vercelConfig.version}`);
    console.log(`🏗️ Builds: ${vercelConfig.builds?.length || 0}`);
    console.log(`🛣️ Routes: ${vercelConfig.routes?.length || 0}`);
    console.log(`🔒 Headers: ${vercelConfig.headers?.length || 0}`);
    console.log(`🌍 Variables d\'env: ${Object.keys(vercelConfig.env || {}).length}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Erreur dans vercel.json: ${error.message}`);
    return false;
  }
}

function checkPWAConfig() {
  console.log('\n📱 Vérification de la configuration PWA...\n');
  
  try {
    const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
    
    console.log(`✅ Manifest: ${manifest.name}`);
    console.log(`🎨 Theme: ${manifest.theme_color}`);
    console.log(`🖼️ Icônes: ${manifest.icons?.length || 0}`);
    console.log(`📱 Display: ${manifest.display}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Erreur dans manifest.json: ${error.message}`);
    return false;
  }
}

function checkServiceWorker() {
  console.log('\n⚙️ Vérification du Service Worker...\n');
  
  try {
    const swContent = fs.readFileSync('public/sw.js', 'utf8');
    
    const hasInstall = swContent.includes('install');
    const hasActivate = swContent.includes('activate');
    const hasFetch = swContent.includes('fetch');
    const hasCache = swContent.includes('CACHE_NAME');
    
    console.log(`${hasInstall ? '✅' : '❌'} Event install`);
    console.log(`${hasActivate ? '✅' : '❌'} Event activate`);
    console.log(`${hasFetch ? '✅' : '❌'} Event fetch`);
    console.log(`${hasCache ? '✅' : '❌'} Cache configuré`);
    
    return hasInstall && hasActivate && hasFetch && hasCache;
  } catch (error) {
    console.log(`❌ Erreur dans sw.js: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🚀 Vérification de la configuration Vercel pour Payhuk\n');
  
  const filesOk = checkFiles();
  const configOk = checkVercelConfig();
  const pwaOk = checkPWAConfig();
  const swOk = checkServiceWorker();
  
  console.log('\n📊 Résumé:');
  console.log(`📁 Fichiers: ${filesOk ? '✅' : '❌'}`);
  console.log(`⚙️ Configuration: ${configOk ? '✅' : '❌'}`);
  console.log(`📱 PWA: ${pwaOk ? '✅' : '❌'}`);
  console.log(`🔄 Service Worker: ${swOk ? '✅' : '❌'}`);
  
  if (filesOk && configOk && pwaOk && swOk) {
    console.log('\n🎉 Configuration Vercel complète !');
    console.log('✅ Prêt pour le déploiement');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Configurez les variables d\'environnement dans Vercel');
    console.log('2. Connectez votre dépôt GitHub à Vercel');
    console.log('3. Déployez !');
  } else {
    console.log('\n❌ Configuration incomplète');
    console.log('💡 Vérifiez les éléments manquants ci-dessus');
  }
}

main();
