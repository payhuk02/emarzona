/**
 * Script pour remplacer automatiquement les DropdownMenu par Select + SelectContent
 * Usage simple avec pattern matching
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liste des fichiers à traiter (patterns simples)
const filesToProcess = [
  'src/components/pixels/PixelsTable.tsx',
  'src/components/promotions/PromotionsTable.tsx',
  'src/components/seo/SEOPagesList.tsx',
  'src/components/notifications/NotificationRulesManager.tsx'
];

console.log('🔄 REMPLACEMENT AUTOMATIQUE DES DROPDOWN MENU\n');

// Pattern de remplacement pour les imports
const importPattern = /import\s*\{\s*DropdownMenu[^}]*\}\s*from\s*['"`]@\/components\/ui\/dropdown-menu['"`];?/g;
const importReplacement = `import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";`;

// Pattern de remplacement pour DropdownMenu -> Select
const dropdownMenuPattern = /<DropdownMenu>/g;
const dropdownMenuReplacement = `<Select>`;

// Pattern de remplacement pour DropdownMenuTrigger -> SelectTrigger
const triggerPattern = /<DropdownMenuTrigger\s+asChild>/g;
const triggerReplacement = `<SelectTrigger`;

// Pattern de remplacement pour DropdownMenuContent -> SelectContent
const contentPattern = /<DropdownMenuContent\s+align="end">/g;
const contentReplacement = `<SelectContent mobileVariant="sheet" className="min-w-[200px]">`;

// Pattern de remplacement pour DropdownMenuItem -> SelectItem
const itemPattern = /<DropdownMenuItem/g;
const itemReplacement = `<SelectItem value="action" onSelect`;

// Pattern de remplacement pour </DropdownMenu> -> </Select>
const closeDropdownMenuPattern = /<\/DropdownMenu>/g;
const closeDropdownMenuReplacement = `</Select>`;

// Pattern de remplacement pour </DropdownMenuTrigger> -> </SelectTrigger>
const closeTriggerPattern = /<\/DropdownMenuTrigger>/g;
const closeTriggerReplacement = `</SelectTrigger>`;

// Pattern de remplacement pour </DropdownMenuContent> -> </SelectContent>
const closeContentPattern = /<\/DropdownMenuContent>/g;
const closeContentReplacement = `</SelectContent>`;

// Pattern de remplacement pour </DropdownMenuItem> -> </SelectItem>
const closeItemPattern = /<\/DropdownMenuItem>/g;
const closeItemReplacement = `</SelectItem>`;

filesToProcess.forEach(filePath => {
  try {
    console.log(`📝 Traitement de ${filePath}`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Appliquer les remplacements
    let modified = false;

    if (content.includes('DropdownMenu')) {
      content = content.replace(importPattern, importReplacement);
      content = content.replace(dropdownMenuPattern, dropdownMenuReplacement);
      content = content.replace(triggerPattern, triggerReplacement);
      content = content.replace(contentPattern, contentReplacement);
      content = content.replace(itemPattern, itemReplacement);
      content = content.replace(closeDropdownMenuPattern, closeDropdownMenuReplacement);
      content = content.replace(closeTriggerPattern, closeTriggerReplacement);
      content = content.replace(closeContentPattern, closeContentReplacement);
      content = content.replace(closeItemPattern, closeItemReplacement);

      // Ajustements spécifiques pour les SelectItem
      content = content.replace(/onSelect=\{[^}]*\}/g, (match) => {
        // Transformer les onClick en onSelect
        return match.replace(/onClick/g, 'onSelect');
      });

      // Ajuster les valeurs des SelectItem
      content = content.replace(/value="action"/g, (match, index) => {
        const values = ['edit', 'delete', 'copy', 'view', 'export'];
        return `value="${values[index % values.length]}"`;
      });

      fs.writeFileSync(filePath, content, 'utf8');
      modified = true;
    }

    if (modified) {
      console.log(`✅ ${filePath} modifié`);
    } else {
      console.log(`⚪ ${filePath} inchangé`);
    }

  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
  }
});

console.log('\n🎯 TRAITEMENT TERMINÉ');
console.log('\n📋 PROCHAINES ÉTAPES:');
console.log('1. Tester les fichiers modifiés');
console.log('2. Corriger manuellement les cas complexes');
console.log('3. Vérifier que tout fonctionne');console.log('4. Supprimer dropdown-menu.tsx si plus utilisé');