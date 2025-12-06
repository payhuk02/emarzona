/**
 * Script d'analyse pour identifier les composants React à optimiser
 * Recherche les composants lourds qui pourraient bénéficier de React.memo
 */

const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../src/components');
const outputFile = path.join(__dirname, '../docs/COMPONENTS_OPTIMIZATION_REPORT.md');

function findComponents(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findComponents(filePath, fileList);
    } else if (file.endsWith('.tsx') && !file.includes('.test.') && !file.includes('.spec.')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function analyzeComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(path.join(__dirname, '../src'), filePath);
  
  // Analyser le composant
  const analysis = {
    path: relativePath,
    lines: content.split('\n').length,
    hasReactMemo: /React\.memo|React\.memo\(/.test(content),
    hasUseCallback: /useCallback/.test(content),
    hasUseMemo: /useMemo/.test(content),
    hasProps: /interface.*Props|type.*Props/.test(content),
    hasState: /useState/.test(content),
    hasEffects: /useEffect/.test(content),
    hasComplexLogic: content.split('if (').length > 5 || content.split('for (').length > 2,
    importsCount: (content.match(/^import /gm) || []).length,
    exportDefault: /export default/.test(content),
    exportNamed: /export (const|function)/.test(content),
  };

  // Calculer un score d'optimisation (0-100)
  let optimizationScore = 0;
  if (analysis.hasReactMemo) optimizationScore += 30;
  if (analysis.hasUseCallback) optimizationScore += 20;
  if (analysis.hasUseMemo) optimizationScore += 20;
  if (analysis.hasProps && !analysis.hasReactMemo) optimizationScore -= 30; // Props sans memo = problème
  if (analysis.hasComplexLogic && !analysis.hasUseMemo) optimizationScore -= 20;
  if (analysis.lines > 300 && !analysis.hasReactMemo) optimizationScore -= 30; // Gros composant sans memo

  analysis.optimizationScore = Math.max(0, Math.min(100, optimizationScore));
  analysis.needsOptimization = analysis.optimizationScore < 50 && (analysis.hasProps || analysis.lines > 200);

  return analysis;
}

function generateReport(components) {
  const now = new Date().toISOString();
  
  // Trier par score d'optimisation (plus bas = priorité)
  const sorted = components
    .filter(c => c.needsOptimization)
    .sort((a, b) => a.optimizationScore - b.optimizationScore);

  const highPriority = sorted.filter(c => c.optimizationScore < 30);
  const mediumPriority = sorted.filter(c => c.optimizationScore >= 30 && c.optimizationScore < 50);

  return `# 📊 Rapport d'Optimisation des Composants React

**Date**: ${now}  
**Total de composants analysés**: ${components.length}  
**Composants nécessitant optimisation**: ${sorted.length}

---

## 🔴 Priorité Haute (Score < 30)

${highPriority.length > 0 
  ? highPriority.map(c => `
### ${c.path}
- **Score**: ${c.optimizationScore}/100
- **Lignes**: ${c.lines}
- **Problèmes**:
  ${!c.hasReactMemo && c.hasProps ? '- ❌ Props sans React.memo' : ''}
  ${c.lines > 300 && !c.hasReactMemo ? '- ❌ Gros composant sans React.memo' : ''}
  ${c.hasComplexLogic && !c.hasUseMemo ? '- ⚠️ Logique complexe sans useMemo' : ''}
- **Recommandations**:
  ${!c.hasReactMemo ? '  - Ajouter React.memo avec fonction de comparaison' : ''}
  ${!c.hasUseCallback ? '  - Utiliser useCallback pour les handlers' : ''}
  ${!c.hasUseMemo && c.hasComplexLogic ? '  - Utiliser useMemo pour les calculs coûteux' : ''}
`).join('\n')
  : '✅ Aucun composant en priorité haute'
}

---

## 🟡 Priorité Moyenne (Score 30-50)

${mediumPriority.length > 0
  ? mediumPriority.map(c => `
### ${c.path}
- **Score**: ${c.optimizationScore}/100
- **Lignes**: ${c.lines}
- **Recommandations**:
  ${!c.hasReactMemo ? '  - Considérer React.memo' : ''}
  ${!c.hasUseCallback ? '  - Considérer useCallback' : ''}
`).join('\n')
  : '✅ Aucun composant en priorité moyenne'
}

---

## 📈 Statistiques Globales

- **Composants avec React.memo**: ${components.filter(c => c.hasReactMemo).length}
- **Composants avec useCallback**: ${components.filter(c => c.hasUseCallback).length}
- **Composants avec useMemo**: ${components.filter(c => c.hasUseMemo).length}
- **Composants avec Props**: ${components.filter(c => c.hasProps).length}
- **Composants > 300 lignes**: ${components.filter(c => c.lines > 300).length}

---

## ✅ Actions Recommandées

1. **Optimiser les composants en priorité haute** avec React.memo
2. **Ajouter useCallback** sur les handlers des composants avec props
3. **Ajouter useMemo** sur les calculs coûteux
4. **Tester les performances** avec React DevTools Profiler

---

*Rapport généré automatiquement par \`scripts/optimize-react-components.js\`*
`;
}

function analyzeComponents() {
  console.log('\n🔍 Analyse des composants React...\n');

  const components = findComponents(componentsDir);
  console.log(`📁 ${components.length} composants trouvés\n`);

  const analyses = components.map(analyzeComponent);
  
  // Générer le rapport
  const report = generateReport(analyses);
  fs.writeFileSync(outputFile, report, 'utf-8');
  
  console.log(`✅ Rapport généré: ${outputFile}\n`);
  
  const needsOptimization = analyses.filter(a => a.needsOptimization);
  console.log(`📊 Composants nécessitant optimisation: ${needsOptimization.length}`);
  console.log(`   🔴 Priorité haute: ${needsOptimization.filter(a => a.optimizationScore < 30).length}`);
  console.log(`   🟡 Priorité moyenne: ${needsOptimization.filter(a => a.optimizationScore >= 30 && a.optimizationScore < 50).length}\n`);
}

// Exécuter l'analyse
if (require.main === module) {
  analyzeComponents();
}

module.exports = { analyzeComponents };

