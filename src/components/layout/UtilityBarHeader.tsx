/**
 * Barre utilitaire sticky (langue + déconnexion) — zone contenu, sous TopNav si présente.
 */

import { UserUtilityActions } from '@/components/layout/UserUtilityActions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { dispatchOpenCommandPalette } from '@/lib/vendor-command-palette';

type UtilityBarHeaderProps = {
  className?: string;
};

export function UtilityBarHeader({ className }: UtilityBarHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex min-h-11 sm:min-h-12 shrink-0 items-center justify-between gap-1.5 sm:gap-2',
        'border-b border-border/40 bg-background/90 backdrop-blur-xl',
        'px-3 sm:px-4 lg:px-6 shadow-[0_1px_0_0_hsl(var(--border)/0.35)]',
        className
      )}
      role="toolbar"
      aria-label="Actions utilisateur"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden sm:inline-flex h-8 gap-2 text-muted-foreground"
        onClick={dispatchOpenCommandPalette}
        aria-label="Ouvrir la palette de commandes"
      >
        <Search className="h-3.5 w-3.5" aria-hidden />
        <span className="text-xs">Rechercher…</span>
        <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <UserUtilityActions variant="shell" />
    </header>
  );
}
