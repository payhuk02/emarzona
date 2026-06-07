/**
 * Barre utilitaire sticky (langue + déconnexion) — zone contenu, sous TopNav si présente.
 */

import { UserUtilityActions } from '@/components/layout/UserUtilityActions';
import { cn } from '@/lib/utils';

type UtilityBarHeaderProps = {
  className?: string;
};

export function UtilityBarHeader({ className }: UtilityBarHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex min-h-11 sm:min-h-12 shrink-0 items-center justify-end gap-1.5 sm:gap-2',
        'border-b border-border/40 bg-background/90 backdrop-blur-xl',
        'px-3 sm:px-4 lg:px-6 shadow-[0_1px_0_0_hsl(var(--border)/0.35)]',
        className
      )}
      role="toolbar"
      aria-label="Actions utilisateur"
    >
      <UserUtilityActions variant="shell" />
    </header>
  );
}
