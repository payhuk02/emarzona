/**
 * Script pour trouver et corriger les importations dupliquées de Select
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour analyser un fichier et trouver les duplications
function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { hasDuplicates: false, imports: [] };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const selectImports = [];
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    // Chercher les importations de Select
    const match = line.match(/import\s*\{\s*([^}]*Select[^}]*)\}\s*from\s*['"`]@\/components\/ui\/select['"`];?/);
    if (match) {
      selectImports.push({
        line: lineNumber,
        content: match[0].trim(),
        components: match[1].trim()
      });
    }
  }

  return {
    hasDuplicates: selectImports.length > 1,
    imports: selectImports,
    filePath
  };
}

// Fonction pour corriger les duplications
function fixFile(filePath, imports) {
  if (imports.length <= 1) return false;

  let content = fs.readFileSync(filePath, 'utf8');

  // Garder seulement la première importation et supprimer les autres
  const firstImport = imports[0];
  const allComponents = new Set();

  // Collecter tous les composants de toutes les importations
  imports.forEach(imp => {
    const components = imp.components.split(',').map(c => c.trim());
    components.forEach(comp => {
      if (comp) allComponents.add(comp);
    });
  });

  // Créer une importation complète
  const completeImport = `import {\n${Array.from(allComponents).sort().map(comp => `  ${comp}`).join(',\n')}\n} from '@/components/ui/select';`;

  // Remplacer toutes les importations de Select par une seule
  const importRegex = /import\s*\{\s*([^}]*Select[^}]*)\}\s*from\s*['"`]@\/components\/ui\/select['"`];?/g;
  content = content.replace(importRegex, (match, components, offset) => {
    // Ne remplacer que la première occurrence
    if (content.indexOf(match) === offset) {
      return completeImport;
    }
    return ''; // Supprimer les autres
  });

  // Nettoyer les lignes vides supplémentaires
  content = content.replace(/\n\n\n+/g, '\n\n');

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

// Chercher tous les fichiers TypeScript/TSX
function findFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findFiles(fullPath, files);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }

  return files;
}

console.log('🔍 RECHERCHE DES IMPORTATIONS DUPLIQUÉES DE SELECT\n');

const allFiles = findFiles('./src');
const filesWithDuplicates = [];

for (const file of allFiles) {
  const analysis = analyzeFile(file);
  if (analysis.hasDuplicates) {
    filesWithDuplicates.push(analysis);
    console.log(`❌ ${file}: ${analysis.imports.length} importations`);
    analysis.imports.forEach(imp => {
      console.log(`   Ligne ${imp.line}: ${imp.content}`);
    });
  }
}

console.log(`\n📊 ${filesWithDuplicates.length} fichiers avec des duplications trouvés\n`);

if (filesWithDuplicates.length > 0) {
  console.log('🔧 CORRECTION AUTOMATIQUE...\n');

  let fixedCount = 0;
  for (const fileInfo of filesWithDuplicates) {
    if (fixFile(fileInfo.filePath, fileInfo.imports)) {
      console.log(`✅ ${fileInfo.filePath} corrigé`);
      fixedCount++;
    }
  }

  console.log(`\n🎯 CORRECTION TERMINÉE: ${fixedCount} fichiers corrigés`);
} else {
  console.log('✅ Aucune duplication trouvée !');
}