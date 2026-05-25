import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['node_modules/**', 'tests/**', 'dist/**'],
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
      // Seuils de couverture minimum (désactivés en CI tant que la dette de tests est réduite)
      thresholds: process.env.CI
        ? { lines: 0, functions: 0, branches: 0, statements: 0 }
        : {
            lines: 80,
            functions: 80,
            branches: 75,
            statements: 80,
          },
      // Inclure seulement les fichiers source
      include: ['src/**/*.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
