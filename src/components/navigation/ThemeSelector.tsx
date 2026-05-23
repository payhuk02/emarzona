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
import { Button } from '@/components/ui/button';
import { Palette } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const topNavIconBtnClass =
  'topnav-icon-btn h-9 w-9 min-h-9 min-w-9 shrink-0 border-0 bg-transparent p-0 shadow-none hover:bg-accent/50';

export const ThemeSelector = () => {
  const { theme, changeTheme } = useTheme();

  return (
    <div className="space-y-2">
      <Label htmlFor="theme-select">Thème</Label>
      <Select value={theme} onValueChange={value => changeTheme(value as ThemeName)}>
        <SelectTrigger id="theme-select" className="w-full">
          <SelectValue placeholder="Sélectionner un thème" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(themes).map(themeConfig => (
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
                  <div className="text-xs text-muted-foreground">{themeConfig.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

type ThemeSelectorCompactProps = {
  /** `nav` : icône seule pour la barre supérieure ; `select` : liste déroulante pleine largeur */
  variant?: 'select' | 'nav';
  className?: string;
};

/**
 * Sélection de thème — select pleine largeur (sidebar) ou icône (topnav)
 */
export const ThemeSelectorCompact = ({
  variant = 'select',
  className,
}: ThemeSelectorCompactProps) => {
  const { theme, changeTheme } = useTheme();

  if (variant === 'nav') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(topNavIconBtnClass, className)}
            aria-label="Changer le thème"
          >
            <Palette className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[10rem]">
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={value => changeTheme(value as ThemeName)}
          >
            {Object.values(themes).map(themeConfig => (
              <DropdownMenuRadioItem key={themeConfig.name} value={themeConfig.name}>
                {themeConfig.displayName}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Select value={theme} onValueChange={value => changeTheme(value as ThemeName)}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.values(themes).map(themeConfig => (
          <SelectItem key={themeConfig.name} value={themeConfig.name}>
            {themeConfig.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
