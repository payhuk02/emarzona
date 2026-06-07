/**
 * Répare les fermetures JSX cassées par migrate-app-page-shell.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const FILES = [
  'src/pages/AdvancedDashboard.tsx',
  'src/pages/AffiliateDashboard.tsx',
  'src/pages/CartEnhanced.tsx',
  'src/pages/MyTasks.tsx',
  'src/pages/PaymentsCustomers.tsx',
  'src/pages/Pixels.tsx',
  'src/pages/Referrals.tsx',
  'src/pages/SEOAnalyzer.tsx',
  'src/pages/Store.tsx',
  'src/pages/StoreAffiliates.tsx',
  'src/pages/courses/CreateCourse.tsx',
  'src/pages/courses/MyCourses.tsx',
  'src/pages/customer/CustomerMyBookings.tsx',
  'src/pages/customer/CustomerMyWishlist.tsx',
  'src/pages/inventory/InventoryDashboard.tsx',
  'src/pages/store/StoreTeamManagement.tsx',
  'src/pages/vendor/VendorMessaging.tsx',
];

function repair(content) {
  let next = content;

  // Retire <main> orphelin (AppPageShell fournit déjà <main id="main-content">)
  next = next.replace(/\r?\n[ \t]*<main className="flex-1[^"]*">\r?\n/g, '\n');

  next = next.replace(
    /\r?\n[ \t]*<\/main>\s*\r?\n[ \t]*<\/div>\s*\r?\n(?=[ \t]*(?:<\/AppPageShell>|<[A-Z]))/g,
    '\n'
  );
  next = next.replace(/\r?\n[ \t]*<\/main>\s*\r?\n(?=[ \t]*<\/AppPageShell>)/g, '\n');

  // Ferme un <div> ouvert directement sous AppPageShell si </AppPageShell> suit sans </div>
  next = next.replace(
    /(<AppPageShell[^>]*>\s*\n[ \t]*<div className="[^"]*">[\s\S]*?)(\n[ \t]*<\/AppPageShell>)/g,
    (match, body, close) => {
      if (/<\/div>\s*\n[ \t]*<\/AppPageShell>/.test(match)) return match;
      const openDivs = (body.match(/<div[\s>]/g) || []).length;
      const closeDivs = (body.match(/<\/div>/g) || []).length;
      if (openDivs > closeDivs) {
        return `${body}\n          </div>${close}`;
      }
      return match;
    }
  );

  return next;
}

for (const rel of FILES) {
  const filePath = path.resolve(rel);
  if (!fs.existsSync(filePath)) {
    console.log('SKIP (missing)', rel);
    continue;
  }
  const original = fs.readFileSync(filePath, 'utf8');
  const fixed = repair(original);
  if (fixed !== original) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log('FIXED', rel);
  } else {
    console.log('UNCHANGED', rel);
  }
}
