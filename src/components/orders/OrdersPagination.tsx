import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface OrdersPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const OrdersPagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: OrdersPaginationProps) => {
  const startItem = totalItems === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 sm:gap-4 py-3 sm:py-4 w-full min-w-0">
      <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
        {startItem}–{endItem} sur {totalItems} commande{totalItems !== 1 ? 's' : ''}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
            <span className="sm:hidden">Par page</span>
            <span className="hidden sm:inline">Lignes par page:</span>
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={value => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[72px] min-h-[44px] h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:inline-flex min-h-[44px] min-w-[44px] h-11 w-11"
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0}
            aria-label="Première page"
          >
            <ChevronsLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="min-h-[44px] min-w-[44px] h-11 w-11"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <span className="text-xs sm:text-sm px-2 tabular-nums whitespace-nowrap">
            {currentPage + 1} / {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="min-h-[44px] min-w-[44px] h-11 w-11"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:inline-flex min-h-[44px] min-w-[44px] h-11 w-11"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            aria-label="Dernière page"
          >
            <ChevronsRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
