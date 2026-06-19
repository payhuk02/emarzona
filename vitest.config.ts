import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const isCiExecution =
  process.env.CI === 'true' ||
  process.env.CI === '1' ||
  process.argv.some(arg => arg.includes('vitest.ci.config.ts'));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['node_modules/**', 'tests/**', 'dist/**'],
    // Réduit les crashs worker (OOM) sur Windows / gros suites RTL
    pool: 'forks',
    maxWorkers: process.env.CI ? 4 : 2,
    minWorkers: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/*.test.{ts,tsx}',
        'src/integrations/supabase/types.ts', // Fichier généré
      ],
      // Seuils de couverture minimum
      thresholds: isCiExecution
        ? { lines: 40, functions: 40, branches: 40, statements: 40 }
        : {
            lines: 80,
            functions: 80,
            branches: 75,
            statements: 80,
          },
      // Scope couverture: complet en local, critique + commerce en mode CI
      include: isCiExecution
        ? [
            'src/lib/checkout/**/*.{ts,tsx}',
            'src/lib/payments/**/*.{ts,tsx}',
            'src/lib/cart/cart-data.ts',
            'src/lib/orders/customers-data.ts',
            'src/lib/orders/orders-data.ts',
            'src/lib/orders/order-status.ts',
            'src/lib/orders/resolve-order-number.ts',
            'src/lib/shipping/fedex-policy.ts',
            'src/lib/shipping/fedex-rates-client.ts',
            'src/lib/shipping/fedex-ship-client.ts',
            'src/lib/shipping/fedex-track-client.ts',
            'src/lib/shipping/fedex-cancel-client.ts',
            'src/hooks/useRequire2FA.ts',
          ]
        : ['src/**/*.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
