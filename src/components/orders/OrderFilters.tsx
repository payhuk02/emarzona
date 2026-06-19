import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Search } from '@/components/icons';
import { DateRange } from 'react-day-picker';

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  paymentStatusFilter: string;
  onPaymentStatusChange: (value: string) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  /** Masque la recherche (déjà présente dans la barre principale sur mobile). */
  hideSearch?: boolean;
}

const OrderFiltersComponent = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  paymentStatusFilter,
  onPaymentStatusChange,
  dateRange,
  onDateRangeChange,
  hideSearch = false,
}: OrderFiltersProps) => {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
        {!hideSearch && (
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par n° de commande ou client..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9 min-h-[44px] w-full"
            />
          </div>
        )}

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full min-h-[44px] sm:w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="processing">En cours</SelectItem>
            <SelectItem value="completed">Terminée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentStatusFilter} onValueChange={onPaymentStatusChange}>
          <SelectTrigger className="w-full min-h-[44px] sm:w-[180px]">
            <SelectValue placeholder="Paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les paiements</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="paid">Payée</SelectItem>
            <SelectItem value="failed">Échouée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DateRangePicker dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
    </div>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const OrderFilters = React.memo(OrderFiltersComponent, (prevProps, nextProps) => {
  return (
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.statusFilter === nextProps.statusFilter &&
    prevProps.paymentStatusFilter === nextProps.paymentStatusFilter &&
    prevProps.dateRange?.from?.getTime() === nextProps.dateRange?.from?.getTime() &&
    prevProps.dateRange?.to?.getTime() === nextProps.dateRange?.to?.getTime() &&
    prevProps.onSearchChange === nextProps.onSearchChange &&
    prevProps.onStatusChange === nextProps.onStatusChange &&
    prevProps.onPaymentStatusChange === nextProps.onPaymentStatusChange &&
    prevProps.onDateRangeChange === nextProps.onDateRangeChange &&
    prevProps.hideSearch === nextProps.hideSearch
  );
});

OrderFilters.displayName = 'OrderFilters';
