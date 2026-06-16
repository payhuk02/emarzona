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
        ? { lines: 0, functions: 0, branches: 0, statements: 0 }
        : {
            lines: 80,
            functions: 80,
            branches: 75,
            statements: 80,
          },
      // Scope couverture: complet en local, critique en mode CI
      include: isCiExecution
        ? [
            'src/lib/checkout/**/*.{ts,tsx}',
            'src/lib/payments/**/*.{ts,tsx}',
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
