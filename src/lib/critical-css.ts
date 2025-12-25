/**
 * Système d'extraction et d'injection du CSS critique
 * Le CSS critique est le CSS nécessaire pour le rendu above-the-fold
 */

/**
 * CSS critique pour le rendu initial
 * Contient uniquement les styles nécessaires pour le First Contentful Paint
 */
export const criticalCSS = `
/* Variables CSS critiques */
:root {
  --background: 0 0% 100%;
  --foreground: 220 40% 10%;
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --border: 0 0% 90%;
  --radius: 0.5rem;
}

/* Reset de base */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 1rem;
  line-height: 1.625;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  overscroll-behavior: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  overflow-x: hidden;
  max-width: 100vw;
}

#root {
  min-height: 100vh;
  overflow-x: hidden;
  max-width: 100vw;
}

/* Container de base */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Typographie de base */
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.2;
}

/* Images */
img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Boutons de base */
button {
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
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
    // Charger le CSS du sidebar de manière asynchrone (non-critique)
    const sidebarCSS = document.createElement('link');
    sidebarCSS.rel = 'stylesheet';
    sidebarCSS.href = '/src/styles/sidebar-optimized.css';
    sidebarCSS.media = 'print';
    sidebarCSS.onload = () => {
      sidebarCSS.media = 'all';
    };
    document.head.appendChild(sidebarCSS);

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
