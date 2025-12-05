import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import type { Plugin } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const hasSentryToken = !!env.SENTRY_AUTH_TOKEN;

  // Plugin personnalisé pour garantir l'ordre de chargement des chunks
  // CRITIQUE: Le chunk principal (index) doit être chargé et exécuté AVANT tous les autres chunks
  // Cela évite l'erreur "Cannot read properties of undefined (reading 'forwardRef')"
  const ensureChunkOrderPlugin = (): Plugin => {
    return {
      name: 'ensure-chunk-order',
      transformIndexHtml: {
        order: 'post',
        handler(html, ctx) {
          if (!isProduction) return html;
          
          // Extraire tous les scripts modules
          const scriptRegex = /<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/g;
          const scripts: Array<{ src: string; fullTag: string }> = [];
          let match;
          
          while ((match = scriptRegex.exec(html)) !== null) {
            scripts.push({
              src: match[1],
              fullTag: match[0]
            });
          }
          
          if (scripts.length === 0) return html;
          
          // Trouver le script index (chunk principal contenant React)
          const indexScript = scripts.find(s => 
            s.src.includes('index-') || s.src.includes('/js/index-')
          );
          
          if (!indexScript) return html;
          
          // Retirer tous les scripts de l'HTML
          let newHtml = html;
          scripts.forEach(script => {
            newHtml = newHtml.replace(script.fullTag, '');
          });
          
          // Ajouter modulepreload pour le chunk principal au début du <head>
          // Cela garantit que React est préchargé avant tous les autres chunks
          const modulePreloadTag = `    <link rel="modulepreload" href="${indexScript.src}">\n`;
          const headStart = newHtml.indexOf('<head>');
          if (headStart !== -1) {
            const headAfterTag = newHtml.indexOf('>', headStart) + 1;
            newHtml = newHtml.slice(0, headAfterTag) + modulePreloadTag + newHtml.slice(headAfterTag);
          }
          
          // Réinsérer le script index en premier (dans le <head> ou <body>)
          const indexScriptTag = indexScript.fullTag;
          const headEnd = newHtml.indexOf('</head>');
          if (headEnd !== -1) {
            newHtml = newHtml.slice(0, headEnd) + `\n    ${indexScriptTag}` + newHtml.slice(headEnd);
          }
          
          // Réinsérer les autres scripts après le script index
          scripts.forEach(script => {
            if (script !== indexScript) {
              const headEnd = newHtml.indexOf('</head>');
              if (headEnd !== -1) {
                newHtml = newHtml.slice(0, headEnd) + `\n    ${script.fullTag}` + newHtml.slice(headEnd);
              }
            }
          });
          
          return newHtml;
        },
      },
    };
  };

  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      // Configuration React - jsxRuntime: 'automatic' est la valeur par défaut
    }),
    // Plugin pour garantir l'ordre de chargement des chunks (production uniquement)
    isProduction && ensureChunkOrderPlugin(),
    // Visualizer pour analyser le bundle size (activer avec --mode analyze)
    mode === 'analyze' && visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
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
        name: env.VERCEL_GIT_COMMIT_SHA || `emarzona-${Date.now()}`,
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
    // Préserver les extensions pour éviter les conflits
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    // Dédupliquer React et Scheduler pour éviter les problèmes d'initialisation
    dedupe: ['react', 'react-dom', 'scheduler'],
  },
  build: {
    rollupOptions: {
      // CRITIQUE: 'strict' garantit l'ordre de chargement des chunks
      // React sera chargé avant tous les chunks qui en dépendent (Radix UI, etc.)
      preserveEntrySignatures: 'strict',
      output: {
        // Code splitting réactivé avec stratégie optimisée
        // IMPORTANT: React doit rester dans le chunk principal pour éviter l'erreur forwardRef sur Vercel
        // Séparation intelligente des chunks pour améliorer les performances
        // Amélioration: Réduction du bundle initial de ~40-60%
        manualChunks: (id) => {
          // CRITIQUE: React, React DOM et Scheduler dans le chunk principal (undefined)
          // Ne pas séparer React pour garantir qu'il est chargé avant tous les composants
          if (
            id.includes('node_modules/react/') || 
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return undefined; // Garder dans le chunk principal
          }
          
          // React Router - Garder dans le chunk principal avec React
          if (id.includes('node_modules/react-router')) {
            return undefined;
          }
          
          // TanStack Query - Garder dans le chunk principal avec React
          if (id.includes('node_modules/@tanstack/react-query')) {
            return undefined;
          }
          
          // Radix UI - Garder dans le chunk principal (utilise React.forwardRef)
          // CRITIQUE: Radix UI utilise React.forwardRef et doit être chargé avec React
          // pour éviter l'erreur "Cannot read properties of undefined (reading 'forwardRef')"
          if (id.includes('node_modules/@radix-ui')) {
            return undefined; // Garder dans le chunk principal avec React
          }
          
          // Composants lourds - Charts - Séparer en chunk dédié (peut être lazy-loaded)
          // Recharts est lourd (350KB) et peut être chargé à la demande pour les pages analytics
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          
          // Composants lourds - Calendrier - Séparer en chunk dédié (peut être lazy-loaded)
          // react-big-calendar est lourd et peut être chargé à la demande
          if (id.includes('node_modules/react-big-calendar')) {
            return 'calendar';
          }
          
          // Éditeurs de texte riches - Garder dans le chunk principal (utilise React.useLayoutEffect)
          // TipTap utilise React hooks et doit être chargé avec React
          if (id.includes('node_modules/@tiptap')) {
            return undefined; // Garder dans le chunk principal avec React
          }
          
          // Framer Motion - Garder dans le chunk principal (utilise React.createContext)
          // Note: Déjà géré plus bas, mais gardé ici pour clarté
          
          // react-hook-form - Garder dans le chunk principal (utilisé partout)
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform')) {
            return undefined;
          }
          
          // CRITIQUE: Toutes les dépendances qui utilisent React doivent rester dans le chunk principal
          // pour éviter l'erreur "Cannot read properties of undefined (reading 'createContext')"
          
          // next-themes utilise React Context - Garder dans le chunk principal
          if (id.includes('node_modules/next-themes')) {
            return undefined;
          }
          
          // framer-motion utilise React - Garder dans le chunk principal
          if (id.includes('node_modules/framer-motion')) {
            return undefined;
          }
          
          // Supabase client - Séparer en chunk dédié (ne dépend pas de React)
          // Note: @supabase/supabase-js est pure JS, pas de React
          if (id.includes('node_modules/@supabase/supabase-js')) {
            return 'supabase';
          }
          
          // Date utilities - Séparer en chunk dédié (ne dépend pas de React)
          // Note: date-fns est pure JS, pas de React
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          
          // Sentry (monitoring) - Garder dans le chunk principal (utilise React)
          if (id.includes('node_modules/@sentry/react')) {
            return undefined;
          }
          
          // Sentry autres packages - Séparer
          if (id.includes('node_modules/@sentry')) {
            return 'monitoring';
          }
          
          // Moneroo payment modules - Code splitting pour optimiser le bundle
          if (id.includes('src/lib/moneroo')) {
            return 'moneroo';
          }
          
          // Pages Admin - Garder dans le chunk principal (utilisent React.createContext)
          // CRITIQUE: Les pages admin utilisent React et doivent être chargées avec React
          // pour éviter l'erreur "Cannot read properties of undefined (reading 'createContext')"
          // Note: Ces pages sont lazy-loaded dans App.tsx, donc elles ne sont chargées qu'à la demande
          // mais elles doivent avoir accès à React quand elles sont chargées
          if (id.includes('src/pages/admin')) {
            return undefined; // Garder dans le chunk principal avec React
          }
          
          // Composants Courses - Garder dans le chunk principal (utilisent React)
          // CRITIQUE: Les composants courses utilisent React et doivent être chargés avec React
          if (id.includes('src/components/courses') || id.includes('src/pages/courses')) {
            return undefined; // Garder dans le chunk principal avec React
          }
          
          // Composants Digital - Garder dans le chunk principal (utilisent React)
          // CRITIQUE: Les composants digital utilisent React et doivent être chargés avec React
          if (id.includes('src/components/digital') || id.includes('src/pages/digital')) {
            return undefined; // Garder dans le chunk principal avec React
          }
          
          // Composants Physical - Garder dans le chunk principal (utilisent React)
          // CRITIQUE: Les composants physical utilisent React et doivent être chargés avec React
          if (id.includes('src/components/physical') || id.includes('src/pages/physical')) {
            return undefined; // Garder dans le chunk principal avec React
          }
          
          // Composants Service - Garder dans le chunk principal (utilisent React)
          // CRITIQUE: Les composants service utilisent React et doivent être chargés avec React
          if (id.includes('src/components/service') || id.includes('src/pages/service')) {
            return undefined; // Garder dans le chunk principal avec React
          }
          
          // Autres dépendances node_modules - Grouper par taille
          if (id.includes('node_modules/')) {
            // CRITIQUE: lucide-react doit rester dans le chunk principal avec React
            // pour éviter l'erreur "Cannot read properties of undefined (reading 'forwardRef')"
            // lucide-react utilise forwardRef de React et doit être chargé après React
            if (id.includes('node_modules/lucide-react')) {
              return undefined; // Garder dans le chunk principal avec React
            }
            
            // Dépendances React qui peuvent être séparées (lazy-loaded)
            // Ces dépendances sont lourdes et utilisées seulement sur certaines pages
            const lazyLoadableReactDeps = [
              'react-big-calendar', // Calendrier - séparé en chunk 'calendar'
              'recharts', // Graphiques - séparé en chunk 'charts'
            ];
            
            // Vérifier si c'est une dépendance qui peut être lazy-loaded
            for (const dep of lazyLoadableReactDeps) {
              if (id.includes(`node_modules/${dep}`)) {
                // Déjà géré plus haut, continuer
                continue;
              }
            }
            
            // Dépendances React critiques qui doivent rester dans le chunk principal
            // (utilisées partout et nécessaires au démarrage)
            const criticalReactDependencies = [
              'react-helmet',
              'react-i18next',
              'react-day-picker',
              'react-resizable-panels',
              'embla-carousel-react', // Utilise React
              'cmdk', // Utilise React
              'vaul', // Utilise React
              'sonner', // Utilise React
              '@tiptap/react', // Utilise React.useLayoutEffect
              '@tiptap/starter-kit', // Dépend de @tiptap/react
              '@tiptap/extension', // Extensions TipTap
            ];
            
            for (const dep of criticalReactDependencies) {
              if (id.includes(`node_modules/${dep}`)) {
                return undefined; // Garder dans le chunk principal
              }
            }
            
            // dompurify - Séparer (ne dépend pas de React, utilisé pour sanitization)
            if (id.includes('node_modules/dompurify')) {
              return 'sanitization';
            }
            
            // lovable-tagger - Séparer si possible (vérifier si utilise React)
            if (id.includes('node_modules/lovable-tagger')) {
              return 'tagging';
            }
            
            // Zod - Séparer (ne dépend pas de React)
            if (id.includes('node_modules/zod')) {
              return 'validation';
            }
            
            // Dépendances lourdes non-React - Séparer en chunks dédiés
            // jspdf et plugins - Très lourd (414 KB), charger seulement quand nécessaire
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/jspdf-autotable')) {
              return 'pdf';
            }
            
            // html2canvas - Lourd (201 KB), charger seulement pour les exports
            if (id.includes('node_modules/html2canvas')) {
              return 'canvas';
            }
            
            // papaparse - CSV parsing, charger seulement pour les imports/exports
            if (id.includes('node_modules/papaparse')) {
              return 'csv';
            }
            
            // file-saver - Export de fichiers, charger seulement quand nécessaire
            if (id.includes('node_modules/file-saver')) {
              return 'file-utils';
            }
            
            // qrcode et html5-qrcode - Scanner QR, charger seulement pour les fonctionnalités QR
            if (id.includes('node_modules/qrcode') || id.includes('node_modules/html5-qrcode')) {
              return 'qrcode';
            }
            
            // browser-image-compression - Compression d'images, charger seulement pour uploads
            if (id.includes('node_modules/browser-image-compression')) {
              return 'image-utils';
            }
            
            // i18next et plugins - Internationalisation, peut être chargé séparément
            if (id.includes('node_modules/i18next') || 
                id.includes('node_modules/i18next-') ||
                id.includes('node_modules/react-i18next')) {
              return 'i18n';
            }
            
            // Dépendances utilitaires non-React - Séparer en chunks dédiés
            // lodash - Séparer (ne dépend pas de React)
            if (id.includes('node_modules/lodash')) {
              return 'utils';
            }
            
            // classnames/clsx - Séparer (ne dépend pas de React)
            if (id.includes('node_modules/clsx') || id.includes('node_modules/classnames')) {
              return 'utils';
            }
            
            // nanoid - Séparer (ne dépend pas de React)
            if (id.includes('node_modules/nanoid')) {
              return 'utils';
            }
            
            // CRITIQUE: Par défaut, garder TOUTES les dépendances node_modules dans le chunk principal
            // pour éviter les erreurs React (forwardRef, createContext, useLayoutEffect, etc.)
            // Seules les dépendances explicitement identifiées comme non-React peuvent être séparées
            // Cette approche conservative garantit que React est toujours disponible
            return undefined; // Garder dans le chunk principal par défaut
          }
          
          // Séparer les pages admin en chunk dédié (lazy-loaded)
          // OPTIMISATION: Séparer les pages admin pour réduire le chunk principal
          if (id.includes('src/pages/admin')) {
            return 'admin-pages';
          }
          
          // Séparer les composants de création de produits en chunk dédié
          if (id.includes('src/components/products/create')) {
            return 'product-creation';
          }
          
          // Séparer les composants de marketplace en chunk dédié
          if (id.includes('src/components/marketplace')) {
            return 'marketplace';
          }
          
          // Séparer les composants de dashboard en chunk dédié
          if (id.includes('src/components/dashboard')) {
            return 'dashboard';
          }
          
          // OPTIMISATION: Séparer les composants d'email (lourds, utilisés seulement sur certaines pages)
          if (id.includes('src/components/email') || id.includes('src/pages/emails')) {
            return 'email-components';
          }
          
          // OPTIMISATION: Séparer les composants d'analytics (lourds avec recharts)
          if (id.includes('src/components/analytics')) {
            return 'analytics-components';
          }
          
          // OPTIMISATION: Séparer les composants de shipping (utilisés seulement sur certaines pages)
          if (id.includes('src/components/shipping') || id.includes('src/pages/shipping')) {
            return 'shipping-components';
          }
        },
        // Optimisation des noms de chunks
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/index-[hash].js',
        // Format ES modules
        format: 'es',
        // Ne pas inliner les imports dynamiques (code splitting activé)
        inlineDynamicImports: false,
        // IMPORTANT: Ne pas utiliser generatedCode.constBindings: false
        // Cela peut causer des problèmes d'initialisation
        // Laisser les const bindings par défaut pour garantir l'ordre d'initialisation
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Optimisations pour vitesse de build
    target: 'esnext', // Utiliser esnext pour un build plus rapide (Vercel supporte esnext)
    minify: 'esbuild', // Plus rapide que terser (2-3x plus rapide)
    // Chunk size warnings - optimisé pour code splitting
    chunkSizeWarningLimit: 300, // Avertir si un chunk dépasse 300KB (code splitting activé) - Plus strict
    reportCompressedSize: !isProduction, // Désactivé en production pour accélérer le build
    sourcemap: isProduction && hasSentryToken, // Seulement si Sentry configuré
    // Optimisations supplémentaires
    cssCodeSplit: true, // Split CSS par chunk
    cssMinify: true, // Minifier le CSS
    // Tree shaking - optimisé pour vitesse et stabilité
    treeshake: {
      moduleSideEffects: 'no-external', // Préserver les side effects internes
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false, // Désactivé pour accélérer le build
      preserveComments: false,
      // Optimisations agressives pour accélérer le build
      unknownGlobalSideEffects: false, // Supposer que les globals n'ont pas de side effects
    },
    // CommonJS options pour éviter les problèmes de référence circulaire
    commonjsOptions: {
      transformMixedEsModules: true,
      strictRequires: false, // Désactiver pour éviter les problèmes d'ordre
    },
  },
  // Optimisation des dépendances (amélioré)
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'scheduler', // CRITIQUE: Inclure scheduler pour Radix UI
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react', // CRITIQUE: Inclure lucide-react pour éviter l'erreur forwardRef
      'date-fns',
      'zod',
      'react-hook-form',
      '@hookform/resolvers',
      // Forcer l'inclusion des dépendances CommonJS problématiques
      'hoist-non-react-statics',
      // Forcer l'inclusion des dépendances de carousel
      'embla-carousel-autoplay',
      'embla-carousel-react',
      // Forcer l'inclusion de toutes les dépendances Radix UI
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
    ],
    // Exclure les dépendances qui causent des problèmes
    exclude: ['@sentry/react'],
    // Forcer la transformation ESM pour les modules CommonJS
    esbuildOptions: {
      target: 'es2015',
      format: 'esm',
      supported: {
        'top-level-await': true,
      },
      // Forcer la transformation CommonJS vers ESM
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
    // Forcer la transformation CommonJS seulement si nécessaire
    force: false, // Ne pas forcer la re-optimisation à chaque build (accélère le build)
  },
};
});
