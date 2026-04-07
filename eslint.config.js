import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { 
    ignores: [
      "dist",
      "node_modules",
      "build",
      ".vercel",
      "**/*.config.{js,ts}",
      "scripts/**",
      "supabase/**",
      "supabase/functions/**",
      "*.d.ts",
      // Fichier généré (très gros) - certains environnements le détectent comme binaire
      "src/integrations/supabase/types.ts"
    ]
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Prevent unused variables; ignore variables starting with _ (common pattern)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],
      // Avertir sur console.* mais ne pas bloquer (console-guard redirige vers logger)
      // IMPORTANT: Utilisez logger.* de @/lib/logger au lieu de console.*
      // Le logger envoie automatiquement les erreurs à Sentry en production
      // Note: console-guard.ts redirige tous les appels console.* vers logger en runtime
      "no-console": "warn", // Avertir mais ne pas bloquer (console-guard gère la redirection)
      // Tous les types any ont été nettoyés, on peut maintenant bloquer strictement
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-require-imports": "error", // Toujours bloquer require()
    },
  },
  // Exception pour console-guard.ts qui DOIT utiliser console.* pour les remplacer
  {
    files: ["src/lib/console-guard.ts"],
    rules: {
      "no-console": "off", // Console.* nécessaire dans ce fichier
    },
  },
  // Exception pour les fixtures Playwright qui utilisent le pattern 'use' mais ne sont pas des React Hooks
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
    rules: {
      "react-hooks/rules-of-hooks": "off", // Playwright fixtures ne sont pas des React Hooks
    },
  },
  // Exception pour useStoreAffiliates.ts - les hooks sont toujours appelés inconditionnellement
  {
    files: ["src/hooks/useStoreAffiliates.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off", // Faux positifs - hooks toujours appelés inconditionnellement
    },
  },
);
