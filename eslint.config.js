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
      "*.d.ts"
    ]
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
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
      // Bloquer console.* pour forcer l'utilisation du logger
      // IMPORTANT: Utilisez logger.* de @/lib/logger au lieu de console.*
      // Le logger envoie automatiquement les erreurs à Sentry en production
      "no-console": "error", // Aucun console.* autorisé - utilisez logger.*
    },
  },
  // Exception pour console-guard.ts qui DOIT utiliser console.* pour les remplacer
  {
    files: ["src/lib/console-guard.ts"],
    rules: {
      "no-console": "off", // Console.* nécessaire dans ce fichier
    },
  },
);
