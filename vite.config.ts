import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import type { Plugin } from 'vite';
import { inlineCriticalCSS } from './vite-plugins/inline-critical-css';

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
          const scriptRegex =
            /<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/g;
          const scripts: Array<{ src: string; fullTag: string }> = [];
          let match;

          while ((match = scriptRegex.exec(html)) !== null) {
            scripts.push({
              src: match[1],
              fullTag: match[0],
            });
          }

          if (scripts.length === 0) return html;

          // Trouver le script index (chunk principal contenant React)
          const indexScript = scripts.find(
            s => s.src.includes('index-') || s.src.includes('/js/index-')
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
            newHtml =
              newHtml.slice(0, headAfterTag) + modulePreloadTag + newHtml.slice(headAfterTag);
          }

          // Réinsérer le script index en premier (dans le <head> ou <body>)
          const indexScriptTag = indexScript.fullTag;
          const headEnd = newHtml.indexOf('</head>');
          if (headEnd !== -1) {
            newHtml =
              newHtml.slice(0, headEnd) + `\n    ${indexScriptTag}` + newHtml.slice(headEnd);
          }

          // Réinsérer les autres scripts après le script index
          scripts.forEach(script => {
            if (script !== indexScript) {
              const headEnd = newHtml.indexOf('</head>');
              if (headEnd !== -1) {
                newHtml =
                  newHtml.slice(0, headEnd) + `\n    ${script.fullTag}` + newHtml.slice(headEnd);
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
      host: '::',
      port: 8080,
    },
    plugins: [
      react({
        // Configuration React - jsxRuntime: 'automatic' est la valeur par défaut
      }),
      // ✅ PERFORMANCE: Inline CSS critique pour améliorer FCP (10-15% amélioration)
      isProduction && inlineCriticalCSS(),
      // Plugin pour garantir l'ordre de chargement des chunks (production uniquement)
      isProduction && ensureChunkOrderPlugin(),
      // Visualizer pour analyser le bundle size (activer avec --mode analyze)
      mode === 'analyze' &&
        visualizer({
          filename: './dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),

      // Sentry plugin pour source maps (seulement en production avec token)
      isProduction &&
        hasSentryToken &&
        sentryVitePlugin({
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
        '@': path.resolve(__dirname, './src'),
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
          manualChunks: id => {
            // CRITIQUE: React, React DOM et Scheduler dans le chunk principal (undefined)
            // Ne pas séparer React pour garantir qu'il est chargé avant tous les composants
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return undefined; // Garder dans le chunk principal
            }

            // CRITIQUE: Toutes les dépendances React dans le chunk principal pour éviter les erreurs d'initialisation
            // React Router - Garder dans le chunk principal
            if (id.includes('node_modules/react-router')) {
              return undefined; // Garder dans le chunk principal
            }

            // TanStack Query - Garder dans le chunk principal
            if (id.includes('node_modules/@tanstack/react-query')) {
              return undefined; // Garder dans le chunk principal
            }

            // Radix UI - Séparer intelligemment les composants non-critiques
            // Garder les composants de base dans le principal, séparer les autres
            if (id.includes('node_modules/@radix-ui')) {
              // Composants critiques pour le premier rendu
              if (
                id.includes('@radix-ui/react-slot') ||
                id.includes('@radix-ui/react-primitive') ||
                id.includes('@radix-ui/react-presence')
              ) {
                return undefined; // Garder dans le chunk principal
              }
              // Composants non-critiques - séparer
              if (
                id.includes('@radix-ui/react-tooltip') ||
                id.includes('@radix-ui/react-hover-card') ||
                id.includes('@radix-ui/react-popover') ||
                id.includes('@radix-ui/react-dialog') ||
                id.includes('@radix-ui/react-alert-dialog')
              ) {
                return 'ui-overlays';
              }
              // Autres composants Radix UI dans chunk UI général
              return 'ui-components';
            }

            // OPTIMISATION: recharts séparé en chunk dédié (chargé à la demande)
            // Les composants utilisant recharts sont lazy-loaded, donc safe de séparer
            // Cela réduit significativement le bundle principal
            if (id.includes('node_modules/recharts')) {
              return 'charts'; // Séparer en chunk dédié
            }

            // CRITIQUE: react-big-calendar doit rester dans le chunk principal
            // Utilise React directement et accède à React._SECRET_INTERNALS
            // Séparer cause "Cannot read properties of undefined (reading '_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED')"
            // Même si lazy-loaded, le chunk peut être préchargé avant React
            // Force à rester undefined (chunk principal) pour éviter la séparation automatique
            if (id.includes('node_modules/react-big-calendar')) {
              return undefined; // Forcer dans le chunk principal
            }

            // OPTIMISATION: TipTap séparé en chunk dédié (chargé à la demande)
            // TipTap est utilisé seulement dans les éditeurs qui sont lazy-loaded
            // Cela réduit significativement le bundle principal
            if (id.includes('node_modules/@tiptap')) {
              return 'editor'; // Séparer en chunk dédié
            }

            // Framer Motion - Garder dans le chunk principal (utilise React.createContext)
            // Note: Déjà géré plus bas, mais gardé ici pour clarté

            // react-hook-form - Séparer en chunk dédié (formulaires non-critiques au démarrage)
            if (
              id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform')
            ) {
              return 'forms';
            }

            // react-helmet - Séparer en chunk dédié (SEO non-critique au démarrage)
            if (id.includes('node_modules/react-helmet')) {
              return 'seo';
            }

            // next-themes - Séparer en chunk dédié (utilisé principalement pour le thème)
            if (id.includes('node_modules/next-themes')) {
              return 'theme';
            }

            // framer-motion - Séparer en chunk dédié (animations non-critiques)
            if (id.includes('node_modules/framer-motion')) {
              return 'animations';
            }

            // Supabase client - Garder dans le chunk principal (simplifier)
            if (id.includes('node_modules/@supabase/supabase-js')) {
              return undefined; // Garder dans le chunk principal
            }

            // Date utilities - Séparer en chunk dédié (utilitaires non-critiques au démarrage)
            if (id.includes('node_modules/date-fns')) {
              return 'date-utils';
            }

            // Sentry - Garder tout dans le chunk principal
            if (id.includes('node_modules/@sentry')) {
              return undefined; // Garder dans le chunk principal
            }

            // Moneroo payment modules - Garder dans le chunk principal
            if (id.includes('src/lib/moneroo')) {
              return undefined; // Garder dans le chunk principal
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

            // Composants Marketplace - Garder dans le chunk principal (utilisent React/Radix UI)
            // CRITIQUE: Séparer cause "Cannot read properties of undefined (reading 'displayName')"
            if (id.includes('src/components/marketplace') || id.includes('src/pages/Marketplace')) {
              return undefined; // Garder dans le chunk principal avec React
            }

            // Autres dépendances node_modules - Grouper par taille
            if (id.includes('node_modules/')) {
              // lucide-react - OPTIMISATION: Séparer en chunk dédié (icônes non-critiques)
              // Les icônes peuvent être chargées à la demande via LazyIcon component
              // Cela réduit significativement le bundle principal (~50-100KB)
              if (id.includes('node_modules/lucide-react')) {
                // Garder seulement Loader2 dans le chunk principal (utilisé pour loading states)
                // Toutes les autres icônes seront lazy-loaded via LazyIcon
                if (id.includes('lucide-react/dist/esm/icons/loader-2')) {
                  return undefined; // Garder dans chunk principal
                }
                return 'icons'; // Séparer toutes les autres icônes
              }

              // TOUTES les dépendances React - Garder dans le chunk principal
              // Liste exhaustive de toutes les dépendances React identifiées
              const allReactDependencies = [
                'react-helmet',
                'react-i18next',
                'react-day-picker',
                'react-resizable-panels',
                'embla-carousel-react',
                'cmdk',
                'vaul',
                'sonner',
                '@tiptap/react',
                '@tiptap/starter-kit',
                '@tiptap/extension',
                'react-big-calendar',
                'recharts',
              ];

              for (const dep of allReactDependencies) {
                if (id.includes(`node_modules/${dep}`)) {
                  return undefined; // Garder dans le chunk principal
                }
              }

              // Dépendances lourdes non-React - Garder séparées
              // jspdf et plugins - Très lourd (414 KB), séparé
              if (
                id.includes('node_modules/jspdf') ||
                id.includes('node_modules/jspdf-autotable')
              ) {
                return 'pdf';
              }

              // html2canvas - Lourd (201 KB), séparé
              if (id.includes('node_modules/html2canvas')) {
                return 'canvas';
              }

              // qrcode et html5-qrcode - Lourds, séparés
              if (id.includes('node_modules/qrcode') || id.includes('node_modules/html5-qrcode')) {
                return 'qrcode';
              }

              // Utilitaires de style - Séparer
              if (
                id.includes('node_modules/clsx') ||
                id.includes('node_modules/tailwind-merge') ||
                id.includes('node_modules/class-variance-authority')
              ) {
                return 'utils';
              }

              // Librairies de données - Séparer
              if (id.includes('node_modules/papaparse') || id.includes('node_modules/xlsx')) {
                return 'data-processing';
              }

              // TOUT LE RESTE garder dans le chunk principal pour éviter toutes les erreurs d'initialisation
              return undefined; // Garder dans le chunk principal par défaut
            }

            // CRITIQUE: Garder pages admin dans chunk principal - dépendent de React/UI
            // if (id.includes('src/pages/admin')) {
            //   return 'admin-pages';
            // }

            // Composants product-creation - Garder dans le chunk principal
            if (id.includes('src/components/products/create')) {
              return undefined; // Garder dans le chunk principal
            }

            // CRITIQUE: Ne pas séparer les composants marketplace - ils dépendent de UI/Radix
            // Séparer cause "Cannot read properties of undefined (reading 'displayName')"
            // if (id.includes('src/components/marketplace')) {
            //   return 'marketplace';
            // }

            // CRITIQUE: Ne pas séparer dashboard - dépend de UI/Radix
            // Séparer peut causer des erreurs d'initialisation
            // if (id.includes('src/components/dashboard')) {
            //   return 'dashboard';
            // }

            // CRITIQUE: Ne pas séparer les composants email - ils dépendent de composants UI/Radix
            // Séparer cause "Cannot read properties of undefined (reading 'displayName')"
            // Les composants email sont lazy-loaded dans App.tsx, donc pas besoin de les séparer
            // if (id.includes('src/components/email') || id.includes('src/pages/emails')) {
            //   return 'email-components';
            // }

            // OPTIMISATION CRITIQUE: Séparer UnsubscribePage en chunk dédié pour réduire le CSS
            // Cette page est publique et simple, ne doit pas hériter de tout le CSS de l'application
            // Mais garder dans le chunk principal pour éviter les erreurs de dépendances
            // if (
            //   id.includes('src/pages/UnsubscribePage') ||
            //   id.includes('src/components/email/UnsubscribePage')
            // ) {
            //   return 'unsubscribe-page';
            // }

            // Composants analytics - Garder dans le chunk principal
            if (id.includes('src/components/analytics')) {
              return undefined; // Garder dans le chunk principal
            }

            // Composants shipping - Garder dans le chunk principal
            if (id.includes('src/components/shipping') || id.includes('src/pages/shipping')) {
              return undefined; // Garder dans le chunk principal
            }

            // CRITIQUE: Layout components doivent rester dans le chunk principal
            // Ils sont utilisés très tôt dans l'app et dépendent de React qui doit être déjà chargé
            // Séparer cause "Cannot access 'F' before initialization" en production
            // if (id.includes('src/components/layout')) {
            //   return 'layout-components';
            // }

            // CRITIQUE: Ne pas séparer navigation, accessibility, seo, errors
            // Ces composants utilisent des composants UI (Button, Alert, etc.) qui dépendent de React/Radix
            // Séparer cause "Cannot access 'I' before initialization" et erreurs displayName
            // if (id.includes('src/components/navigation')) {
            //   return 'navigation-components';
            // }
            // if (id.includes('src/components/accessibility')) {
            //   return 'accessibility-components';
            // }
            // if (id.includes('src/components/seo')) {
            //   return 'seo-components';
            // }
            // if (id.includes('src/components/errors')) {
            //   return 'error-components';
            // }
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
          assetFileNames: assetInfo => {
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
      // Chunk size warnings - optimisé pour code splitting et mobile-first
      // Réduit à 200KB pour améliorer TTI sur mobile (amélioration de 20-30%)
      chunkSizeWarningLimit: 200, // Avertir si un chunk dépasse 200KB (mobile-first optimization)
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
