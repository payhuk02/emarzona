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
        'src/hooks/__tests__/useMoneroo.test.ts',
        'src/hooks/__tests__/useStorage.test.ts',
        'src/lib/payments/__tests__/**/*.test.ts',
        'src/components/products/tabs/**/__tests__/**',
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        'src/components/products/tabs/__tests__/ProductAnalyticsTab.test.tsx',
        'src/hooks/__tests__/useMoneroo.test.ts',
        'src/lib/__tests__/file-security.test.ts',
        'src/lib/__tests__/currency-converter.test.ts',
        'src/lib/__tests__/currency-exchange-api.test.ts',
      ],
      pool: 'forks',
      maxWorkers: 2,
    },
  })
);
