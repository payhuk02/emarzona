/**
 * Composant de paramètres d'apparence
 * Gère le thème et les préférences visuelles
 */

import { ThemeSelector } from '@/components/navigation/ThemeSelector';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Monitor, Moon, Sun } from 'lucide-react';

export const AppearanceSettings = () => {
  const { theme, themeConfig } = useTheme();

  return (
    <div className="space-y-6">
      {/* Sélection de thème */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Thème de l'application</CardTitle>
          </div>
          <CardDescription>
            Choisissez un thème qui correspond à votre style. Votre préférence sera sauvegardée automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ThemeSelector />
          
          {/* Aperçu du thème actuel */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              {themeConfig.name === 'dark' || themeConfig.name === 'default' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span>Thème actuel: {themeConfig.displayName}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {themeConfig.description}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations sur les thèmes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <CardTitle>Thèmes disponibles</CardTitle>
          </div>
          <CardDescription>
            Découvrez les différents thèmes inspirés de grandes plateformes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Professionnel',
                description: 'Clair et professionnel',
                colors: ['#FFFFFF', '#0A2540', '#635BFF'],
              },
              {
                name: 'Minimaliste',
                description: 'Épuré et moderne',
                colors: ['#FFFFFF', '#1D1D1F', '#0066FF'],
              },
              {
                name: 'Sombre',
                description: 'Élégant et premium',
                colors: ['#000000', '#FAFAFA', '#FFFFFF'],
              },
              {
                name: 'Spacieux',
                description: 'Clair et confortable',
                colors: ['#FFFFFF', '#37352F', '#37352F'],
              },
              {
                name: 'Classique',
                description: 'Fonctionnel et pratique',
                colors: ['#FFFFFF', '#24292F', '#0969DA'],
              },
              {
                name: 'Défaut',
                description: 'Thème sombre actuel',
                colors: ['#1E293B', '#F8FAFC', '#3B82F6'],
              },
            ].map((themeInfo) => (
              <div
                key={themeInfo.name}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex gap-1">
                    {themeInfo.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border-2 border-border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{themeInfo.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {themeInfo.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};







