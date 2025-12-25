/**
 * Composant de sélection de thème
 */

import { useTheme } from '@/hooks/useTheme';
import { themes, ThemeName } from '@/lib/themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export const ThemeSelector = () => {
  const { theme, changeTheme } = useTheme();

  return (
    <div className="space-y-2">
      <Label htmlFor="theme-select">Thème</Label>
      <Select
        value={theme}
        onValueChange={(value) => changeTheme(value as ThemeName)}
      >
        <SelectTrigger id="theme-select" className="w-full">
          <SelectValue placeholder="Sélectionner un thème" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(themes).map((themeConfig) => (
            <SelectItem key={themeConfig.name} value={themeConfig.name}>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-border"
                  style={{
                    backgroundColor: `hsl(${themeConfig.colors.background})`,
                  }}
                />
                <div>
                  <div className="font-medium">{themeConfig.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {themeConfig.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

/**
 * Composant compact de sélection de thème (pour la sidebar)
 */
export const ThemeSelectorCompact = () => {
  const { theme, changeTheme } = useTheme();

  return (
    <Select
      value={theme}
      onValueChange={(value) => changeTheme(value as ThemeName)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.values(themes).map((themeConfig) => (
          <SelectItem key={themeConfig.name} value={themeConfig.name}>
            {themeConfig.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};


