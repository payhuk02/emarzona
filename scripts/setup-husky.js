/**
 * Script pour installer et configurer Husky
 * 
 * Usage: node scripts/setup-husky.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Configuration de Husky...\n');

try {
  // Créer le dossier .husky s'il n'existe pas
  const huskyDir = path.join(process.cwd(), '.husky');
  if (!fs.existsSync(huskyDir)) {
    fs.mkdirSync(huskyDir, { recursive: true });
    console.log('✅ Dossier .husky créé');
  }

  // Initialiser Husky
  console.log('📦 Installation de Husky...');
  execSync('npx husky install', { stdio: 'inherit' });

  // Vérifier que le hook pre-commit existe
  const preCommitPath = path.join(huskyDir, 'pre-commit');
  if (fs.existsSync(preCommitPath)) {
    console.log('✅ Hook pre-commit configuré');
  } else {
    console.log('⚠️  Le hook pre-commit n\'existe pas encore. Créez-le manuellement si nécessaire.');
  }

  console.log('\n✅ Husky configuré avec succès!');
  console.log('\n📝 Prochaines étapes:');
  console.log('   1. Assurez-vous que Prettier et lint-staged sont installés: npm install');
  console.log('   2. Testez le hook: git commit (devrait lancer lint-staged)');
  console.log('   3. Formatez le code: npm run format\n');
} catch (error) {
  console.error('❌ Erreur lors de la configuration de Husky:', error.message);
  process.exit(1);
}

