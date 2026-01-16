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
export const criticalCSS = `
/* Variables CSS critiques - Minimales pour FCP */
:root {
  --background: 0 0% 100%;
  --foreground: 220 40% 10%;
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --border: 0 0% 90%;
  --radius: 0.5rem;
}

/* Reset minimal */
*,::before,::after {
  box-sizing: border-box;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size: 1rem;
  line-height: 1.625;
  margin: 0;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  overflow-x: hidden;
}

#root {
  min-height: 100vh;
}

/* Container minimal */
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Typographie critique */
h1,h2,h3 {
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
}

/* Images critiques */
img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Boutons critiques */
button {
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
}

/* Focus visible */
*:focus-visible {
  outline: 3px solid hsl(var(--primary));
  outline-offset: 2px;
}
`;

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

  // Utiliser requestIdleCallback pour charger après les tâches critiques
  const loadCSS = () => {
    // NOTE: Le CSS sidebar-optimized.css est déjà importé dans index.css
    // Vite le bundle automatiquement, donc pas besoin de le charger séparément
    // Cette fonction est conservée pour d'éventuels futurs CSS non-critiques

    // Marquer comme chargé
    document.getElementById('non-critical-css')?.setAttribute('id', 'non-critical-css-loaded');
  };

  // Charger immédiatement si requestIdleCallback n'est pas disponible
  // Sinon, attendre que le navigateur soit idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadCSS, { timeout: 2000 });
  } else {
    // Fallback pour les navigateurs qui ne supportent pas requestIdleCallback
    setTimeout(loadCSS, 100);
  }

  // Créer un élément pour marquer le chargement
  const marker = document.createElement('div');
  marker.id = 'non-critical-css';
  marker.style.display = 'none';
  document.body.appendChild(marker);
}
