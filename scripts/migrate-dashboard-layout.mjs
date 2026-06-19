/**
 * Migre les pages dashboard (Physical*, etc.) vers DashboardLayout.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/pages');

const FILES = [
  'dashboard/physical/PhysicalInventoryManagement.tsx',
  'dashboard/physical/PhysicalPromotions.tsx',
  'dashboard/physical/PhysicalProductsAnalytics.tsx',
  'dashboard/physical/PhysicalProductsLots.tsx',
  'dashboard/physical/PhysicalProductsSerialTracking.tsx',
  'dashboard/physical/PhysicalBarcodeScanner.tsx',
  'dashboard/physical/PhysicalPreOrders.tsx',
  'dashboard/physical/PhysicalBackorders.tsx',
  'dashboard/physical/PhysicalBundles.tsx',
  'dashboard/physical/PhysicalMultiCurrency.tsx',
  'dashboard/physical/PhysicalProductWebhooks.tsx',
  'admin/DigitalProductWebhooks.tsx',
  'dashboard/integrations/IntegrationsPage.tsx',
];

const OPEN_PATTERNS = [
  [
    /<SidebarProvider>\s*(?:<[^>]+\/>\s*)?<div className="flex min-h-screen w-full(?: overflow-x-hidden| bg-background)?">\s*<AppSidebar \/>\s*<main className="flex-1 overflow-auto(?: overflow-x-hidden| bg-background)? pb-16 md:pb-0">\s*<div className="([^"]+)">/g,
    '<DashboardLayout>\n          <div className="$1">',
  ],
  [
    /<SidebarProvider>\s*<div className="flex min-h-screen w-full overflow-x-hidden">\s*<AppSidebar \/>\s*<div className="flex-1 flex flex-col">\s*<main className="flex-1 overflow-auto pb-16 md:pb-0">\s*<div className="([^"]+)">/g,
    '<DashboardLayout>\n            <div className="$1">',
  ],
];

function migrate(content) {
  if (!content.includes('AppSidebar')) return null;

  let next = content
    .replace(/import \{ SidebarProvider \} from '@\/components\/ui\/sidebar';\r?\n/g, '')
    .replace(/import \{ AppSidebar \} from '@\/components\/AppSidebar';\r?\n/g, '')
    .replace(
      /import \{ SidebarProvider, SidebarTrigger \} from '@\/components\/ui\/sidebar';\r?\n/g,
      ''
    );

  if (!next.includes("from '@/components/layout/DashboardLayout'")) {
    next = next.replace(
      /^(import .+;\r?\n)/m,
      "$1import { DashboardLayout } from '@/components/layout/DashboardLayout';\n"
    );
  }

  for (const [pattern, replacement] of OPEN_PATTERNS) {
    next = next.replace(pattern, replacement);
  }
  next = next.replace(
    /\s*<\/div>\s*<\/main>\s*<\/div>\s*<\/div>\s*<\/SidebarProvider>/g,
    '\n            </div>\n          </DashboardLayout>'
  );
  next = next.replace(
    /\s*<\/div>\s*<\/main>\s*<\/div>\s*<\/SidebarProvider>/g,
    '\n          </div>\n        </DashboardLayout>'
  );

  if (next.includes('AppSidebar') || next.includes('SidebarProvider')) {
    return null;
  }

  return next;
}

let updated = 0;
const skipped = [];

for (const rel of FILES) {
  const filePath = path.join(ROOT, rel);
  if (!fs.existsSync(filePath)) {
    skipped.push(`${rel} (missing)`);
    continue;
  }
  const migrated = migrate(fs.readFileSync(filePath, 'utf8'));
  if (!migrated) {
    skipped.push(rel);
    continue;
  }
  fs.writeFileSync(filePath, migrated, 'utf8');
  updated++;
  console.log('OK', rel);
}

console.log(`\nUpdated: ${updated}, skipped: ${skipped.length}`);
if (skipped.length) console.log(skipped.join('\n'));
