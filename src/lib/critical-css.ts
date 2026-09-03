/// <reference lib="dom" />

/**
 * Système d'extraction et d'injection du CSS critique
 * Le CSS critique est le CSS nécessaire pour le rendu above-the-fold
 *
 * ✅ OPTIMISATION: CSS critique synchronisé avec scripts/extract-critical-css.js
 */

/**
 * CSS critique optimisé pour FCP (First Contentful Paint)
 * Contient uniquement les styles nécessaires pour le rendu above-the-fold
 * Taille cible : < 50KB (actuellement ~2KB)
 *
 * Note: Ce CSS est également extrait automatiquement au build via scripts/extract-critical-css.js
 */
import { criticalCSS } from './critical-css-content';
export { criticalCSS };

/**
 * Injecte le CSS critique dans le <head>
 * À appeler dans main.tsx ou index.html
 */
export function injectCriticalCSS(): void {
  if (typeof document === 'undefined') return;

  // Vérifier si déjà injecté
  const existingStyle = document.getElementById('critical-css');
  if (existingStyle) return;

  // Créer et injecter le style
  const style = document.createElement('style');
  style.id = 'critical-css';
  style.textContent = criticalCSS;
  document.head.insertBefore(style, document.head.firstChild);
}

/**
 * Charge le CSS non-critique de manière asynchrone
 * OPTIMISATION PERFORMANCE: Charge le CSS après le FCP pour améliorer les métriques
 */
export function loadNonCriticalCSS(): void {
  if (typeof document === 'undefined') return;

  // Vérifier si déjà chargé
  if (document.getElementById('non-critical-css-loaded')) return;

  const loadCSS = () => {
    // CSS page-spécifiques (bannières produit, reviews) — hors critical path
    void import('../styles/product-banners.css');
    void import('../styles/reviews-dark-mode.css');
    void import('../styles/reviews-mobile.css');

    document.getElementById('non-critical-css')?.setAttribute('id', 'non-critical-css-loaded');
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadCSS, { timeout: 2000 });
  } else {
    setTimeout(loadCSS, 100);
  }

  const marker = document.createElement('div');
  marker.id = 'non-critical-css';
  marker.style.display = 'none';
  document.body.appendChild(marker);
}
