/**
 * Barre utilitaire sticky (langue + déconnexion) — zone contenu, sous TopNav si présente.
 */

import { UserUtilityActions } from '@/components/layout/UserUtilityActions';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { dispatchOpenCommandPalette } from '@/lib/vendor-command-palette';
import { useTranslation } from 'react-i18next';
import {
  formatSearchShortcutKey,
  formatSidebarToggleShortcutKey,
} from '@/lib/navigation/keyboard-shortcuts';

type UtilityBarHeaderProps = {
  className?: string;
};

export function UtilityBarHeader({ className }: UtilityBarHeaderProps) {
  const { t } = useTranslation();
  const searchShortcut = formatSearchShortcutKey();
  const sidebarShortcut = formatSidebarToggleShortcutKey();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex min-h-11 sm:min-h-12 shrink-0 items-center justify-between gap-1.5 sm:gap-2',
        'border-b border-border/40 bg-background/90 backdrop-blur-xl',
        'px-3 sm:px-4 lg:px-6 shadow-[0_1px_0_0_hsl(var(--border)/0.35)]',
        className
      )}
      role="toolbar"
      aria-label={t('sidebar.chrome.utilityBarAriaLabel')}
    >
      <div className="hidden sm:flex items-center gap-2 min-w-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-muted-foreground"
          onClick={dispatchOpenCommandPalette}
          aria-label={t('sidebar.chrome.shortcutCommandPalette')}
        >
          <Search className="h-3.5 w-3.5" aria-hidden />
          <span className="text-xs">{t('sidebar.chrome.searchPlaceholder')}</span>
          <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {searchShortcut}
          </kbd>
        </Button>
        <span
          className="hidden lg:inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"
          aria-hidden
        >
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono font-medium">
            {sidebarShortcut}
          </kbd>
          <span>{t('sidebar.chrome.shortcutToggleSidebar')}</span>
        </span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
        <NotificationBell />
        <UserUtilityActions variant="shell" />
      </div>
    </header>
  );
}
