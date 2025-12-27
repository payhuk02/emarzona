import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { X, Filter, Calendar } from 'lucide-react';
import { Search } from '@/components/icons';
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useState } from "react";

interface PromotionFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  discountTypeFilter?: string;
  onDiscountTypeChange?: (value: string) => void;
  dateFromFilter?: string;
  onDateFromChange?: (value: string) => void;
  dateToFilter?: string;
  onDateToChange?: (value: string) => void;
}

export const PromotionFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  discountTypeFilter,
  onDiscountTypeChange,
  dateFromFilter,
  onDateFromChange,
  dateToFilter,
  onDateToChange,
}: PromotionFiltersProps) => {
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const hasAdvancedFilters = discountTypeFilter || dateFromFilter || dateToFilter;

  const clearAdvancedFilters = () => {
    onDiscountTypeChange?.('');
    onDateFromChange?.('');
    onDateToChange?.('');
  };

  return (
    <div 
      ref={filtersRef}
      className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      {/* Filtres de base */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder="Rechercher par code ou description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9 h-9 sm:h-10 text-xs sm:text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-muted"
              onClick={() => onSearchChange("")}
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 text-xs sm:text-sm">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="inactive">Inactives</SelectItem>
          </SelectContent>
        </Select>

        {/* Bouton filtres avancés */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={hasAdvancedFilters ? "default" : "outline"}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres avancés
              {hasAdvancedFilters && (
                <span className="ml-2 h-2 w-2 rounded-full bg-primary-foreground" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 max-w-[calc(100vw-2rem)] sm:max-w-sm p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Filtres avancés</h4>
                {hasAdvancedFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAdvancedFilters}
                    className="h-7 text-xs"
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>

              {/* Filtre par type de réduction */}
              {onDiscountTypeChange && (
                <div className="space-y-2">
                  <Label className="text-xs">Type de réduction</Label>
                  <Select value={discountTypeFilter || 'all'} onValueChange={onDiscountTypeChange}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="percentage">Pourcentage</SelectItem>
                      <SelectItem value="fixed">Montant fixe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filtres par date */}
              {(onDateFromChange || onDateToChange) && (
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Période
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {onDateFromChange && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">De</Label>
                        <Input
                          type="date"
                          value={dateFromFilter || ''}
                          onChange={(e) => onDateFromChange(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    )}
                    {onDateToChange && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">À</Label>
                        <Input
                          type="date"
                          value={dateToFilter || ''}
                          onChange={(e) => onDateToChange(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};






