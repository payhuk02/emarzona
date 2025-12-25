/**
 * 🎨 EMARZONA THEME SYSTEM
 * Thèmes professionnels pour l'application
 * 
 * Thèmes disponibles:
 * - professional: Thème clair et professionnel (fond blanc, texte noir, bleu)
 * - minimal: Thème minimaliste et moderne (fond blanc, texte noir doux, bleu)
 * - dark: Thème sombre élégant (fond noir, texte blanc, accents blancs)
 * - spacious: Thème clair et spacieux (fond blanc, texte gris foncé)
 * - classic: Thème clair et fonctionnel (fond blanc, texte noir, bleu)
 * - default: Thème actuel (sombre avec accents colorés)
 */

export type ThemeName = 'professional' | 'minimal' | 'dark' | 'spacious' | 'classic' | 'default';

export interface ThemeConfig {
  name: ThemeName;
  displayName: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    'card-foreground': string;
    popover: string;
    'popover-foreground': string;
    primary: string;
    'primary-foreground': string;
    secondary: string;
    'secondary-foreground': string;
    muted: string;
    'muted-foreground': string;
    accent: string;
    'accent-foreground': string;
    destructive: string;
    'destructive-foreground': string;
    border: string;
    input: string;
    ring: string;
  };
  sidebar: {
    background: string;
    foreground: string;
    primary: string;
    'primary-foreground': string;
    accent: string;
    'accent-foreground': string;
    border: string;
    ring: string;
  };
  typography: {
    fontFamily: string[];
    fontSize: {
      base: string;
    };
  };
  borderRadius: string;
  shadows: {
    soft: string;
    medium: string;
    large: string;
  };
}

/**
 * 🎨 THÈME PROFESSIONNEL
 * Thème clair et professionnel
 * - Fond clair (#FFFFFF)
 * - Texte noir (#0A2540)
 * - Bleu professionnel (#635BFF)
 * - Police: Inter
 */
