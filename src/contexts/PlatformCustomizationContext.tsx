/**
 * Contexte pour la personnalisation de la plateforme en temps réel
 * Applique les changements immédiatement dans toute l'application
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { logger } from '@/lib/logger';
import type { PlatformCustomizationSchemaType } from '@/lib/schemas/platform-customization';

interface DesignCustomization {
  colors?: Record<string, string>;
  tokens?: {
    borderRadius?: string;
    shadow?: string;
    spacing?: string;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: Record<string, string>;
  };
  theme?: 'light' | 'dark' | 'auto';
}

interface PlatformCustomizationContextType {
  customizationData: PlatformCustomizationSchemaType | null;
  applyCustomization: () => void;
  previewMode: boolean;
}

const PlatformCustomizationContext = createContext<PlatformCustomizationContextType | undefined>(undefined);

export const PlatformCustomizationProvider = ({ children }: { children: ReactNode }) => {
  const { customizationData, load } = usePlatformCustomization();
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Nettoyer le cache Payhuk au montage du provider
  useEffect(() => {
    try {
      const { clearPayhukLogoCache, clearAllPayhukReferences } = require('@/utils/clearPayhukLogoCache');
      clearPayhukLogoCache();
      clearAllPayhukReferences();
    } catch (error) {
      // Ignorer les erreurs
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (load) {
          await load();
        }
      } catch (error) {
        logger.error('Error loading customization', { error });
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Appliquer les changements de design au chargement initial
  useEffect(() => {
    if (!isLoading && customizationData?.design) {
      applyDesignCustomization(customizationData.design);
    }
  }, [customizationData, isLoading]);

  // Écouter les événements de mise à jour depuis usePlatformCustomization.save()
  // pour appliquer les changements en temps réel (design + pages)
  useEffect(() => {
    const handleCustomizationUpdate = (event: CustomEvent) => {
      const updatedData = event.detail?.customizationData;
      
      // Appliquer les changements de design immédiatement
      if (updatedData?.design) {
        applyDesignCustomization(updatedData.design);
      }
      
      // Mettre à jour le contexte pour forcer le re-render des composants
      // qui utilisent usePageCustomization
      if (updatedData) {
        // Le contexte sera mis à jour via le hook usePlatformCustomization
        // qui met à jour customizationData dans le state
      }
    };

    window.addEventListener('platform-customization-updated', handleCustomizationUpdate as EventListener);
    
    return () => {
      window.removeEventListener('platform-customization-updated', handleCustomizationUpdate as EventListener);
    };
  }, []);

  const applyDesignCustomization = (design: DesignCustomization) => {
    if (!design) return;

    const root = document.documentElement;

    // Appliquer les couleurs
    if (design.colors) {
      Object.entries(design.colors).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Convertir HSL en format CSS variable (sans hsl())
          let hslValue = value;
          if (value.startsWith('hsl(')) {
            hslValue = value.replace('hsl(', '').replace(')', '');
          }
          
          // Mapper les clés aux variables CSS
          const cssVarMap: Record<string, string> = {
            primary: '--primary',
            secondary: '--secondary',
            accent: '--accent',
            success: '--success',
            warning: '--warning',
            error: '--destructive',
          };

          const cssVar = cssVarMap[key] || `--${key}`;
          root.style.setProperty(cssVar, hslValue);
          
          // Appliquer aussi aux variantes (primary-foreground, etc.)
          if (key === 'primary') {
            root.style.setProperty('--primary-foreground', '0 0% 100%');
          } else if (key === 'secondary') {
            root.style.setProperty('--secondary-foreground', '0 0% 98%');
          } else if (key === 'accent') {
            root.style.setProperty('--accent-foreground', '220 30% 12%');
          }
        }
      });
    }

    // Appliquer les design tokens
    if (design.tokens) {
      // Border Radius
      if (design.tokens.borderRadius) {
        root.style.setProperty('--radius', design.tokens.borderRadius);
      }

      // Shadow (appliquer la shadow sélectionnée)
      if (design.tokens.shadow) {
        const shadows = {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          soft: '0 4px 16px -2px hsl(220 100% 10% / 0.3)',
          medium: '0 8px 32px -4px hsl(220 100% 10% / 0.4)',
          large: '0 16px 64px -8px hsl(220 100% 10% / 0.5)',
          glow: '0 0 40px hsl(210 100% 60% / 0.3)',
        };
        const shadowValue = shadows[design.tokens.shadow as keyof typeof shadows] || shadows.md;
        root.style.setProperty('--shadow-default', shadowValue);
      }

      // Spacing (base spacing unit)
      if (design.tokens.spacing) {
        const spacingMap: Record<string, string> = {
          '0': '0',
          '1': '0.25rem',
          '2': '0.5rem',
          '3': '0.75rem',
          '4': '1rem',
          '5': '1.25rem',
          '6': '1.5rem',
          '8': '2rem',
        };
        const spacingValue = spacingMap[design.tokens.spacing] || '1rem';
        root.style.setProperty('--spacing-base', spacingValue);
      }
    }

    // Appliquer la typographie
    if (design.typography) {
      if (design.typography.fontFamily) {
        root.style.setProperty('--font-sans', design.typography.fontFamily);
        document.body.style.fontFamily = design.typography.fontFamily;
      }
    }

    // Appliquer le thème
    if (design.theme) {
      if (design.theme === 'dark') {
        root.classList.add('dark');
      } else if (design.theme === 'light') {
        root.classList.remove('dark');
      } else if (design.theme === 'auto') {
        // Suivre les préférences système
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        
        // Écouter les changements de préférence système
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
          if (e.matches) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        };
        mediaQuery.addEventListener('change', handleChange);
        
        // Cleanup
        return () => {
          mediaQuery.removeEventListener('change', handleChange);
        };
      }
    }
  };

  const applyCustomization = () => {
    try {
      if (customizationData?.design) {
        applyDesignCustomization(customizationData.design);
      }
    } catch (error) {
      logger.error('Error applying customization', { error });
    }
  };

  // Gestion d'erreur pour éviter les crashes si le contexte échoue
  try {
    return (
      <PlatformCustomizationContext.Provider
        value={{
          customizationData: customizationData || null,
          applyCustomization,
          previewMode,
        }}
      >
        {children}
      </PlatformCustomizationContext.Provider>
    );
  } catch (error) {
    logger.error('Error in PlatformCustomizationProvider', { error });
    // Retourner les enfants sans le contexte en cas d'erreur
    return <>{children}</>;
  }
};

export const usePlatformCustomizationContext = () => {
  const context = useContext(PlatformCustomizationContext);
  if (!context) {
    throw new Error('usePlatformCustomizationContext must be used within PlatformCustomizationProvider');
  }
  return context;
};

