/**
 * Design System Unifié - Emarzona Platform
 * Tokens de design centralisés pour cohérence visuelle
 */

export const designTokens = {
  // === COULEURS ===
  colors: {
    primary: {
      50: 'hsl(210, 100%, 95%)',
      100: 'hsl(210, 100%, 90%)',
      200: 'hsl(210, 100%, 80%)',
      300: 'hsl(210, 100%, 70%)',
      400: 'hsl(210, 100%, 65%)',
      500: 'hsl(210, 100%, 60%)', // Primary
      600: 'hsl(210, 100%, 55%)',
      700: 'hsl(210, 100%, 50%)',
      800: 'hsl(210, 100%, 45%)',
      900: 'hsl(210, 100%, 40%)',
    },
    secondary: {
      50: 'hsl(220, 20%, 95%)',
      100: 'hsl(220, 20%, 90%)',
      200: 'hsl(220, 20%, 80%)',
      300: 'hsl(220, 20%, 70%)',
      400: 'hsl(220, 20%, 60%)',
      500: 'hsl(220, 20%, 50%)',
      600: 'hsl(220, 20%, 40%)',
      700: 'hsl(220, 20%, 30%)',
      800: 'hsl(220, 20%, 22%)',
      900: 'hsl(220, 20%, 15%)',
    },
    accent: {
      50: 'hsl(45, 100%, 95%)',
      100: 'hsl(45, 100%, 90%)',
      200: 'hsl(45, 100%, 80%)',
      300: 'hsl(45, 100%, 70%)',
      400: 'hsl(45, 100%, 65%)',
      500: 'hsl(45, 100%, 60%)', // Accent
      600: 'hsl(45, 100%, 55%)',
      700: 'hsl(45, 100%, 50%)',
      800: 'hsl(45, 100%, 45%)',
      900: 'hsl(45, 100%, 40%)',
    },
    success: {
      500: 'hsl(142, 71%, 45%)',
      600: 'hsl(142, 71%, 40%)',
    },
    warning: {
      500: 'hsl(38, 92%, 50%)',
      600: 'hsl(38, 92%, 45%)',
    },
    error: {
      500: 'hsl(0, 84%, 60%)',
      600: 'hsl(0, 84%, 55%)',
    },
  },

  // === TYPOGRAPHIE ===
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // === ESPACEMENT ===
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // === BORDURES ===
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',
  },

  // === OMBRES ===
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    soft: '0 4px 16px -2px hsl(220 100% 10% / 0.3)',
    medium: '0 8px 32px -4px hsl(220 100% 10% / 0.4)',
    large: '0 16px 64px -8px hsl(220 100% 10% / 0.5)',
    glow: '0 0 40px hsl(210 100% 60% / 0.3)',
  },

  // === TRANSITIONS ===
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // === BREAKPOINTS ===
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // === Z-INDEX ===
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
} as const;

/**
 * Utilitaires pour utiliser le design system
 */
export const getColor = (color: string, shade: number = 500): string => {
  const [category, ...rest] = color.split('.');
  const colorKey = rest.join('.');
  return designTokens.colors[category as keyof typeof designTokens.colors]?.[shade] || color;
};

export const getSpacing = (size: keyof typeof designTokens.spacing): string => {
  return designTokens.spacing[size];
};

export const getShadow = (size: keyof typeof designTokens.shadows): string => {
  return designTokens.shadows[size];
};

/**
 * Classes Tailwind pré-configurées basées sur le design system
 */
export const designSystemClasses = {
  // Buttons
  button: {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white font-medium px-4 py-2 rounded-lg transition-colors',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white font-medium px-4 py-2 rounded-lg transition-colors',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 font-medium px-4 py-2 rounded-lg transition-colors',
    ghost: 'text-primary-500 hover:bg-primary-50 font-medium px-4 py-2 rounded-lg transition-colors',
  },
  
  // Cards
  card: {
    base: 'bg-card border border-border rounded-lg p-6 shadow-soft',
    elevated: 'bg-card border border-border rounded-lg p-6 shadow-medium',
    interactive: 'bg-card border border-border rounded-lg p-6 shadow-soft hover:shadow-medium transition-shadow cursor-pointer',
  },
  
  // Inputs
  input: {
    base: 'w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
    error: 'w-full px-4 py-2 border border-error-500 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-error-500 focus:border-transparent',
  },
  
  // Typography
  heading: {
    h1: 'text-4xl font-bold text-foreground',
    h2: 'text-3xl font-bold text-foreground',
    h3: 'text-2xl font-semibold text-foreground',
    h4: 'text-xl font-semibold text-foreground',
    h5: 'text-lg font-medium text-foreground',
    h6: 'text-base font-medium text-foreground',
  },
} as const;









