import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Configuration plus robuste pour éviter les erreurs React
          if (id.includes('node_modules')) {
            // React core - doit être dans le même chunk
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Radix UI - séparé mais après React
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Autres dépendances importantes
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('@tanstack')) {
              return 'query';
            }
            if (id.includes('@tiptap')) {
              return 'editor';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority') || id.includes('@hookform')) {
              return 'utils';
            }
            // Autres dépendances
            return 'vendor';
          }
          
          // Code de l'application
          if (id.includes('/src/pages/')) {
            return 'pages';
          }
          if (id.includes('/src/components/')) {
            return 'components';
          }
          if (id.includes('/src/hooks/')) {
            return 'hooks';
          }
          if (id.includes('/src/lib/')) {
            return 'lib';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    sourcemap: mode === 'development',
    target: 'esnext',
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react/jsx-runtime'
    ],
    exclude: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
    force: true
  },
}));
