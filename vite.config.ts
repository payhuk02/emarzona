import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { compression } from "vite-plugin-compression2";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Compression Brotli
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024, // Compresser les fichiers > 1KB
      compressionOptions: {
        level: 11, // Niveau maximum
      },
    }),
    // Compression Gzip (fallback)
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024,
      compressionOptions: {
        level: 9,
      },
    }),
    // Visualizer pour analyser le bundle
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Code splitting avancé
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendors
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          
          // Editor (si utilisé)
          'editor': [
            '@tiptap/core',
            '@tiptap/react',
            '@tiptap/starter-kit',
          ],
          
          // Charts (si utilisé)
          'charts': ['recharts'],
        },
      },
    },
    // Optimisations
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer les console.log en production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // Supprimer ces fonctions
      },
      format: {
        comments: false, // Supprimer tous les commentaires
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500, // Warning si chunk > 500KB
    reportCompressedSize: true,
    sourcemap: false, // Désactiver en production pour réduire la taille
  },
  // Optimisation des dépendances
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
    exclude: ['@tiptap/core', '@tiptap/react'], // Lazy load
  },
});
