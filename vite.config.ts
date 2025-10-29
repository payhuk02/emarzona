import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { compression } from "vite-plugin-compression2";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const hasSentryToken = !!env.SENTRY_AUTH_TOKEN;

  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Visualizer seulement en dev
    !isProduction && visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: false,
      brotliSize: false,
    }),
    
    // Sentry plugin pour source maps (seulement en production avec token)
    isProduction && hasSentryToken && sentryVitePlugin({
      org: env.VITE_SENTRY_ORG,
      project: env.VITE_SENTRY_PROJECT,
      authToken: env.SENTRY_AUTH_TOKEN,
      
      // Upload source maps
      sourcemaps: {
        assets: './dist/**',
        ignore: ['node_modules/**'],
        filesToDeleteAfterUpload: './dist/**/*.map', // Supprimer les .map après upload
      },
      
      // Configuration release
      release: {
        name: env.VERCEL_GIT_COMMIT_SHA || `payhuk-${Date.now()}`,
        deploy: {
          env: env.VERCEL_ENV || 'production',
        },
      },
      
      // Options
      telemetry: false,
      silent: false,
      debug: false,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Code splitting simplifié pour build plus rapide
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendors principaux seulement
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // Optimisations pour vitesse de build
    target: 'es2015',
    minify: 'esbuild', // Plus rapide que terser
    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // Plus tolérant
    reportCompressedSize: false, // Désactivé pour vitesse
    sourcemap: isProduction && hasSentryToken, // Seulement si Sentry configuré
  },
  // Optimisation des dépendances (simplifié)
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
    ],
  },
};
});
