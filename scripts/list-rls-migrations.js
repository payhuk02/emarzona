#!/usr/bin/env node

/**
 * Script pour lister toutes les migrations RLS générées
 * 
 * Usage:
 *   node scripts/list-rls-migrations.js
 *   node scripts/list-rls-migrations.js --pattern=1
 *   node scripts/list-rls-migrations.js --table=notifications
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Liste toutes les migrations RLS générées
 */
function listRLSMigrations() {
  const args = process.argv.slice(2);
  const patternArg = args.find(arg => arg.startsWith('--pattern='));
  const tableArg = args.find(arg => arg.startsWith('--table='));

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Répertoire migrations introuvable:', migrationsDir);
    process.exit(1);
  }

  // Lire tous les fichiers de migration
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.includes('_rls_') && file.endsWith('.sql'))
    .map(file => {
      const filePath = path.join(migrationsDir, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extraire le nom de la table
      const tableMatch = content.match(/v_table_name text := '([^']+)'/);
      const tableName = tableMatch ? tableMatch[1] : 'unknown';
      
      // Extraire le pattern
      const patternMatch = content.match(/Pattern: (\d+)/);
      const pattern = patternMatch ? parseInt(patternMatch[1]) : null;
      
      // Extraire la date
      const dateMatch = content.match(/Date: (\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : null;

      return {
        file,
        tableName,
        pattern,
        date,
        size: stats.size,
        modified: stats.mtime,
        path: filePath,
      };
    })
    .sort((a, b) => b.modified - a.modified);

  // Filtrer par pattern si spécifié
  let filteredFiles = files;
  if (patternArg) {
    const patternFilter = parseInt(patternArg.split('=')[1]);
    filteredFiles = files.filter(f => f.pattern === patternFilter);
  }

  // Filtrer par table si spécifié
  if (tableArg) {
    const tableFilter = tableArg.split('=')[1].toLowerCase();
    filteredFiles = filteredFiles.filter(f => 
      f.tableName.toLowerCase().includes(tableFilter)
    );
  }

  // Afficher les résultats
  console.log('📋 Migrations RLS Générées\n');
  console.log('='.repeat(80));

  if (filteredFiles.length === 0) {
    console.log('❌ Aucune migration trouvée');
    if (patternArg || tableArg) {
      console.log('   Essayez sans filtres pour voir toutes les migrations');
    }
    return;
  }

  // Grouper par pattern
  const byPattern = {};
  filteredFiles.forEach(file => {
    const pattern = file.pattern || 'unknown';
    if (!byPattern[pattern]) {
      byPattern[pattern] = [];
    }
    byPattern[pattern].push(file);
  });

  // Afficher par pattern
  Object.keys(byPattern).sort().forEach(patternNum => {
    const patternFiles = byPattern[patternNum];
    const patternNames = {
      1: 'user_id (Données utilisateur)',
      2: 'store_id (Données boutique)',
      3: 'Public (Marketplace)',
      4: 'Admin Only',
    };
    
    console.log(`\n📋 Pattern ${patternNum} : ${patternNames[patternNum] || 'Unknown'}`);
    console.log('-'.repeat(80));
    
    patternFiles.forEach(file => {
      const sizeKB = (file.size / 1024).toFixed(1);
      const modifiedDate = file.modified.toISOString().split('T')[0];
      const modifiedTime = file.modified.toTimeString().split(' ')[0].substring(0, 5);
      
      console.log(`  ✅ ${file.tableName.padEnd(30)} | ${file.file.padEnd(45)} | ${sizeKB} KB | ${modifiedDate} ${modifiedTime}`);
    });
  });

  // Résumé
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(80));
  console.log(`Total migrations : ${filteredFiles.length}`);
  
  const byPatternSummary = {};
  filteredFiles.forEach(file => {
    const pattern = file.pattern || 'unknown';
    byPatternSummary[pattern] = (byPatternSummary[pattern] || 0) + 1;
  });
  
  Object.keys(byPatternSummary).sort().forEach(pattern => {
    const patternNames = {
      1: 'user_id',
      2: 'store_id',
      3: 'Public',
      4: 'Admin',
    };
    console.log(`  Pattern ${pattern} (${patternNames[pattern] || 'Unknown'}) : ${byPatternSummary[pattern]}`);
  });

  console.log('\n💡 Commandes utiles:');
  console.log('  node scripts/list-rls-migrations.js --pattern=1  # Filtrer par pattern');
  console.log('  node scripts/list-rls-migrations.js --table=notifications  # Filtrer par table\n');
}

listRLSMigrations();