export const professionalTheme: ThemeConfig = {
  name: 'professional',
  displayName: 'Professionnel',
  description: 'Thème clair et professionnel, idéal pour les applications d\'entreprise',
  colors: {
    background: '0 0% 100%',           // Blanc pur
    foreground: '220 40% 15%',          // Noir bleuté (#0A2540)
    card: '0 0% 100%',                  // Blanc
    'card-foreground': '220 40% 15%',   // Noir bleuté
    popover: '0 0% 100%',               // Blanc
    'popover-foreground': '220 40% 15%', // Noir bleuté
    primary: '217 91% 60%',             // Bleu moderne #3B82F6 (inspiré Linear, Stripe)
    'primary-foreground': '0 0% 100%',  // Blanc
    secondary: '0 0% 96%',              // Gris très clair moderne
    'secondary-foreground': '0 0% 12%', // Noir doux
    muted: '0 0% 98%',                  // Gris ultra clair
    'muted-foreground': '0 0% 45%',     // Gris moyen moderne
    accent: '217 91% 60%',              // Bleu moderne
    'accent-foreground': '0 0% 100%',    // Blanc
    destructive: '0 84% 60%',           // Rouge
    'destructive-foreground': '0 0% 100%', // Blanc
    border: '0 0% 90%',                 // Gris clair moderne
    input: '0 0% 90%',                  // Gris clair moderne
    ring: '217 91% 60%',                // Bleu moderne
  },
  sidebar: {
    background: '0 0% 100%',            // Blanc
    foreground: '220 40% 15%',          // Noir bleuté
    primary: '217 91% 60%',             // Bleu moderne
    'primary-foreground': '0 0% 100%',  // Blanc
    accent: '0 0% 96%',                // Gris très clair
    'accent-foreground': '0 0% 12%',   // Noir doux
    border: '0 0% 90%',                // Gris clair
    ring: '217 91% 60%',               // Bleu moderne
  },
  typography: {
    fontFamily: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    fontSize: {
      base: '1rem', // 16px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
  },
  borderRadius: '0.5rem', // 8px - Moderne et cohérent
  shadows: {
    soft: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
};

/**
 * 🎨 THÈME MINIMALISTE
 * Thème minimaliste et moderne
 * - Fond clair (#FFFFFF)
 * - Texte gris foncé (#1D1D1F)
 * - Accents colorés subtils
 * - Police: Inter
 */
export const minimalTheme: ThemeConfig = {
  name: 'minimal',
  displayName: 'Minimaliste',
  description: 'Thème minimaliste et épuré, parfait pour les applications modernes',
  colors: {
    background: '0 0% 100%',           // Blanc pur
    foreground: '0 0% 12%',            // Noir doux (#1D1D1F)
    card: '0 0% 100%',                  // Blanc
    'card-foreground': '0 0% 12%',      // Noir doux
    popover: '0 0% 100%',               // Blanc
    'popover-foreground': '0 0% 12%',   // Noir doux
    primary: '217 91% 60%',             // Bleu moderne #3B82F6
    'primary-foreground': '0 0% 100%',   // Blanc
    secondary: '0 0% 96%',              // Gris très clair (#F5F5F5)
    'secondary-foreground': '0 0% 12%',  // Noir doux
    muted: '0 0% 98%',                  // Gris ultra clair (#FAFAFA)
    'muted-foreground': '0 0% 45%',    // Gris moyen (#737373)
    accent: '210 100% 50%',             // Bleu Linear
    'accent-foreground': '0 0% 100%',    // Blanc
    destructive: '0 72% 51%',           // Rouge
    'destructive-foreground': '0 0% 100%', // Blanc
    border: '0 0% 90%',                 // Gris clair (#E5E5E5)
    input: '0 0% 90%',                   // Gris clair
    ring: '217 91% 60%',                // Bleu moderne
  },
  sidebar: {
    background: '0 0% 100%',            // Blanc
    foreground: '0 0% 12%',             // Noir doux
    primary: '217 91% 60%',            // Bleu moderne
    'primary-foreground': '0 0% 100%',  // Blanc
    accent: '0 0% 96%',                // Gris très clair
    'accent-foreground': '0 0% 12%',   // Noir doux
    border: '0 0% 90%',                // Gris clair
    ring: '217 91% 60%',               // Bleu moderne
  },
  typography: {
    fontFamily: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    fontSize: {
      base: '1rem', // 16px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
  },
  borderRadius: '0.375rem', // 6px - Subtile
  shadows: {
    soft: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
};

/**
 * 🎨 THÈME SOMBRE
 * Thème sombre élégant
 * - Fond sombre élégant (#000000)
 * - Texte gris clair (#FAFAFA)
 * - Accents blancs
 * - Police: Inter
 */
export const darkTheme: ThemeConfig = {
  name: 'dark',
  displayName: 'Sombre',
  description: 'Thème sombre élégant et premium, idéal pour un usage prolongé',
  colors: {
    background: '0 0% 0%',             // Noir pur (#000000)
    foreground: '0 0% 98%',             // Blanc doux (#FAFAFA)
    card: '0 0% 3%',                    // Noir très légèrement grisé
    'card-foreground': '0 0% 98%',      // Blanc doux
    popover: '0 0% 3%',                 // Noir très légèrement grisé
    'popover-foreground': '0 0% 98%',   // Blanc doux
    primary: '0 0% 100%',                // Blanc pur
    'primary-foreground': '0 0% 0%',    // Noir
    secondary: '0 0% 7%',               // Gris très foncé
    'secondary-foreground': '0 0% 98%',  // Blanc doux
    muted: '0 0% 5%',                   // Gris foncé
    'muted-foreground': '0 0% 65%',     // Gris moyen
    accent: '0 0% 100%',                // Blanc pur
    'accent-foreground': '0 0% 0%',     // Noir
    destructive: '0 72% 51%',           // Rouge
    'destructive-foreground': '0 0% 100%', // Blanc
    border: '0 0% 14%',                 // Gris foncé
    input: '0 0% 14%',                  // Gris foncé
    ring: '0 0% 100%',                  // Blanc pur
  },
  sidebar: {
    background: '0 0% 3%',              // Noir très légèrement grisé
    foreground: '0 0% 98%',             // Blanc doux
    primary: '0 0% 100%',               // Blanc pur
    'primary-foreground': '0 0% 0%',    // Noir
    accent: '0 0% 7%',                 // Gris très foncé
    'accent-foreground': '0 0% 98%',    // Blanc doux
    border: '0 0% 14%',                // Gris foncé
    ring: '0 0% 100%',                 // Blanc pur
  },
  typography: {
    fontFamily: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    fontSize: {
      base: '1rem', // 16px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
  },
  borderRadius: '0.5rem', // 8px
  shadows: {
    soft: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    large: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  },
};

/**
 * 🎨 THÈME SPACIEUX
 * Thème clair et spacieux
 * - Fond clair (#FFFFFF)
 * - Texte gris foncé (#37352F)
 * - Espacement large
 * - Police: System UI
 */
export const spaciousTheme: ThemeConfig = {
  name: 'spacious',
  displayName: 'Spacieux',
  description: 'Thème clair et spacieux, confortable pour la lecture et la productivité',
  colors: {
    background: '0 0% 100%',           // Blanc pur
    foreground: '40 8% 20%',           // Gris foncé (#37352F)
    card: '0 0% 100%',                  // Blanc
    'card-foreground': '40 8% 20%',     // Gris foncé
    popover: '0 0% 100%',               // Blanc
    'popover-foreground': '40 8% 20%',  // Gris foncé
    primary: '40 8% 20%',               // Gris foncé (Notion utilise le texte comme primary)
    'primary-foreground': '0 0% 100%',  // Blanc
    secondary: '40 8% 96%',             // Gris très clair
    'secondary-foreground': '40 8% 20%', // Gris foncé
    muted: '40 8% 98%',                 // Gris ultra clair
    'muted-foreground': '40 8% 45%',    // Gris moyen
    accent: '40 8% 20%',                // Gris foncé
    'accent-foreground': '0 0% 100%',   // Blanc
    destructive: '0 72% 51%',           // Rouge
    'destructive-foreground': '0 0% 100%', // Blanc
    border: '40 8% 90%',                // Gris clair
    input: '40 8% 90%',                 // Gris clair
    ring: '40 8% 20%',                  // Gris foncé
  },
  sidebar: {
    background: '40 8% 98%',            // Gris ultra clair
    foreground: '40 8% 20%',           // Gris foncé
    primary: '40 8% 20%',               // Gris foncé
    'primary-foreground': '0 0% 100%',  // Blanc
    accent: '40 8% 96%',               // Gris très clair
    'accent-foreground': '40 8% 20%',   // Gris foncé
    border: '40 8% 90%',               // Gris clair
    ring: '40 8% 20%',                 // Gris foncé
  },
  typography: {
    fontFamily: ['ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
    fontSize: {
      base: '1rem', // 16px
    },
  },
  borderRadius: '0.25rem', // 4px - Minimal
  shadows: {
    soft: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
    large: '0 4px 8px 0 rgba(0, 0, 0, 0.15)',
  },
};

/**
 * 🎨 THÈME CLASSIQUE
 * Thème clair et fonctionnel
 * - Fond clair (#FFFFFF)
 * - Texte noir (#24292F)
 * - Bleu classique (#0969DA)
 * - Police: System UI
 */
export const classicTheme: ThemeConfig = {
  name: 'classic',
  displayName: 'Classique',
  description: 'Thème clair et fonctionnel, parfait pour un usage quotidien',
  colors: {
    background: '0 0% 100%',           // Blanc pur
    foreground: '210 24% 16%',         // Noir bleuté (#24292F)
    card: '0 0% 100%',                  // Blanc
    'card-foreground': '210 24% 16%',   // Noir bleuté
    popover: '0 0% 100%',               // Blanc
    'popover-foreground': '210 24% 16%', // Noir bleuté
    primary: '210 100% 50%',            // Bleu GitHub (#0969DA)
    'primary-foreground': '0 0% 100%',   // Blanc
    secondary: '210 20% 96%',           // Gris très clair
    'secondary-foreground': '210 24% 16%', // Noir bleuté
    muted: '210 20% 98%',               // Gris ultra clair
    'muted-foreground': '210 11% 45%',  // Gris moyen
    accent: '210 100% 50%',             // Bleu GitHub
    'accent-foreground': '0 0% 100%',    // Blanc
    destructive: '0 72% 51%',           // Rouge
    'destructive-foreground': '0 0% 100%', // Blanc
    border: '210 20% 90%',              // Gris clair
    input: '210 20% 90%',               // Gris clair
    ring: '217 91% 60%',                // Bleu moderne
  },
  sidebar: {
    background: '210 20% 98%',          // Gris ultra clair
    foreground: '210 24% 16%',          // Noir bleuté
    primary: '210 100% 50%',            // Bleu GitHub
    'primary-foreground': '0 0% 100%',  // Blanc
    accent: '210 20% 96%',              // Gris très clair
    'accent-foreground': '210 24% 16%', // Noir bleuté
    border: '210 20% 90%',              // Gris clair
    ring: '210 100% 50%',              // Bleu GitHub
  },
  typography: {
    fontFamily: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    fontSize: {
      base: '1rem', // 16px
    },
  },
  borderRadius: '0.375rem', // 6px
  shadows: {
    soft: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
};

/**
 * 🎨 THÈME DEFAULT (Actuel)
 * Thème sombre actuel d'Emarzona
 */
export const defaultTheme: ThemeConfig = {
  name: 'default',
  displayName: 'Emarzona (Défaut)',
  description: 'Thème sombre actuel d\'Emarzona',
  colors: {
    background: '220 30% 12%',          // Fond sombre
    foreground: '0 0% 98%',             // Texte blanc
    card: '220 25% 16%',                 // Carte sombre
    'card-foreground': '0 0% 98%',      // Texte blanc
    popover: '220 25% 16%',              // Popover sombre
    'popover-foreground': '0 0% 98%',   // Texte blanc
    primary: '210 100% 60%',             // Bleu vif
    'primary-foreground': '0 0% 100%',  // Blanc
    secondary: '220 20% 22%',            // Gris-bleu sombre
    'secondary-foreground': '0 0% 98%', // Blanc
    muted: '220 20% 20%',                // Gris sombre
    'muted-foreground': '220 10% 65%',   // Gris moyen
    accent: '45 100% 60%',               // Jaune vif
    'accent-foreground': '220 30% 12%',  // Fond sombre
    destructive: '0 84.2% 60.2%',        // Rouge
    'destructive-foreground': '0 0% 100%', // Blanc
    border: '220 20% 24%',               // Bordure sombre
    input: '220 20% 24%',                // Input sombre
    ring: '210 100% 60%',                // Ring bleu
  },
  sidebar: {
    background: '0 0% 100%',             // Blanc (forcé)
    foreground: '0 0% 0%',               // Noir (forcé)
    primary: '25 95% 53%',              // Orange
    'primary-foreground': '0 0% 100%',  // Blanc
    accent: '33 100% 96.5%',            // Gris très clair
    'accent-foreground': '0 0% 0%',     // Noir
    border: '20 5.9% 90%',              // Gris clair
    ring: '25 95% 53%',                 // Orange
  },
  typography: {
    fontFamily: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    fontSize: {
      base: '1rem', // 16px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
  },
  borderRadius: '1rem', // 16px
  shadows: {
    soft: '0 4px 16px -2px hsl(220 100% 10% / 0.3)',
    medium: '0 8px 32px -4px hsl(220 100% 10% / 0.4)',
    large: '0 16px 64px -8px hsl(220 100% 10% / 0.5)',
  },
};

/**
 * Tous les thèmes disponibles
 */
export const themes: Record<ThemeName, ThemeConfig> = {
  professional: professionalTheme,
  minimal: minimalTheme,
  dark: darkTheme,
  spacious: spaciousTheme,
  classic: classicTheme,
  default: defaultTheme,
};

/**
 * Obtenir un thème par son nom
 * Retourne le thème professionnel (clair) par défaut si le thème n'existe pas
 */
export const getTheme = (name: ThemeName): ThemeConfig => {
  return themes[name] || themes.professional;
};

/**
 * Liste des noms de thèmes
 */
export const themeNames: ThemeName[] = ['professional', 'minimal', 'dark', 'spacious', 'classic', 'default'];

