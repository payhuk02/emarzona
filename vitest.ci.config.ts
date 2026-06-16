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
        thresholds: {
          lines: 45,
          functions: 35,
          branches: 30,
          statements: 45,
        },
      },
    },
  })
);
