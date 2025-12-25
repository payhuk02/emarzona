/**
 * Script pour optimiser automatiquement les tailles de texte pour la responsivité
 * Applique les patterns de remplacement courants
 */

const fs = require('fs');
const path = require('path');

// Patterns de remplacement
const replacements = [
  // Titres principaux
  {
    pattern: /className="([^"]*)\btext-lg\b([^"]*)"/g,
    replacement: 'className="$1text-base sm:text-lg$2"',
    description: 'text-lg → text-base sm:text-lg'
  },
  {
    pattern: /className="([^"]*)\btext-xl\b([^"]*)"/g,
    replacement: 'className="$1text-lg sm:text-xl$2"',
    description: 'text-xl → text-lg sm:text-xl'
  },
  {
    pattern: /className="([^"]*)\btext-2xl\b([^"]*)"/g,
    replacement: 'className="$1text-lg sm:text-xl md:text-2xl$2"',
    description: 'text-2xl → text-lg sm:text-xl md:text-2xl'
  },
  {
    pattern: /className="([^"]*)\btext-3xl\b([^"]*)"/g,
    replacement: 'className="$1text-xl sm:text-2xl md:text-3xl$2"',
    description: 'text-3xl → text-xl sm:text-2xl md:text-3xl'
  },
  
  // Paddings
  {
    pattern: /className="([^"]*)\bp-6\b([^"]*)"/g,
    replacement: 'className="$1p-3 sm:p-4 md:p-6$2"',
    description: 'p-6 → p-3 sm:p-4 md:p-6'
  },
  {
    pattern: /className="([^"]*)\bp-8\b([^"]*)"/g,
    replacement: 'className="$1p-4 sm:p-6 md:p-8$2"',
    description: 'p-8 → p-4 sm:p-6 md:p-8'
  },
  
  // Gaps
  {
    pattern: /className="([^"]*)\bgap-6\b([^"]*)"/g,
    replacement: 'className="$1gap-3 sm:gap-4 md:gap-6$2"',
    description: 'gap-6 → gap-3 sm:gap-4 md:gap-6'
  },
  {
    pattern: /className="([^"]*)\bgap-8\b([^"]*)"/g,
    replacement: 'className="$1gap-4 sm:gap-6 md:gap-8$2"',
    description: 'gap-8 → gap-4 sm:gap-6 md:gap-8'
  },
];

function optimizeFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  const changes = [];

  replacements.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        changes.push(`${description}: ${matches.length} occurrence(s)`);
      }
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { modified: true, changes };
  }

  return { modified: false, changes: [] };
}

// Liste des pages principales à optimiser
const mainPages = [
  'src/pages/Dashboard.tsx',
  'src/pages/Orders.tsx',
  'src/pages/Products.tsx',
  'src/pages/Customers.tsx',
  'src/pages/Payments.tsx',
  'src/pages/Withdrawals.tsx',
  'src/pages/Analytics.tsx',
  'src/pages/Settings.tsx',
  'src/pages/Marketing.tsx',
  'src/pages/Promotions.tsx',
  'src/pages/Store.tsx',
  'src/pages/Referrals.tsx',
  'src/pages/PlatformRevenue.tsx',
  'src/pages/MyTasks.tsx',
];

console.log('🚀 Optimisation des pages principales pour la responsivité...\n');

const results = [];
mainPages.forEach((pagePath) => {
  const fullPath = path.join(__dirname, '..', pagePath);
  if (fs.existsSync(fullPath)) {
    const result = optimizeFile(fullPath);
    if (result.modified) {
      results.push({ file: pagePath, changes: result.changes });
      console.log(`✅ ${pagePath}`);
      result.changes.forEach(change => console.log(`   - ${change}`));
    } else {
      console.log(`⏭️  ${pagePath} (déjà optimisé)`);
    }
  } else {
    console.log(`❌ ${pagePath} (fichier introuvable)`);
  }
});

console.log(`\n📊 Résumé: ${results.length} fichiers modifiés`);

