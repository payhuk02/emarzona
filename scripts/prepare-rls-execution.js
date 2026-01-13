#!/usr/bin/env node

/**
 * Script pour préparer l'exécution des migrations RLS
 * Génère des fichiers SQL organisés par pattern pour faciliter l'exécution
 * 
 * Usage:
 *   node scripts/prepare-rls-execution.js
 *   node scripts/prepare-rls-execution.js --pattern=1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prépare les migrations pour l'exécution
 */
function prepareRLSExecution() {
  const args = process.argv.slice(2);
  const patternArg = args.find(arg => arg.startsWith('--pattern='));

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const outputDir = path.join(__dirname, '..', 'supabase', 'migrations', 'rls_execution');

  // Créer le répertoire de sortie
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Lire toutes les migrations RLS générées aujourd'hui
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.includes('_rls_') && file.endsWith('.sql') && file.startsWith('20260113'))
    .map(file => {
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extraire le nom de la table
      const tableMatch = content.match(/v_table_name text := '([^']+)'/);
      const tableName = tableMatch ? tableMatch[1] : 'unknown';
      
      // Extraire le pattern
      const patternMatch = content.match(/Pattern: (\d+)/);
      const pattern = patternMatch ? parseInt(patternMatch[1]) : null;

      return {
        file,
        tableName,
        pattern,
        content,
        path: filePath,
      };
    })
    .filter(f => f.pattern !== null && f.tableName !== 'unknown');

  // Filtrer par pattern si spécifié
  let filteredFiles = files;
  if (patternArg) {
    const patternFilter = parseInt(patternArg.split('=')[1]);
    filteredFiles = files.filter(f => f.pattern === patternFilter);
  }

  // Grouper par pattern
  const byPattern = {};
  filteredFiles.forEach(file => {
    const pattern = file.pattern;
    if (!byPattern[pattern]) {
      byPattern[pattern] = [];
    }
    byPattern[pattern].push(file);
  });

  const patternNames = {
    1: 'user_id',
    2: 'store_id',
    3: 'public',
    4: 'admin_only',
  };

  console.log('🚀 Préparation de l\'Exécution des Migrations RLS\n');
  console.log('='.repeat(80));

  let totalFiles = 0;

  // Créer un fichier combiné pour chaque pattern
  Object.keys(byPattern).sort().forEach(patternNum => {
    const pattern = parseInt(patternNum);
    const patternFiles = byPattern[pattern];
    const patternName = patternNames[pattern] || `pattern_${pattern}`;

    // Créer le fichier combiné
    const combinedContent = [
      `-- ============================================================`,
      `-- Migrations RLS - Pattern ${pattern} (${patternName})`,
      `-- Date: ${new Date().toISOString().split('T')[0]}`,
      `-- Total: ${patternFiles.length} migration(s)`,
      `-- ============================================================\n`,
    ];

    patternFiles.forEach((file, index) => {
      combinedContent.push(`-- Migration ${index + 1}/${patternFiles.length}: ${file.tableName}`);
      combinedContent.push(`-- Fichier: ${file.file}\n`);
      combinedContent.push(file.content);
      combinedContent.push('\n\n');
    });

    const combinedFileName = `20260113_rls_pattern_${pattern}_${patternName}_combined.sql`;
    const combinedFilePath = path.join(outputDir, combinedFileName);
    
    fs.writeFileSync(combinedFilePath, combinedContent.join('\n'), 'utf-8');
    
    console.log(`✅ Pattern ${pattern} (${patternName}): ${patternFiles.length} migration(s) → ${combinedFileName}`);
    totalFiles += patternFiles.length;
  });

  // Créer un fichier README pour l'exécution
  const readmeContent = `# 📋 Guide d'Exécution des Migrations RLS

**Date de génération** : ${new Date().toISOString().split('T')[0]}  
**Total migrations** : ${totalFiles}

---

## 🎯 Ordre d'Exécution Recommandé

### 1. Pattern 4 : Admin Only (4 migrations)
**Fichier** : \`20260113_rls_pattern_4_admin_only_combined.sql\`

**Tables** :
${byPattern[4]?.map(f => `- ${f.tableName}`).join('\n') || '- Aucune'}

**Priorité** : 🔴 CRITIQUE - Exécuter en premier

---

### 2. Pattern 1 : user_id (6 migrations)
**Fichier** : \`20260113_rls_pattern_1_user_id_combined.sql\`

**Tables** :
${byPattern[1]?.map(f => `- ${f.tableName}`).join('\n') || '- Aucune'}

**Priorité** : 🟠 HAUTE

---

### 3. Pattern 2 : store_id (8 migrations)
**Fichier** : \`20260113_rls_pattern_2_store_id_combined.sql\`

**Tables** :
${byPattern[2]?.map(f => `- ${f.tableName}`).join('\n') || '- Aucune'}

**Priorité** : 🟠 HAUTE

---

### 4. Pattern 3 : Public (3 migrations)
**Fichier** : \`20260113_rls_pattern_3_public_combined.sql\`

**Tables** :
${byPattern[3]?.map(f => `- ${f.tableName}`).join('\n') || '- Aucune'}

**Priorité** : 🟡 MOYENNE

---

## 📝 Instructions d'Exécution

### Option 1 : Exécuter les fichiers combinés (Recommandé)

1. Ouvrir Supabase Dashboard → SQL Editor
2. Ouvrir le fichier combiné pour un pattern
3. Copier tout le contenu
4. Coller dans SQL Editor
5. Cliquer sur **Run**
6. Vérifier les messages de succès

### Option 2 : Exécuter les migrations individuellement

1. Ouvrir Supabase Dashboard → SQL Editor
2. Pour chaque migration dans \`supabase/migrations/\` :
   - Copier le contenu
   - Coller dans SQL Editor
   - Exécuter
   - Vérifier les résultats

---

## ✅ Vérification Après Exécution

Pour chaque table, vérifier que les politiques sont créées :

\`\`\`sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'TABLE_NAME'
ORDER BY cmd, policyname;
\`\`\`

**Résultat attendu** : 4 politiques (SELECT, INSERT, UPDATE, DELETE)

---

## ⚠️ Points d'Attention

1. **Exécuter dans l'ordre** : Pattern 4 → Pattern 1 → Pattern 2 → Pattern 3
2. **Vérifier avant d'exécuter** : S'assurer que RLS est activé sur les tables
3. **Tester après chaque pattern** : Vérifier que les politiques fonctionnent
4. **Backup recommandé** : Faire un backup de la base avant l'exécution

---

**Prochaine étape** : Exécuter Pattern 4 (Admin Only) en premier
`;

  const readmePath = path.join(outputDir, 'README.md');
  fs.writeFileSync(readmePath, readmeContent, 'utf-8');

  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(80));
  console.log(`Total migrations préparées : ${totalFiles}`);
  console.log(`Fichiers combinés créés : ${Object.keys(byPattern).length}`);
  console.log(`Répertoire de sortie : ${outputDir}`);
  console.log(`\n✅ Fichiers créés :`);
  Object.keys(byPattern).sort().forEach(patternNum => {
    const pattern = parseInt(patternNum);
    const patternName = patternNames[pattern] || `pattern_${pattern}`;
    console.log(`  - 20260113_rls_pattern_${pattern}_${patternName}_combined.sql`);
  });
  console.log(`  - README.md\n`);

  console.log('📋 Prochaines étapes:');
  console.log('  1. Ouvrir Supabase Dashboard → SQL Editor');
  console.log('  2. Commencer par Pattern 4 (Admin Only)');
  console.log('  3. Exécuter chaque fichier combiné dans l\'ordre');
  console.log('  4. Vérifier les résultats après chaque exécution\n');
}

prepareRLSExecution();
