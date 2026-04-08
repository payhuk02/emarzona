import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import type { Plugin } from 'vite';
import { inlineCriticalCSS } from './vite-plugins/inline-critical-css';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const hasSentryToken = !!env.SENTRY_AUTH_TOKEN;
  const publicBackendUrl = env.VITE_SUPABASE_URL || 'https://hbdnzajbyjakdhuavrvb.supabase.co';
  const publicBackendKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM';
  const publicBackendProjectId = env.VITE_SUPABASE_PROJECT_ID || 'hbdnzajbyjakdhuavrvb';

  // Garantit l'ordre de chargement : index (React) avant les autres chunks
  const ensureChunkOrderPlugin = (): Plugin => ({
    name: 'ensure-chunk-order',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (!isProduction) return html;

        const scriptRegex = /<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/g;
        const scripts: Array<{ src: string; fullTag: string }> = [];
        let match;
        while ((match = scriptRegex.exec(html)) !== null) {
          scripts.push({ src: match[1], fullTag: match[0] });
        }
        if (scripts.length === 0) return html;

        const indexScript = scripts.find(s => s.src.includes('index-'));
        if (!indexScript) return html;

        let newHtml = html;
        scripts.forEach(s => { newHtml = newHtml.replace(s.fullTag, ''); });

        const headStart = newHtml.indexOf('<head>');
        if (headStart !== -1) {
          const headAfterTag = newHtml.indexOf('>', headStart) + 1;
          newHtml = newHtml.slice(0, headAfterTag) +
            `\n    <link rel="modulepreload" href="${indexScript.src}">` +
            newHtml.slice(headAfterTag);
        }

        let headEnd = newHtml.indexOf('</head>');
        if (headEnd !== -1) {
          newHtml = newHtml.slice(0, headEnd) + `\n    ${indexScript.fullTag}` + newHtml.slice(headEnd);
        }

        scripts.forEach(s => {
          if (s !== indexScript) {
            headEnd = newHtml.indexOf('</head>');
            if (headEnd !== -1) {
              newHtml = newHtml.slice(0, headEnd) + `\n    ${s.fullTag}` + newHtml.slice(headEnd);
            }
          }
        });

        return newHtml;
      },
    },
  });

  // Chunks dédiés pour les dépendances lourdes non-critiques
  const SEPARATED_CHUNKS: Record<string, string[]> = {
    charts: ['recharts'],
    editor: ['@tiptap'],
    forms: ['react-hook-form', '@hookform'],
    animations: ['framer-motion'],
    'date-utils': ['date-fns'],
    pdf: ['jspdf', 'jspdf-autotable'],
    canvas: ['html2canvas'],
    qrcode: ['qrcode', 'html5-qrcode'],
    utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
    'data-processing': ['papaparse', 'xlsx'],
    icons: ['lucide-react'],
    seo: ['react-helmet'],
    theme: ['next-themes'],
  };

  return {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(publicBackendUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(publicBackendKey),
      'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify(publicBackendProjectId),
    },
    server: { host: '::', port: 8080 },
    plugins: [
      react(),
      isProduction && inlineCriticalCSS(),
      isProduction && ensureChunkOrderPlugin(),
      mode === 'analyze' && visualizer({ filename: './dist/stats.html', open: true, gzipSize: true, brotliSize: true }),
      isProduction && hasSentryToken && sentryVitePlugin({
        org: env.VITE_SENTRY_ORG,
        project: env.VITE_SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN,
        sourcemaps: { assets: './dist/**', ignore: ['node_modules/**'], filesToDeleteAfterUpload: './dist/**/*.map' },
        release: { name: env.VERCEL_GIT_COMMIT_SHA || `emarzona-${Date.now()}`, deploy: { env: env.VERCEL_ENV || 'production' } },
        telemetry: false, silent: false, debug: false,
      }),
    ].filter(Boolean),
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
      dedupe: ['react', 'react-dom', 'scheduler'],
    },
    build: {
      rollupOptions: {
        preserveEntrySignatures: 'strict',
        output: {
          manualChunks: id => {
            if (!id.includes('node_modules/')) return undefined;

            // Lucide: seul Loader2 reste dans le principal
            if (id.includes('lucide-react')) {
              return id.includes('icons/loader-2') ? undefined : 'icons';
            }

            // Chunks séparés pour dépendances lourdes
            for (const [chunkName, patterns] of Object.entries(SEPARATED_CHUNKS)) {
              if (chunkName === 'icons') continue; // déjà géré
              if (patterns.some(p => id.includes(`node_modules/${p}`))) {
                return chunkName;
              }
            }

            // Tout le reste dans le chunk principal (React, Radix, Supabase, etc.)
            return undefined;
          },
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/index-[hash].js',
          format: 'es',
          inlineDynamicImports: false,
          assetFileNames: assetInfo => {
            const ext = assetInfo.name?.split('.').pop() || '';
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) return 'images/[name]-[hash][extname]';
            if (/woff2?|eot|ttf|otf/i.test(ext)) return 'fonts/[name]-[hash][extname]';
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      target: 'esnext',
      minify: 'esbuild',
      chunkSizeWarningLimit: 200,
      reportCompressedSize: !isProduction,
      sourcemap: isProduction && hasSentryToken,
      cssCodeSplit: true,
      cssMinify: true,
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        preserveComments: false,
        unknownGlobalSideEffects: false,
      },
      commonjsOptions: { transformMixedEsModules: true, strictRequires: false },
    },
    optimizeDeps: {
      include: [
        'react', 'react-dom', 'scheduler', 'react-router-dom',
        '@tanstack/react-query', '@supabase/supabase-js', 'lucide-react',
        'date-fns', 'zod', 'react-hook-form', '@hookform/resolvers',
        'embla-carousel-autoplay', 'embla-carousel-react',
        '@radix-ui/react-accordion', '@radix-ui/react-alert-dialog',
        '@radix-ui/react-aspect-ratio', '@radix-ui/react-avatar',
        '@radix-ui/react-checkbox', '@radix-ui/react-collapsible',
        '@radix-ui/react-context-menu', '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card',
        '@radix-ui/react-label', '@radix-ui/react-menubar',
        '@radix-ui/react-navigation-menu', '@radix-ui/react-popover',
        '@radix-ui/react-progress', '@radix-ui/react-radio-group',
        '@radix-ui/react-scroll-area', '@radix-ui/react-select',
        '@radix-ui/react-separator', '@radix-ui/react-slider',
        '@radix-ui/react-slot', '@radix-ui/react-switch',
        '@radix-ui/react-tabs', '@radix-ui/react-toast',
        '@radix-ui/react-toggle', '@radix-ui/react-toggle-group',
        '@radix-ui/react-tooltip',
      ],
      exclude: ['@sentry/react'],
      esbuildOptions: {
        target: 'es2015',
        format: 'esm',
        supported: { 'top-level-await': true },
        mainFields: ['module', 'jsnext:main', 'jsnext'],
      },
      force: false,
    },
  };
});
