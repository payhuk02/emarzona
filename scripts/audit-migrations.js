/**
 * Script d'audit des migrations SQL
 * Analyse les migrations et identifie celles à consolider ou archiver
 */

const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../supabase/migrations');
const outputFile = path.join(__dirname, '../supabase/migrations/AUDIT_MIGRATIONS.md');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function auditMigrations() {
  log('\n=== AUDIT DES MIGRATIONS SQL ===\n', 'blue');

  if (!fs.existsSync(migrationsDir)) {
    log(`❌ Dossier migrations introuvable: ${migrationsDir}`, 'red');
    return;
  }

  // Lire toutes les migrations
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .map(file => {
      const filePath = path.join(migrationsDir, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      return {
        name: file,
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        content: content.substring(0, 500), // Premiers 500 caractères pour analyse
        lines: content.split('\n').length,
      };
    })
    .sort((a, b) => a.modified.getTime() - b.modified.getTime());

  log(`📊 Total de migrations trouvées: ${files.length}\n`, 'green');

  // Analyser les migrations
  const analysis = {
    total: files.length,
    bySize: {
      small: files.filter(f => f.size < 1000).length,
      medium: files.filter(f => f.size >= 1000 && f.size < 10000).length,
      large: files.filter(f => f.size >= 10000).length,
    },
    byDate: {
      lastWeek: files.filter(f => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return f.modified > weekAgo;
      }).length,
      lastMonth: files.filter(f => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return f.modified > monthAgo;
      }).length,
      older: files.filter(f => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return f.modified < monthAgo;
      }).length,
    },
    potentialDuplicates: [],
    potentialConsolidations: [],
  };

  // Détecter les doublons potentiels (même taille et contenu similaire)
  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      if (Math.abs(files[i].size - files[j].size) < 100) {
        // Tailles similaires, vérifier le contenu
        const similarity = calculateSimilarity(files[i].content, files[j].content);
        if (similarity > 0.8) {
          analysis.potentialDuplicates.push({
            file1: files[i].name,
            file2: files[j].name,
            similarity: (similarity * 100).toFixed(1),
          });
        }
      }
    }
  }

  // Détecter les migrations liées (même préfixe ou thème)
  const groupedByPrefix = {};
  files.forEach(file => {
    const prefix = file.name.substring(0, 15); // Premiers 15 caractères
    if (!groupedByPrefix[prefix]) {
      groupedByPrefix[prefix] = [];
    }
    groupedByPrefix[prefix].push(file.name);
  });

  Object.entries(groupedByPrefix).forEach(([prefix, fileList]) => {
    if (fileList.length > 2) {
      analysis.potentialConsolidations.push({
        prefix,
        files: fileList,
        count: fileList.length,
      });
    }
  });

  // Générer le rapport
  const report = generateReport(analysis, files);

  // Écrire le rapport
  fs.writeFileSync(outputFile, report, 'utf-8');
  log(`\n✅ Rapport généré: ${outputFile}\n`, 'green');

  // Afficher le résumé
  log('📊 RÉSUMÉ DE L\'AUDIT', 'blue');
  log(`   Total: ${analysis.total} migrations`, 'green');
  log(`   Petites (<1KB): ${analysis.bySize.small}`, 'yellow');
  log(`   Moyennes (1-10KB): ${analysis.bySize.medium}`, 'yellow');
  log(`   Grandes (>10KB): ${analysis.bySize.large}`, 'yellow');
  log(`   Dernière semaine: ${analysis.byDate.lastWeek}`, 'green');
  log(`   Dernier mois: ${analysis.byDate.lastMonth}`, 'green');
  log(`   Plus anciennes: ${analysis.byDate.older}`, 'yellow');
  log(`   Doublons potentiels: ${analysis.potentialDuplicates.length}`, analysis.potentialDuplicates.length > 0 ? 'red' : 'green');
  log(`   Consolidations possibles: ${analysis.potentialConsolidations.length}`, analysis.potentialConsolidations.length > 0 ? 'yellow' : 'green');
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

function generateReport(analysis, files) {
  const now = new Date().toISOString();
  
  return `# 📋 Audit des Migrations SQL

**Date**: ${now}  
**Total de migrations**: ${analysis.total}

---

## 📊 Statistiques

### Par Taille
- **Petites** (<1KB): ${analysis.bySize.small}
- **Moyennes** (1-10KB): ${analysis.bySize.medium}
- **Grandes** (>10KB): ${analysis.bySize.large}

### Par Date
- **Dernière semaine**: ${analysis.byDate.lastWeek}
- **Dernier mois**: ${analysis.byDate.lastMonth}
- **Plus anciennes** (>1 mois): ${analysis.byDate.older}

---

## 🔍 Doublons Potentiels

${analysis.potentialDuplicates.length > 0 
  ? analysis.potentialDuplicates.map(dup => 
    `- **${dup.file1}** ↔ **${dup.file2}** (${dup.similarity}% similaire)`
  ).join('\n')
  : '✅ Aucun doublon détecté'
}

---

## 🔗 Consolidations Possibles

${analysis.potentialConsolidations.length > 0
  ? analysis.potentialConsolidations.map(cons => 
    `### Préfixe: \`${cons.prefix}\`\n- ${cons.count} fichiers:\n${cons.files.map(f => `  - ${f}`).join('\n')}`
  ).join('\n\n')
  : '✅ Aucune consolidation suggérée'
}

---

## 📝 Dernières Migrations

${files.slice(-10).map(f => 
  `- **${f.name}** (${(f.size / 1024).toFixed(2)}KB, ${f.lines} lignes, ${f.modified.toISOString().split('T')[0]})`
).join('\n')}

---

## ✅ Actions Recommandées

1. **Vérifier les doublons** et supprimer les fichiers redondants
2. **Consolider les migrations** avec le même préfixe/thème
3. **Archiver les migrations** anciennes (>6 mois) dans \`supabase/migrations/archive/\`
4. **Documenter** les migrations critiques

---

*Rapport généré automatiquement par \`scripts/audit-migrations.js\`*
`;
}

// Exécuter l'audit
if (require.main === module) {
  auditMigrations();
}

module.exports = { auditMigrations };

