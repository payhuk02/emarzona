/**
 * Migre les pages admin de AppSidebar/SidebarProvider vers AdminLayout.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/pages');

const FILES = [
  'admin/AdminSuppliersManagement.tsx',
  'admin/AdminDemandForecasting.tsx',
  'admin/AdminCostOptimization.tsx',
  'admin/AdminBatchShipping.tsx',
  'admin/AdminProductKitsManagement.tsx',
];

function migrate(content) {
  if (!content.includes('AppSidebar')) return null;

  let next = content
    .replace(
      /import \{ SidebarProvider, SidebarTrigger \} from '@\/components\/ui\/sidebar';\r?\nimport \{ AppSidebar \} from '@\/components\/AppSidebar';\r?\n/g,
      "import { AdminLayout } from '@/components/admin/AdminLayout';\n"
    )
    .replace(/import \{ SidebarProvider \} from '@\/components\/ui\/sidebar';\r?\n/g, '')
    .replace(/import \{ AppSidebar \} from '@\/components\/AppSidebar';\r?\n/g, '')
    .replace(/import \{ SidebarTrigger \} from '@\/components\/ui\/sidebar';\r?\n/g, '')
    .replace(/\s*<SidebarTrigger[^/]*\/>\r?\n/g, '\n');

  if (!next.includes("from '@/components/admin/AdminLayout'")) {
    next = next.replace(
      /^(import .+;\r?\n)/m,
      "$1import { AdminLayout } from '@/components/admin/AdminLayout';\n"
    );
  }

  const openPatterns = [
    [
      /<SidebarProvider>\s*<div className="flex min-h-screen w-full bg-background">\s*<AppSidebar \/>\s*<main className="flex-1 overflow-auto pb-16 md:pb-0">\s*<div className="([^"]+)">/g,
      '<AdminLayout>\n        <div className="$1">',
    ],
    [
      /<SidebarProvider>\s*<div className="flex min-h-screen w-full">\s*<AppSidebar \/>\s*<div className="flex-1 flex flex-col bg-background">\s*<main className="flex-1 overflow-auto overflow-x-hidden pb-16 md:pb-0">\s*<div className="([^"]+)">/g,
      '<AdminLayout>\n        <div className="$1">',
    ],
  ];

  for (const [pattern, replacement] of openPatterns) {
    next = next.replace(pattern, replacement);
  }

  next = next.replace(
    /\s*<\/div>\s*<\/main>\s*<\/div>\s*<\/div>\s*<\/SidebarProvider>/g,
    '\n        </div>\n      </AdminLayout>'
  );
  next = next.replace(
    /\s*<\/div>\s*<\/main>\s*<\/div>\s*<\/SidebarProvider>/g,
    '\n        </div>\n      </AdminLayout>'
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
  const original = fs.readFileSync(filePath, 'utf8');
  const migrated = migrate(original);
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
