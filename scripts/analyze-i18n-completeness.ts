/**
 * Script d'analyse complète de l'état i18n
 * Vérifie la complétude des traductions dans les 5 langues
 */

import * as fs from 'fs';
import * as path from 'path';

interface TranslationStats {
  language: string;
  totalKeys: number;
  missingKeys: string[];
  extraKeys: string[];
}

function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  
  return keys;
}

function analyzeTranslations(): void {
  const localesDir = path.join(process.cwd(), 'src/i18n/locales');
  
  // Charger tous les fichiers de traduction
  const fr = JSON.parse(fs.readFileSync(path.join(localesDir, 'fr.json'), 'utf-8'));
  const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8'));
  const es = JSON.parse(fs.readFileSync(path.join(localesDir, 'es.json'), 'utf-8'));
  const de = JSON.parse(fs.readFileSync(path.join(localesDir, 'de.json'), 'utf-8'));
  const pt = JSON.parse(fs.readFileSync(path.join(localesDir, 'pt.json'), 'utf-8'));
  
  // Obtenir toutes les clés de chaque langue
  const frKeys = new Set(getAllKeys(fr));
  const enKeys = new Set(getAllKeys(en));
  const esKeys = new Set(getAllKeys(es));
  const deKeys = new Set(getAllKeys(de));
  const ptKeys = new Set(getAllKeys(pt));
  
  // FR est la référence
  const referenceKeys = frKeys;
  
  // Analyser chaque langue
  const stats: TranslationStats[] = [
    {
      language: 'FR',
      totalKeys: frKeys.size,
      missingKeys: [],
      extraKeys: []
    },
    {
      language: 'EN',
      totalKeys: enKeys.size,
      missingKeys: Array.from(referenceKeys).filter(k => !enKeys.has(k)),
      extraKeys: Array.from(enKeys).filter(k => !referenceKeys.has(k))
    },
    {
      language: 'ES',
      totalKeys: esKeys.size,
      missingKeys: Array.from(referenceKeys).filter(k => !esKeys.has(k)),
      extraKeys: Array.from(esKeys).filter(k => !referenceKeys.has(k))
    },
    {
      language: 'DE',
      totalKeys: deKeys.size,
      missingKeys: Array.from(referenceKeys).filter(k => !deKeys.has(k)),
      extraKeys: Array.from(deKeys).filter(k => !referenceKeys.has(k))
    },
    {
      language: 'PT',
      totalKeys: ptKeys.size,
      missingKeys: Array.from(referenceKeys).filter(k => !ptKeys.has(k)),
      extraKeys: Array.from(ptKeys).filter(k => !referenceKeys.has(k))
    }
  ];
  
  // Afficher les résultats
  console.log('\n=== ANALYSE COMPLÈTE DES TRADUCTIONS ===\n');
  console.log(`Langue de référence: FR (${frKeys.size} clés)\n`);
  
  stats.forEach(stat => {
    const completeness = stat.language === 'FR' 
      ? 100 
      : ((stat.totalKeys - stat.missingKeys.length) / referenceKeys.size * 100).toFixed(1);
    
    console.log(`\n${stat.language}:`);
    console.log(`  Total de clés: ${stat.totalKeys}`);
    console.log(`  Clés manquantes: ${stat.missingKeys.length}`);
    console.log(`  Clés supplémentaires: ${stat.extraKeys.length}`);
    console.log(`  Complétude: ${completeness}%`);
    
    if (stat.missingKeys.length > 0 && stat.missingKeys.length <= 20) {
      console.log(`  Clés manquantes: ${stat.missingKeys.join(', ')}`);
    } else if (stat.missingKeys.length > 20) {
      console.log(`  Premières clés manquantes: ${stat.missingKeys.slice(0, 20).join(', ')}...`);
    }
  });
  
  // Sauvegarder le rapport
  const report = {
    reference: 'FR',
    referenceKeys: frKeys.size,
    languages: stats.map(s => ({
      language: s.language,
      totalKeys: s.totalKeys,
      missingKeys: s.missingKeys.length,
      extraKeys: s.extraKeys.length,
      completeness: s.language === 'FR' ? 100 : ((s.totalKeys - s.missingKeys.length) / referenceKeys.size * 100).toFixed(1),
      missingKeysList: s.missingKeys.slice(0, 50) // Limiter à 50 pour le JSON
    }))
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'docs/analyses/I18N_TRANSLATION_STATS.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ Rapport sauvegardé dans: docs/analyses/I18N_TRANSLATION_STATS.json\n');
}

analyzeTranslations();

