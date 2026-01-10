/**
 * Script de vérification de la couverture de test
 * Mesure la couverture actuelle et identifie les gaps
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extensions de fichiers à analyser
 */
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const TEST_EXTENSIONS = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'];

/**
 * Analyse la structure du code pour identifier les fichiers testables
 */
function analyzeCodebase() {
  const srcDir = path.join(__dirname, '..', 'src');
  const codeFiles = [];
  const testFiles = [];

  function scanDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const relativeItemPath = path.join(relativePath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(itemPath, relativeItemPath);
      } else if (stats.isFile()) {
        const ext = path.extname(item);

        if (CODE_EXTENSIONS.includes(ext) && !relativeItemPath.includes('/__tests__/')) {
          codeFiles.push(relativeItemPath);
        } else if (TEST_EXTENSIONS.includes(ext)) {
          testFiles.push(relativeItemPath);
        }
      }
    }
  }

  scanDirectory(srcDir);
  return { codeFiles, testFiles };
}

/**
 * Analyse les composants React pour mesurer leur complexité
 */
function analyzeComponentComplexity(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Compteurs de complexité
    const linesOfCode = content.split('\n').length;
    const hooks = (content.match(/use\w+\(/g) || []).length;
    const effects = (content.match(/useEffect\(/g) || []).length;
    const states = (content.match(/useState\(/g) || []).length;
    const functions = (content.match(/(const|function)\s+\w+\s*=/g) || []).length;
    const jsxElements = (content.match(/<[^>]*>/g) || []).length;

    // Calcul d'un score de complexité
    const complexity = Math.round(
      (linesOfCode * 0.1) +
      (hooks * 2) +
      (effects * 3) +
      (states * 1.5) +
      (functions * 1) +
      (jsxElements * 0.05)
    );

    return {
      linesOfCode,
      hooks,
      effects,
      states,
      functions,
      jsxElements,
      complexity
    };
  } catch (error) {
    console.warn(`⚠️ Impossible d'analyser ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Calcule la couverture de test basée sur les fichiers existants
 */
function calculateTestCoverage(codeFiles, testFiles) {
  const coverage = {
    totalFiles: codeFiles.length,
    testedFiles: 0,
    untestedFiles: [],
    testFilesCount: testFiles.length,
    coveragePercent: 0,
    byCategory: {
      components: { total: 0, tested: 0, percent: 0 },
      hooks: { total: 0, tested: 0, percent: 0 },
      utils: { total: 0, tested: 0, percent: 0 },
      services: { total: 0, tested: 0, percent: 0 },
      types: { total: 0, tested: 0, percent: 0 }
    },
    complexityAnalysis: []
  };

  // Analyser chaque fichier de code
  for (const codeFile of codeFiles) {
    const testFile = codeFile
      .replace(/\.(ts|tsx|js|jsx)$/, '')
      .replace(/\//g, '-')
      .replace(/\\/g, '-');

    // Chercher le fichier de test correspondant
    const hasTest = testFiles.some(test =>
      test.includes(testFile) ||
      test.includes(codeFile.replace(/\.(ts|tsx|js|jsx)$/, ''))
    );

    if (hasTest) {
      coverage.testedFiles++;
    } else {
      coverage.untestedFiles.push(codeFile);
    }

    // Catégorisation par type
    if (codeFile.includes('/components/')) {
      coverage.byCategory.components.total++;
      if (hasTest) coverage.byCategory.components.tested++;
    } else if (codeFile.includes('/hooks/')) {
      coverage.byCategory.hooks.total++;
      if (hasTest) coverage.byCategory.hooks.tested++;
    } else if (codeFile.includes('/lib/') || codeFile.includes('/utils/')) {
      coverage.byCategory.utils.total++;
      if (hasTest) coverage.byCategory.utils.tested++;
    } else if (codeFile.includes('/services/')) {
      coverage.byCategory.services.total++;
      if (hasTest) coverage.byCategory.services.tested++;
    } else if (codeFile.includes('/types/')) {
      coverage.byCategory.types.total++;
      if (hasTest) coverage.byCategory.types.tested++;
    }

    // Analyse de complexité pour les composants critiques
    if (codeFile.includes('/components/') && codeFile.endsWith('.tsx')) {
      const fullPath = path.join(__dirname, '..', 'src', codeFile);
      const complexity = analyzeComponentComplexity(fullPath);
      if (complexity && complexity.complexity > 10) { // Seulement les composants complexes
        coverage.complexityAnalysis.push({
          file: codeFile,
          complexity,
          hasTest
        });
      }
    }
  }

  // Calcul des pourcentages
  coverage.coveragePercent = Math.round((coverage.testedFiles / coverage.totalFiles) * 100);

  for (const category of Object.keys(coverage.byCategory)) {
    const cat = coverage.byCategory[category];
    cat.percent = cat.total > 0 ? Math.round((cat.tested / cat.total) * 100) : 0;
  }

  return coverage;
}

/**
 * Génère un rapport de couverture
 */
function generateCoverageReport(coverage) {
  console.log('🧪 RAPPORT DE COUVERTURE DE TEST\n');

  console.log('📊 COUVERTURE GLOBALE:');
  console.log(`  • Fichiers de code analysés: ${coverage.totalFiles}`);
  console.log(`  • Fichiers testés: ${coverage.testedFiles}`);
  console.log(`  • Fichiers non testés: ${coverage.untestedFiles.length}`);
  console.log(`  • Couverture totale: ${coverage.coveragePercent}%`);
  console.log(`  • Fichiers de test: ${coverage.testFilesCount}\n`);

  console.log('📈 COUVERTURE PAR CATÉGORIE:');
  console.log('┌─────────────┬─────────┬─────────┬────────────┐');
  console.log('│ Catégorie  │ Total   │ Testés  │ Couverture │');
  console.log('├─────────────┼─────────┼─────────┼────────────┤');

  for (const [category, data] of Object.entries(coverage.byCategory)) {
    const name = category.padEnd(11);
    const total = data.total.toString().padStart(7);
    const tested = data.tested.toString().padStart(7);
    const percent = `${data.percent}%`.padStart(10);
    console.log(`│ ${name} │ ${total} │ ${tested} │ ${percent} │`);
  }

  console.log('└─────────────┴─────────┴─────────┴────────────┘\n');

  if (coverage.untestedFiles.length > 0) {
    console.log('❌ FICHIERS NON TESTÉS (priorité haute):');
    coverage.untestedFiles.slice(0, 20).forEach(file => {
      console.log(`  • ${file}`);
    });

    if (coverage.untestedFiles.length > 20) {
      console.log(`  ... et ${coverage.untestedFiles.length - 20} autres fichiers`);
    }
    console.log();
  }

  // Analyse des composants complexes non testés
  const untestedComplexComponents = coverage.complexityAnalysis.filter(c => !c.hasTest);
  if (untestedComplexComponents.length > 0) {
    console.log('🚨 COMPOSANTS COMPLEXES NON TESTÉS:');
    untestedComplexComponents
      .sort((a, b) => b.complexity.complexity - a.complexity.complexity)
      .slice(0, 10)
      .forEach(comp => {
        console.log(`  • ${comp.file} (complexité: ${comp.complexity.complexity})`);
        console.log(`    - Hooks: ${comp.complexity.hooks}, États: ${comp.complexity.states}, Effets: ${comp.complexity.effects}`);
      });
    console.log();
  }

  // Recommandations
  console.log('💡 RECOMMANDATIONS:');

  if (coverage.coveragePercent < 85) {
    console.log('  • Objectif: Atteindre 85% de couverture de test');
    console.log(`  • Priorité: ${coverage.untestedFiles.length} fichiers à tester`);
  }

  if (untestedComplexComponents.length > 0) {
    console.log('  • Focus sur les composants complexes non testés');
    console.log('  • Tests d\'intégration pour les composants avec de nombreux hooks');
  }

  console.log('  • Tests unitaires pour les utilitaires et hooks');
  console.log('  • Tests d\'accessibilité pour les composants UI');
  console.log('  • Tests de performance pour les composants lourds');
}

/**
 * Script principal
 */
async function checkTestCoverage() {
  console.log('🔍 Analyse de la couverture de test en cours...');

  const { codeFiles, testFiles } = analyzeCodebase();
  console.log(`📁 ${codeFiles.length} fichiers de code trouvés`);
  console.log(`🧪 ${testFiles.length} fichiers de test trouvés\n`);

  const coverage = calculateTestCoverage(codeFiles, testFiles);
  generateCoverageReport(coverage);

  // Résumé final
  const status = coverage.coveragePercent >= 85 ? '✅' : coverage.coveragePercent >= 70 ? '🟡' : '❌';
  console.log(`\n${status} STATUT FINAL: ${coverage.coveragePercent}% de couverture de test`);

  if (coverage.coveragePercent >= 85) {
    console.log('🎉 Objectif de 85% atteint ! Couverture excellente.');
  } else {
    console.log(`📈 ${85 - coverage.coveragePercent}% de couverture manquante pour atteindre l'objectif.`);
  }

  return coverage;
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  checkTestCoverage().catch(console.error);
}

export { checkTestCoverage, analyzeCodebase, calculateTestCoverage };