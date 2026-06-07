import fs from 'fs';

const lines = fs.readFileSync('src/components/AppSidebar.tsx', 'utf8').split(/\r?\n/);
const iconImports = lines.slice(0, 61).join('\n').replace(/^\/\/ Import[^\n]*\n/, '');
const lucideImports = lines.slice(62, 77).join('\n');
const menuBlock = lines
  .slice(126, 843)
  .join('\n')
  .replace('const menuSections', 'export const userMenuSections');
const adminBlock = lines
  .slice(849, 1221)
  .join('\n')
  .replace('const adminMenuSections', 'export const adminMenuSections');

const header = `/**
 * Sidebar navigation menu data (Phase 3 extraction).
 */
${iconImports}
${lucideImports}
import type { RawNavSection } from '@/config/navigation.enrich';

`;

fs.writeFileSync('src/config/navigation.menus.tsx', header + menuBlock + '\n\n' + adminBlock + '\n');
console.log('OK', (header + menuBlock + adminBlock).split('\n').length, 'lines');
