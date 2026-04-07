/**
 * Provider de thème pour initialiser le système de thème
 * Applique le thème professionnel (clair) par défaut
 */

import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { applyThemeImmediate } from '@/lib/theme-utils';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useTheme();

  // Appliquer le thème immédiatement au montage pour éviter le flash
  useEffect(() => {
    applyThemeImmediate();
  }, []);

  // Le thème est appliqué automatiquement par le hook useTheme
  // On attend juste que le chargement soit terminé
  if (isLoading) {
    return null; // Ou un loader si nécessaire
  }

  return <>{children}</>;
};







