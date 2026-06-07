/**
 * Migre SidebarProvider + AppSidebar + main vers AppPageShell.
 */
import fs from 'node:fs';
import path from 'node:path';

const SCAN_DIRS = [
  path.resolve('src/pages'),
  path.resolve('src/components/dashboard'),
];

const SKIP_FILES = new Set([
  path.resolve('src/components/AppSidebar.tsx'),
  path.resolve('src/components/layout/AppPageShell.tsx'),
  path.resolve('src/components/layout/MainLayout.tsx'),
]);

const DEFAULT_SHELL_TOKENS = new Set([
  'flex',
  'min-h-screen',
  'w-full',
  'bg-background',
  'overflow-x-hidden',
]);

const DEFAULT_MAIN_TOKENS = new Set(['flex-1', 'overflow-auto']);

function listTsxFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listTsxFiles(full, acc);
    } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
      acc.push(full);
    }
  }
  return acc;
}

function shellClassNameFromWrapper(wrapperClass) {
  const extras = wrapperClass
    .trim()
    .split(/\s+/)
    .filter(token => token && !DEFAULT_SHELL_TOKENS.has(token));
  return extras.length ? extras.join(' ') : undefined;
}

function mainClassNameFromMainTag(mainAttrs) {
  const classMatch = mainAttrs.match(/className="([^"]*)"/);
  if (!classMatch) return undefined;

  const extras = classMatch[1]
    .split(/\s+/)
    .filter(token => token && !DEFAULT_MAIN_TOKENS.has(token));

  return extras.length ? extras.join(' ') : undefined;
}

function buildAppPageShellOpen({ shellClassName, mainClassName, indent }) {
  const props = [];
  if (shellClassName) props.push(`shellClassName="${shellClassName}"`);
  if (mainClassName) props.push(`mainClassName="${mainClassName}"`);
  const propStr = props.length ? ` ${props.join(' ')}` : '';
  return `${indent}<AppPageShell${propStr}>`;
}

function replaceOpeningBlocks(input) {
  let next = input;
  let changed = false;

  const patterns = [
    {
      re: /<SidebarProvider>\s*(?:<SkipToMainContent\s*\/>\s*)?<div className="([^"]*)">\s*<AppSidebar\s*\/>\s*<div className="([^"]*)">\s*(?:<header[\s\S]*?<\/header>\s*)?<main([^>]*)>/g,
      build: (wrapperClass, _middleClass, mainAttrs, indent) =>
        buildAppPageShellOpen({
          shellClassName: shellClassNameFromWrapper(wrapperClass),
          mainClassName: mainClassNameFromMainTag(mainAttrs),
          indent,
        }),
    },
    {
      re: /<SidebarProvider>\s*(?:<SkipToMainContent\s*\/>\s*)?<div className="([^"]*)">\s*<AppSidebar\s*\/>\s*<main([^>]*)>/g,
      build: (wrapperClass, mainAttrs, indent) =>
        buildAppPageShellOpen({
          shellClassName: shellClassNameFromWrapper(wrapperClass),
          mainClassName: mainClassNameFromMainTag(mainAttrs),
          indent,
        }),
    },
    {
      re: /<SidebarProvider>\s*(?:<SkipToMainContent\s*\/>\s*)?<div className="([^"]*)">\s*<AppSidebar\s*\/>\s*<div className="([^"]*)">/g,
      build: (wrapperClass, _middleClass, indent) =>
        buildAppPageShellOpen({
          shellClassName: shellClassNameFromWrapper(wrapperClass),
          indent,
        }),
    },
  ];

  for (const { re, build } of patterns) {
    next = next.replace(re, (...args) => {
      changed = true;
      const offset = args[args.length - 2];
      const lineStart = next.lastIndexOf('\n', offset) + 1;
      const indent = next.slice(lineStart, offset).match(/^\s*/)?.[0] ?? '';
      const params = args.slice(1, -2);
      return build(...params, indent);
    });
  }

  return { next, changed };
}

function cleanupShellClosings(content) {
  let next = content;

  next = next.replace(/\s*<\/main>\s*(?=\s*(?:<\/div>\s*){0,2}\s*<\/SidebarProvider>)/g, '\n');
  next = next.replace(/\s*<\/div>\s*(?=\s*<\/div>\s*<\/SidebarProvider>)/g, '\n');
  next = next.replace(/\s*<\/div>\s*(?=\s*<\/SidebarProvider>)/g, '\n');
  next = next.replace(/<\/SidebarProvider>/g, '</AppPageShell>');

  return next;
}

function migrateImports(content) {
  let next = content;
  const usesSidebarHook = /\buseSidebar\b/.test(next);
  const usesSidebarTrigger = /\bSidebarTrigger\b/.test(next);

  next = next.replace(
    /import \{ SidebarProvider, useSidebar \} from ['"]@\/components\/ui\/sidebar['"];\r?\n/g,
    usesSidebarHook ? "import { useSidebar } from '@/components/ui/sidebar';\n" : ''
  );
  next = next.replace(
    /import \{ SidebarProvider, SidebarTrigger, useSidebar \} from ['"]@\/components\/ui\/sidebar['"];\r?\n/g,
    [
      usesSidebarTrigger ? "import { SidebarTrigger } from '@/components/ui/sidebar';" : '',
      usesSidebarHook ? "import { useSidebar } from '@/components/ui/sidebar';" : '',
    ]
      .filter(Boolean)
      .join('\n')
      .concat('\n')
  );
  next = next.replace(
    /import \{ SidebarProvider, SidebarTrigger \} from ['"]@\/components\/ui\/sidebar['"];\r?\n/g,
    usesSidebarTrigger ? "import { SidebarTrigger } from '@/components/ui/sidebar';\n" : ''
  );
  next = next.replace(/import \{ SidebarProvider \} from ['"]@\/components\/ui\/sidebar['"];\r?\n/g, '');
  next = next.replace(/import \{ AppSidebar \} from ['"]@\/components\/AppSidebar['"];\r?\n/g, '');

  if (!next.includes("from '@/components/layout/AppPageShell'")) {
    next = next.replace(
      /^(import .+;\r?\n)/m,
      "$1import { AppPageShell } from '@/components/layout/AppPageShell';\n"
    );
  }

  return next;
}

function migrate(content) {
  if (!content.includes('AppSidebar') || !content.includes('SidebarProvider')) {
    return null;
  }

  let next = migrateImports(content);
  const { next: withOpenings, changed } = replaceOpeningBlocks(next);
  next = withOpenings;

  if (changed) {
    next = cleanupShellClosings(next);
  }

  if (next.includes('AppSidebar') || next.includes('SidebarProvider')) {
    return null;
  }

  return next;
}

const files = SCAN_DIRS.flatMap(dir => listTsxFiles(dir)).filter(f => !SKIP_FILES.has(f));

let updated = 0;
const skipped = [];

for (const filePath of files) {
  const rel = path.relative(process.cwd(), filePath);
  const original = fs.readFileSync(filePath, 'utf8');
  if (!original.includes('AppSidebar')) continue;

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
