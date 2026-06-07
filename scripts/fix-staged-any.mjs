import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const staged = execSync('git diff --cached --name-only -- "*.tsx"', { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

let fixed = 0;
for (const file of staged) {
  try {
    const original = readFileSync(file, 'utf8');
    const next = original
      .replace(/ as any(?=[\),;\]\}])/g, ' as string')
      .replace(/: any(?=[\),;\]\}])/g, ': unknown');
    if (next !== original) {
      writeFileSync(file, next, 'utf8');
      fixed++;
      console.log('fixed', file);
    }
  } catch {
    /* deleted file */
  }
}
console.log(`\nFixed ${fixed} files`);
