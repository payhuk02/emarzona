import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AdminPaginationNavProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Affiche « page / total » entre les flèches (défaut true) */
  showIndicator?: boolean;
};

/**
 * Navigation de pages admin — cibles 44px + aria-labels (WCAG).
 */
export function AdminPaginationNav({
  page,
  totalPages,
  onPageChange,
  className,
  showIndicator = true,
}: AdminPaginationNavProps) {
  const safeTotal = Math.max(1, totalPages);
  const atStart = page <= 1;
  const atEnd = page >= safeTotal;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={atStart}
        onClick={() => onPageChange(1)}
        aria-label="Première page"
      >
        <ChevronsLeft className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={atStart}
        onClick={() => onPageChange(page - 1)}
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </Button>
      {showIndicator ? (
        <span className="text-sm px-2 tabular-nums" aria-live="polite">
          {page} / {safeTotal}
        </span>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={atEnd}
        onClick={() => onPageChange(page + 1)}
        aria-label="Page suivante"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={atEnd}
        onClick={() => onPageChange(safeTotal)}
        aria-label="Dernière page"
      >
        <ChevronsRight className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
