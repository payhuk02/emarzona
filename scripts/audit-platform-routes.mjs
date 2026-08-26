/**
 * Audit one-shot: lazy imports + nav URLs vs registered routes.
 * node scripts/audit-platform-routes.mjs
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const ROUTE_FILES = [
  'src/routes/publicRoutes.tsx',
  'src/routes/customerRoutes.tsx',
  'src/routes/dashboardRoutes.tsx',
  'src/routes/adminRoutes.tsx',
  'src/routes/storeSubdomainRoutes.tsx',
];

const NAV_FILES = [
  'src/config/navigation.menus.tsx',
  'src/config/navigation.create.ts',
  'src/config/navigation.horizontal.ts',
  'src/config/navigation.context.extended.ts',
  'src/config/navigation.context.phase6.ts',
  'src/config/navigation.context.settings.ts',
  'src/config/navigation.progressive.ts',
];

function resolveImport(spec) {
  const rel = spec.replace(/^@\//, 'src/');
  const candidates = [
    join(root, `${rel}.tsx`),
    join(root, `${rel}.ts`),
    join(root, rel, 'index.tsx'),
    join(root, rel, 'index.ts'),
    join(root, rel),
  ];
  return candidates.find(p => existsSync(p)) ?? null;
}

function extractRoutePaths(source) {
  const paths = new Set();
  for (const re of [/\bpr(?:Auth)?\(\s*['"]([^'"]+)['"]/g, /\bprotectedRoute\(\s*['"]([^'"]+)['"]/g, /<Route\s+path=["']([^"']+)["']/g]) {
    let m;
    while ((m = re.exec(source))) paths.add(m[1]);
  }
  return [...paths];
}

function routeExists(url, patterns) {
  const itemPath = url.split('?')[0];
  if (!itemPath.startsWith('/') || itemPath.startsWith('http') || itemPath.startsWith('mailto:')) {
    return true;
  }
  if (itemPath === '#' || itemPath === '') return true;
  for (const pattern of patterns) {
    if (pattern === itemPath) return true;
    if (!pattern || pattern === '*' || pattern === '') continue;
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`);
    if (regex.test(itemPath)) return true;
  }
  return false;
}

const routeSources = ROUTE_FILES.map(f => ({
  file: f,
  source: readFileSync(join(root, f), 'utf8'),
}));
const allSource = routeSources.map(r => r.source).join('\n');
const registered = [...new Set(routeSources.flatMap(r => extractRoutePaths(r.source)))];

const importRe = /import\(\s*['"](@\/[^'"]+)['"]\s*\)/g;
const missingImports = [];
const seenImports = new Set();
let m;
while ((m = importRe.exec(allSource))) {
  const spec = m[1].replace(/\/$/, '');
  if (seenImports.has(spec)) continue;
  seenImports.add(spec);
  if (!resolveImport(spec)) missingImports.push(spec);
}

const urlRe = /\burl:\s*['"]([^'"]+)['"]/g;
const navUrls = new Set();
for (const file of NAV_FILES) {
  const src = readFileSync(join(root, file), 'utf8');
  let um;
  while ((um = urlRe.exec(src))) navUrls.add(um[1]);
}

const missingNav = [...navUrls].filter(u => !routeExists(u, registered)).sort();

const namedDefaultRe =
  /lazyPage\(\s*\(\)\s*=>\s*import\(['"](@\/[^'"]+)['"]\)\s*\.then\(\s*m\s*=>\s*\(\{\s*default:\s*m\.(\w+)/g;
const namedExportIssues = [];
let nm;
while ((nm = namedDefaultRe.exec(allSource))) {
  const filePath = resolveImport(nm[1]);
  if (!filePath) continue;
  const content = readFileSync(filePath, 'utf8');
  const exportName = nm[2];
  const hasNamed =
    content.includes(`export const ${exportName}`) ||
    content.includes(`export function ${exportName}`) ||
    content.includes(`export class ${exportName}`) ||
    new RegExp(`export \\{[^}]*\\b${exportName}\\b`).test(content);
  if (!hasNamed && exportName !== 'default') {
    namedExportIssues.push(`${nm[1]} missing export ${exportName}`);
  }
}

console.log(JSON.stringify({
  registeredCount: registered.length,
  lazyImports: seenImports.size,
  missingImports,
  navUrls: navUrls.size,
  missingNav,
  namedExportIssues,
}, null, 2));
