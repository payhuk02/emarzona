/**
 * Script de vérification des clés de traduction
 * Vérifie que toutes les clés existent dans les 5 langues
 */

import * as fs from 'fs';
import * as path from 'path';

const LOCALES_DIR = path.join(process.cwd(), 'src/i18n/locales');
const LANGUAGES = ['fr', 'en', 'es', 'de', 'pt'];

interface KeyStats {
  language: string;
  totalKeys: number;
  keys: string[];
}

function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

function countKeys(obj: any): number {
  return getAllKeys(obj).length;
}

const stats: KeyStats[] = [];

// Charger et analyser chaque fichier de traduction
for (const lang of LANGUAGES) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier manquant: ${filePath}`);
    continue;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const keys = getAllKeys(data);
    
    stats.push({
      language: lang,
      totalKeys: keys.length,
      keys,
    });
  } catch (error: any) {
    console.error(`❌ Erreur lors de la lecture de ${filePath}:`, error.message);
  }
}

// Comparer les clés entre les langues
const baseLanguage = stats.find(s => s.language === 'fr');
if (!baseLanguage) {
  console.error('❌ Langue de base (fr) introuvable');
  process.exit(1);
}

console.log('\n=== STATISTIQUES DES TRADUCTIONS ===\n');

stats.forEach(stat => {
  const flag = stat.language === 'fr' ? '🇫🇷' : 
               stat.language === 'en' ? '🇬🇧' :
               stat.language === 'es' ? '🇪🇸' :
               stat.language === 'de' ? '🇩🇪' : '🇵🇹';
  console.log(`${flag} ${stat.language.toUpperCase()}: ${stat.totalKeys} clés`);
});

console.log('\n=== VÉRIFICATION DES CLÉS MANQUANTES ===\n');

// Vérifier les clés manquantes dans chaque langue
for (const stat of stats) {
  if (stat.language === 'fr') continue; // FR est la référence
  
  const missingKeys = baseLanguage.keys.filter(key => !stat.keys.includes(key));
  const extraKeys = stat.keys.filter(key => !baseLanguage.keys.includes(key));
  
  if (missingKeys.length > 0) {
    console.log(`\n❌ ${stat.language.toUpperCase()} - ${missingKeys.length} clé(s) manquante(s):`);
    missingKeys.slice(0, 20).forEach(key => console.log(`   - ${key}`));
    if (missingKeys.length > 20) {
      console.log(`   ... et ${missingKeys.length - 20} autres`);
    }
  } else {
    console.log(`✅ ${stat.language.toUpperCase()} - Toutes les clés sont présentes`);
  }
  
  if (extraKeys.length > 0) {
    console.log(`\n⚠️  ${stat.language.toUpperCase()} - ${extraKeys.length} clé(s) supplémentaire(s):`);
    extraKeys.slice(0, 10).forEach(key => console.log(`   - ${key}`));
    if (extraKeys.length > 10) {
      console.log(`   ... et ${extraKeys.length - 10} autres`);
    }
  }
}

// Rapport de synthèse
const allComplete = stats.every(stat => stat.totalKeys === baseLanguage.totalKeys);
const allKeysMatch = stats.every(stat => 
  stat.keys.every(key => baseLanguage.keys.includes(key)) &&
  baseLanguage.keys.every(key => stat.keys.includes(key))
);

console.log('\n=== RÉSUMÉ ===\n');
console.log(`Total de clés (FR): ${baseLanguage.totalKeys}`);
console.log(`Toutes les langues ont le même nombre de clés: ${allComplete ? '✅' : '❌'}`);
console.log(`Toutes les clés correspondent: ${allKeysMatch ? '✅' : '❌'}`);

// Sauvegarder le rapport
const report = {
  baseLanguage: 'fr',
  totalKeys: baseLanguage.totalKeys,
  languages: stats.map(s => ({
    code: s.language,
    totalKeys: s.totalKeys,
    missingKeys: s.language === 'fr' ? [] : baseLanguage.keys.filter(k => !s.keys.includes(k)),
    extraKeys: s.language === 'fr' ? [] : s.keys.filter(k => !baseLanguage.keys.includes(k)),
  })),
  allComplete,
  allKeysMatch,
};

fs.writeFileSync(
  path.join(process.cwd(), 'docs/analyses/I18N_KEYS_VERIFICATION_REPORT.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n✅ Rapport sauvegardé dans: docs/analyses/I18N_KEYS_VERIFICATION_REPORT.json\n');

