import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('i18n config fallback (Phase 2.5)', () => {
  it('uses EN fallback chain for non-FR locales', () => {
    const configSource = readFileSync(join(process.cwd(), 'src/i18n/config.ts'), 'utf8');
    expect(configSource).toContain("if (lng === 'fr') return ['fr']");
    expect(configSource).toContain("if (lng === 'en') return ['en', 'fr']");
    expect(configSource).toContain("return ['en', 'fr']");
  });
});
