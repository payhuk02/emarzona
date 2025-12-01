// CRITIQUE: Importer React explicitement en premier pour garantir qu'il est disponible
// avant tous les autres imports qui pourraient utiliser React.forwardRef ou React.memo
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/product-banners.css";
import "./styles/reviews-dark-mode.css";
import "./styles/reviews-mobile.css";
import { setupGlobalErrorHandlers } from "./lib/error-logger";
import { installConsoleGuard } from "./lib/console-guard";
import { initAPMMonitoring } from "./lib/apm-monitoring";
import { initCDNConnections } from "./lib/cdn-config";
import { initAccessibility } from "./lib/accessibility";
import { logger } from "./lib/logger";
import "./i18n/config"; // Initialiser i18n
import { validateEnv } from "./lib/env-validator";
import { clearPayhukLogoCache, clearAllPayhukReferences } from "./utils/clearPayhukLogoCache";

// Nettoyer le cache localStorage contenant l'ancien logo Payhuk
clearPayhukLogoCache();
clearAllPayhukReferences();

// Valider les variables d'environnement au démarrage
try {
  validateEnv();
  logger.info("✅ Variables d'environnement validées");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error("❌ Erreur de validation des variables d'environnement", { error: errorMessage });
  // En production, on ne peut pas continuer sans les variables requises
  if (import.meta.env.PROD) {
    throw error;
  }
}

// Install console guard first to neutralize console.* in production
installConsoleGuard();

// Setup global error handlers
setupGlobalErrorHandlers();

// Initialiser le monitoring APM
initAPMMonitoring();

// Initialiser les connexions CDN
initCDNConnections();

// Initialiser l'accessibilité
initAccessibility();

// Register Service Worker for PWA (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Toujours récupérer la dernière version du SW
    }).catch((error) => {
      logger.warn('Service Worker registration failed', { error });
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
