#!/usr/bin/env node

/**
 * 🔍 Script de vérification des fonctionnalités Session 3
 * Vérifie que tous les fichiers et configurations sont en place
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const { green, red, yellow, blue, cyan, bold, reset } = colors;

// Émojis
const emojis = {
  check: '✅',
  cross: '❌',
  warning: '⚠️',
  rocket: '🚀',
  globe: '🌐',
  phone: '📱',
  speed: '⚡',
  chart: '📊',
};

// Fichiers à vérifier
const filesChecks = [
  // i18n
  {
    category: '🌐 Internationalisation',
    files: [
      'src/i18n/config.ts',
      'src/i18n/locales/fr.json',
      'src/i18n/locales/en.json',
      'src/components/ui/LanguageSwitcher.tsx',
      'src/hooks/useI18n.ts',
    ]
  },
  // PWA
  {
    category: '📱 PWA Avancé',
    files: [
      'public/sw.js',
      'public/offline.html',
      'src/lib/pwa.ts',
      'src/hooks/useOffline.ts',
    ]
  },
  // Optimisations
  {
    category: '⚡ Optimisations Avancées',
    files: [
      'src/lib/prefetch.ts',
      'src/lib/resource-hints.ts',
    ]
  },
  // Layout avec LanguageSwitcher
  {
    category: '🎨 Layout Updates',
    files: [
      'src/components/marketplace/MarketplaceHeader.tsx',
      'src/components/AppSidebar.tsx',
    ]
  },
];

// Vérifications de contenu
const contentChecks = [
  {
    file: 'src/main.tsx',
    content: 'import "./i18n/config"',
    description: 'i18n initialisé dans main.tsx'
  },
  {
    file: 'src/main.tsx',
    content: 'serviceWorker',
    description: 'Service Worker enregistré'
  },
  {
    file: 'package.json',
    content: '"i18next"',
    description: 'i18next installé'
  },
  {
    file: 'package.json',
    content: '"react-i18next"',
    description: 'react-i18next installé'
  },
  {
    file: 'vite.config.ts',
    content: 'compression',
    description: 'Compression activée'
  },
  {
    file: 'src/components/marketplace/MarketplaceHeader.tsx',
    content: 'LanguageSwitcher',
    description: 'LanguageSwitcher dans MarketplaceHeader'
  },
  {
    file: 'src/components/AppSidebar.tsx',
    content: 'LanguageSwitcher',
    description: 'LanguageSwitcher dans AppSidebar'
  },
];

// Vérifier l'existence d'un fichier
function checkFileExists(filePath) {
  const fullPath = join(rootDir, filePath);
  const exists = existsSync(fullPath);
  
  if (exists) {
    console.log(`  ${emojis.check} ${green}${filePath}${reset}`);
  } else {
    console.log(`  ${emojis.cross} ${red}${filePath} (manquant)${reset}`);
  }
  
  return exists;
}

// Vérifier le contenu d'un fichier
function checkFileContent(filePath, content, description) {
  const fullPath = join(rootDir, filePath);
  
  if (!existsSync(fullPath)) {
    console.log(`  ${emojis.cross} ${red}${description} - Fichier manquant${reset}`);
    return false;
  }
  
  const fileContent = readFileSync(fullPath, 'utf-8');
  const found = fileContent.includes(content);
  
  if (found) {
    console.log(`  ${emojis.check} ${green}${description}${reset}`);
  } else {
    console.log(`  ${emojis.cross} ${red}${description} - Contenu non trouvé${reset}`);
  }
  
  return found;
}

// Fonction principale
function main() {
  console.log(`\n${bold}${cyan}═══════════════════════════════════════════${reset}`);
  console.log(`${bold}${cyan}   🔍 VÉRIFICATION DES FONCTIONNALITÉS${reset}`);
  console.log(`${bold}${cyan}      SESSION 3 - FEATURES AVANCÉES${reset}`);
  console.log(`${bold}${cyan}═══════════════════════════════════════════${reset}\n`);

  let totalChecks = 0;
  let passedChecks = 0;

  // Vérification des fichiers
  for (const category of filesChecks) {
    console.log(`\n${bold}${blue}${category.category}${reset}`);
    
    for (const file of category.files) {
      const exists = checkFileExists(file);
      totalChecks++;
      if (exists) passedChecks++;
    }
  }

  // Vérification du contenu
  console.log(`\n${bold}${blue}🔍 Vérifications de contenu${reset}`);
  
  for (const check of contentChecks) {
    const found = checkFileContent(check.file, check.content, check.description);
    totalChecks++;
    if (found) passedChecks++;
  }

  // Résultat final
  console.log(`\n${bold}${cyan}═══════════════════════════════════════════${reset}`);
  
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  const status = percentage === 100 ? emojis.check : percentage >= 80 ? emojis.warning : emojis.cross;
  const color = percentage === 100 ? green : percentage >= 80 ? yellow : red;
  
  console.log(`\n  ${status} ${bold}${color}Résultat : ${passedChecks}/${totalChecks} vérifications réussies (${percentage}%)${reset}\n`);

  if (percentage === 100) {
    console.log(`  ${emojis.rocket} ${green}${bold}Toutes les fonctionnalités sont en place !${reset}`);
    console.log(`  ${emojis.globe} ${green}i18n configuré et intégré${reset}`);
    console.log(`  ${emojis.phone} ${green}PWA avec Service Worker actif${reset}`);
    console.log(`  ${emojis.speed} ${green}Optimisations avancées appliquées${reset}`);
    console.log(`\n  ${cyan}${bold}➜ Prêt pour les tests manuels !${reset}`);
  } else if (percentage >= 80) {
    console.log(`  ${emojis.warning} ${yellow}Quelques éléments manquent ou sont incomplets${reset}`);
    console.log(`  ${cyan}Consulter les détails ci-dessus${reset}`);
  } else {
    console.log(`  ${emojis.cross} ${red}De nombreux éléments sont manquants${reset}`);
    console.log(`  ${cyan}Vérifier l'implémentation${reset}`);
  }

  console.log(`\n${bold}${cyan}═══════════════════════════════════════════${reset}\n`);

  // Code de sortie
  process.exit(percentage === 100 ? 0 : 1);
}

// Exécution
main();

