import { defineConfig, mergeConfig } from 'vitest/config';
import base from './vitest.config';

/**
 * Sous-ensemble de tests exécuté en CI (évite les suites en dette / OOM).
 * Élargir progressivement en corrigeant les fichiers exclus dans vitest.config.ts.
 */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: [
        'src/lib/__tests__/**/*.test.ts',
        'src/utils/__tests__/**/*.test.ts',
        'src/hooks/__tests__/useDebounce.test.ts',
        'src/hooks/__tests__/useRequire2FA.test.tsx',
        'src/hooks/__tests__/useStorage.test.ts',
        'src/lib/checkout/__tests__/**/*.test.ts',
        'src/lib/payments/__tests__/**/*.test.ts',
        'src/pages/__tests__/Checkout.test.tsx',
        'src/components/products/tabs/**/__tests__/**',
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        'src/components/products/tabs/__tests__/ProductAnalyticsTab.test.tsx',
        'src/lib/__tests__/file-security.test.ts',
        'src/lib/__tests__/currency-converter.test.ts',
        'src/lib/__tests__/currency-exchange-api.test.ts',
      ],
      pool: 'forks',
      maxWorkers: 2,
      coverage: {
        include: [
          'src/lib/checkout/**/*.{ts,tsx}',
          'src/lib/payments/**/*.{ts,tsx}',
          'src/hooks/useRequire2FA.ts',
        ],
        exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', '**/__tests__/**'],
        // Sprint 3: +5 pts vs Sprint 2 (45/35/30/45), avec garde-fous par domaine
        thresholds: {
          lines: 50,
          functions: 40,
          branches: 35,
          statements: 50,
          'src/lib/checkout/**': {
            lines: 48,
            functions: 45,
            branches: 35,
            statements: 48,
          },
          'src/lib/payments/**': {
            // Couverture mesurée: lines 53%, funcs 56%, branches 33%, stmts 49%
            // Sprint 3: +2 pts stmts/lines, +1 branches (Sprint 4 vise +5 chacun)
            lines: 50,
            functions: 54,
            branches: 31,
            statements: 47,
          },
          'src/hooks/useRequire2FA.ts': {
            lines: 60,
            functions: 50,
            branches: 52,
            statements: 60,
          },
        },
      },
    },
  })
);
