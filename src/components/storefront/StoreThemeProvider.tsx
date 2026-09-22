/**
 * StoreThemeProvider
 * Injecte les styles CSS dynamiques basés sur les personnalisations de la boutique
 * Utilise des CSS variables pour permettre une personnalisation complète
 * Imbriqué (layout boutique) : passe-through sans réinjecter / démonter les styles.
 */

import { createContext, useContext, useEffect, useRef } from 'react';
import {
  useStoreTheme,
  getBorderRadiusValue,
  getShadowValue,
  type StoreTheme,
} from '@/hooks/useStoreTheme';
import type { Store } from '@/hooks/useStores';
import { applyStoreFavicon } from '@/lib/storefront/store-favicon';

interface StoreThemeProviderProps {
  store: Store | null;
  children: React.ReactNode;
}

const StoreThemeActiveContext = createContext(false);

export const StoreThemeProvider = ({ store, children }: StoreThemeProviderProps) => {
  const nested = useContext(StoreThemeActiveContext);
  const theme = useStoreTheme(store);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (nested) return;

    // Créer ou récupérer l'élément <style>
    if (!styleRef.current) {
      const existing = document.getElementById('store-theme-styles');
      if (existing instanceof HTMLStyleElement) {
        styleRef.current = existing;
      } else {
        const styleElement = document.createElement('style');
        styleElement.id = 'store-theme-styles';
        document.head.appendChild(styleElement);
        styleRef.current = styleElement;
      }
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
  }, [theme, nested]);

  // Charger les polices Google Fonts si nécessaire
  useEffect(() => {
    if (nested) return;
    const fonts = new Set([theme.headingFont, theme.bodyFont]);
    fonts.forEach(font => {
      if (font && font !== 'Inter') {
        loadGoogleFont(font);
      }
    });
  }, [theme.headingFont, theme.bodyFont, nested]);

  useEffect(() => {
    if (nested) return;
    document.body.classList.add('store-theme-active');
    const restoreFavicon = applyStoreFavicon(store);

    return () => {
      document.body.classList.remove('store-theme-active');
      restoreFavicon();
    };
  }, [store?.id, store?.favicon_url, store?.apple_touch_icon_url, store?.logo_url, nested]);

  if (nested) {
    return <>{children}</>;
  }

  return (
    <StoreThemeActiveContext.Provider value={true}>{children}</StoreThemeActiveContext.Provider>
  );
};

/**
 * Génère le CSS complet avec les variables CSS et les règles
 */
const generateThemeCSS = (theme: StoreTheme): string => {
  const borderRadius = getBorderRadiusValue(theme.borderRadius);
  const shadow = getShadowValue(theme.shadowIntensity);
  const rawLineHeight = parseFloat(String(theme.lineHeight));
  const safeLineHeight = Number.isFinite(rawLineHeight)
    ? String(Math.min(2.2, Math.max(1.4, rawLineHeight)))
    : '1.6';
  const rawTracking = parseFloat(String(theme.letterSpacing));
  const safeLetterSpacing = Number.isFinite(rawTracking)
    ? `${Math.min(0.05, Math.max(-0.02, rawTracking))}em`
    : theme.letterSpacing || '0';

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
      --store-line-height: ${safeLineHeight};
      --store-letter-spacing: ${safeLetterSpacing};
      
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
      /* Ne pas hériter d’un line-height body trop bas (titres multi-lignes qui se chevauchent) */
      line-height: 1.3;
      letter-spacing: -0.01em;
    }

    .store-theme-active h2 {
      font-size: var(--store-heading-h2);
      line-height: 1.35;
      letter-spacing: -0.01em;
    }

    .store-theme-active h3 {
      font-size: var(--store-heading-h3);
      line-height: 1.4;
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

    /* Header — padding haut uniquement (le spacer LOGO_OVERLAP gère la zone logo) */
    .store-theme-active .store-header-minimal {
      padding-top: 0.5rem;
      padding-bottom: 0;
    }

    .store-theme-active .store-header-standard {
      padding-top: 1rem;
      padding-bottom: 0;
    }

    .store-theme-active .store-header-extended {
      padding-top: 1.5rem;
      padding-bottom: 0;
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

    /*
     * Checkout : fond clair forcé (gradient muted/background).
     * Ne pas hériter de --store-text (souvent clair sur thèmes sombres)
     * sinon titres / résumés deviennent illisibles.
     */
    .store-theme-active .checkout-readable {
      color: hsl(var(--foreground));
    }

    .store-theme-active .checkout-readable h1,
    .store-theme-active .checkout-readable h2,
    .store-theme-active .checkout-readable h3,
    .store-theme-active .checkout-readable h4,
    .store-theme-active .checkout-readable h5,
    .store-theme-active .checkout-readable h6 {
      color: hsl(var(--foreground)) !important;
    }

    /*
     * Description produit : aligner fond + texte boutique pour éviter
     * texte clair (--store-text) sur carte blanche (bg-card).
     */
    .store-theme-active .product-description-content {
      background-color: var(--store-background) !important;
      color: var(--store-text) !important;
    }

    .store-theme-active .product-description-content h1,
    .store-theme-active .product-description-content h2,
    .store-theme-active .product-description-content h3,
    .store-theme-active .product-description-content h4,
    .store-theme-active .product-description-content h5,
    .store-theme-active .product-description-content h6,
    .store-theme-active .product-description-content p,
    .store-theme-active .product-description-content li,
    .store-theme-active .product-description-content strong,
    .store-theme-active .product-description-content b,
    .store-theme-active .product-description-content em,
    .store-theme-active .product-description-content span,
    .store-theme-active .product-description-content div {
      color: var(--store-text) !important;
    }

    /* Couleurs quasi-blanches collées depuis l’éditeur → illisibles sur fond clair */
    .store-theme-active .product-description-content [style*="color: white"],
    .store-theme-active .product-description-content [style*="color:white"],
    .store-theme-active .product-description-content [style*="color: #fff"],
    .store-theme-active .product-description-content [style*="color:#fff"],
    .store-theme-active .product-description-content [style*="color: #FFF"],
    .store-theme-active .product-description-content [style*="color:#FFF"],
    .store-theme-active .product-description-content [style*="color: #ffffff"],
    .store-theme-active .product-description-content [style*="color:#ffffff"],
    .store-theme-active .product-description-content [style*="color: #FFFFFF"],
    .store-theme-active .product-description-content [style*="color:#FFFFFF"],
    .store-theme-active .product-description-content [style*="color: rgb(255, 255, 255)"],
    .store-theme-active .product-description-content [style*="color:rgb(255, 255, 255)"],
    .store-theme-active .product-description-content [style*="color: rgb(255,255,255)"],
    .store-theme-active .product-description-content [style*="color:rgb(255,255,255)"] {
      color: var(--store-text) !important;
    }
  `;
};

/**
 * Charge une police Google Fonts si elle n'est pas déjà chargée
 */
const loadGoogleFont = (fontName: string): void => {
  const safeFont = fontName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  if (!safeFont) return;

  const encoded = encodeURIComponent(safeFont).replace(/%20/g, '+');
  const existingLink = document.querySelector(`link[href*="${encoded}"]`);
  if (existingLink) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
};
