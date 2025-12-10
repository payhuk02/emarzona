/**
 * StoreThemeProvider
 * Injecte les styles CSS dynamiques basés sur les personnalisations de la boutique
 * Utilise des CSS variables pour permettre une personnalisation complète
 */

import { useEffect, useRef } from 'react';
import { useStoreTheme, getBorderRadiusValue, getShadowValue, type StoreTheme } from '@/hooks/useStoreTheme';
import type { Store } from '@/hooks/useStores';

interface StoreThemeProviderProps {
  store: Store | null;
  children: React.ReactNode;
}

export const StoreThemeProvider = ({ store, children }: StoreThemeProviderProps) => {
  const theme = useStoreTheme(store);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Créer ou récupérer l'élément <style>
    if (!styleRef.current) {
      const styleElement = document.createElement('style');
      styleElement.id = 'store-theme-styles';
      document.head.appendChild(styleElement);
      styleRef.current = styleElement;
    }

    // Générer les CSS variables et règles
    const css = generateThemeCSS(theme);

    // Mettre à jour le contenu
    if (styleRef.current) {
      styleRef.current.textContent = css;
    }

    // Nettoyage à la destruction
    return () => {
      if (styleRef.current && styleRef.current.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [theme]);

  // Charger les polices Google Fonts si nécessaire
  useEffect(() => {
    const fonts = new Set([theme.headingFont, theme.bodyFont]);
    fonts.forEach(font => {
      if (font && font !== 'Inter') {
        loadGoogleFont(font);
      }
    });
  }, [theme.headingFont, theme.bodyFont]);

  return <>{children}</>;
};

/**
 * Génère le CSS complet avec les variables CSS et les règles
 */
const generateThemeCSS = (theme: StoreTheme): string => {
  const borderRadius = getBorderRadiusValue(theme.borderRadius);
  const shadow = getShadowValue(theme.shadowIntensity);

  return `
    :root {
      /* Couleurs principales */
      --store-primary: ${theme.primaryColor};
      --store-secondary: ${theme.secondaryColor};
      --store-accent: ${theme.accentColor};
      --store-background: ${theme.backgroundColor};
      --store-text: ${theme.textColor};
      --store-text-secondary: ${theme.textSecondaryColor};
      
      /* Couleurs des boutons */
      --store-button-primary-bg: ${theme.buttonPrimaryColor};
      --store-button-primary-text: ${theme.buttonPrimaryText};
      --store-button-secondary-bg: ${theme.buttonSecondaryColor};
      --store-button-secondary-text: ${theme.buttonSecondaryText};
      
      /* Couleurs des liens */
      --store-link: ${theme.linkColor};
      --store-link-hover: ${theme.linkHoverColor};
      
      /* Style */
      --store-border-radius: ${borderRadius};
      --store-shadow: ${shadow};
      
      /* Typographie */
      --store-heading-font: '${theme.headingFont}', sans-serif;
      --store-body-font: '${theme.bodyFont}', sans-serif;
      --store-font-size-base: ${theme.fontSizeBase};
      --store-heading-h1: ${theme.headingSizeH1};
      --store-heading-h2: ${theme.headingSizeH2};
      --store-heading-h3: ${theme.headingSizeH3};
      --store-line-height: ${theme.lineHeight};
      --store-letter-spacing: ${theme.letterSpacing};
      
      /* Layout */
      --store-product-grid-columns: ${theme.productGridColumns};
    }

    /* Application globale des polices */
    body.store-theme-active {
      font-family: var(--store-body-font);
      font-size: var(--store-font-size-base);
      line-height: var(--store-line-height);
      letter-spacing: var(--store-letter-spacing);
      color: var(--store-text);
      background-color: var(--store-background);
    }

    /* Titres avec police personnalisée */
    .store-theme-active h1,
    .store-theme-active h2,
    .store-theme-active h3,
    .store-theme-active h4,
    .store-theme-active h5,
    .store-theme-active h6 {
      font-family: var(--store-heading-font);
      color: var(--store-text);
    }

    .store-theme-active h1 {
      font-size: var(--store-heading-h1);
    }

    .store-theme-active h2 {
      font-size: var(--store-heading-h2);
    }

    .store-theme-active h3 {
      font-size: var(--store-heading-h3);
    }

    /* Liens personnalisés */
    .store-theme-active a {
      color: var(--store-link);
      transition: color 0.2s ease;
    }

    .store-theme-active a:hover {
      color: var(--store-link-hover);
    }

    /* Boutons personnalisés */
    .store-theme-active .store-button-primary {
      background-color: var(--store-button-primary-bg);
      color: var(--store-button-primary-text);
      border-radius: var(--store-border-radius);
      box-shadow: var(--store-shadow);
    }

    .store-theme-active .store-button-primary:hover {
      opacity: 0.9;
    }

    .store-theme-active .store-button-secondary {
      background-color: var(--store-button-secondary-bg);
      color: var(--store-button-secondary-text);
      border-radius: var(--store-border-radius);
      box-shadow: var(--store-shadow);
    }

    /* Grille produits personnalisée */
    .store-theme-active .store-product-grid {
      grid-template-columns: repeat(var(--store-product-grid-columns), minmax(0, 1fr));
    }

    /* Responsive: ajuster les colonnes sur mobile et tablette */
    @media (max-width: 640px) {
      .store-theme-active .store-product-grid {
        grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
      }
    }

    @media (min-width: 641px) and (max-width: 1024px) {
      .store-theme-active .store-product-grid {
        grid-template-columns: repeat(min(2, var(--store-product-grid-columns)), minmax(0, 1fr)) !important;
      }
    }

    @media (min-width: 1025px) {
      .store-theme-active .store-product-grid {
        grid-template-columns: repeat(var(--store-product-grid-columns), minmax(0, 1fr)) !important;
      }
    }

    /* Cartes produits avec style personnalisé */
    .store-theme-active .store-product-card {
      border-radius: var(--store-border-radius);
      box-shadow: var(--store-shadow);
    }

    /* Header personnalisé selon le style */
    .store-theme-active .store-header-minimal {
      padding: 1rem 0;
    }

    .store-theme-active .store-header-standard {
      padding: 2rem 0;
    }

    .store-theme-active .store-header-extended {
      padding: 3rem 0;
    }

    /* Footer personnalisé selon le style */
    .store-theme-active .store-footer-minimal {
      padding: 2rem 0;
    }

    .store-theme-active .store-footer-standard {
      padding: 3rem 0;
    }

    .store-theme-active .store-footer-extended {
      padding: 4rem 0;
    }

    /* Navigation personnalisée */
    .store-theme-active .store-navigation-horizontal {
      display: flex;
      flex-direction: row;
    }

    .store-theme-active .store-navigation-vertical {
      display: flex;
      flex-direction: column;
    }

    .store-theme-active .store-navigation-mega {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    /* Tabs personnalisés */
    .store-theme-active .store-tab-trigger[data-state="active"] {
      border-bottom-color: var(--store-primary) !important;
      color: var(--store-primary) !important;
    }

    .store-theme-active .store-tab-trigger[data-state="active"]:hover {
      color: var(--store-link-hover) !important;
      border-bottom-color: var(--store-link-hover) !important;
    }

    .store-theme-active .store-tab-trigger:not([data-state="active"]) {
      color: var(--store-text) !important;
    }

    .store-theme-active .store-tab-trigger:not([data-state="active"]):hover {
      color: var(--store-link) !important;
    }

    /* Boutons dans le storefront */
    .store-theme-active button[class*="bg-gradient"],
    .store-theme-active .btn-primary {
      background-color: var(--store-button-primary-bg) !important;
      color: var(--store-button-primary-text) !important;
      border-radius: var(--store-border-radius);
    }

    /* Cartes produits avec style personnalisé */
    .store-theme-active .store-product-card-minimal {
      border: 1px solid var(--store-text-secondary);
      padding: 1rem;
    }

    .store-theme-active .store-product-card-standard {
      border: 1px solid var(--store-text-secondary);
      padding: 1.5rem;
      box-shadow: var(--store-shadow);
    }

    .store-theme-active .store-product-card-detailed {
      border: 2px solid var(--store-primary);
      padding: 2rem;
      box-shadow: var(--store-shadow);
    }
  `;
};

/**
 * Charge une police Google Fonts si elle n'est pas déjà chargée
 */
const loadGoogleFont = (fontName: string): void => {
  // Vérifier si la police est déjà chargée
  const existingLink = document.querySelector(`link[href*="${fontName.replace(/\s+/g, '+')}"]`);
  if (existingLink) {
    return;
  }

  // Créer le lien pour charger la police
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

