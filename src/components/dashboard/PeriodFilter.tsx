import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export type PeriodType = '7d' | '30d' | '90d' | 'custom';

interface PeriodFilterProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (startDate: Date | undefined, endDate: Date | undefined) => void;
  className?: string;
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  period,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  className,
}) => {
  const [isCustomOpen, setIsCustomOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const handlePeriodChange = (value: string) => {
    const newPeriod = value as PeriodType;
    onPeriodChange(newPeriod);

    if (newPeriod !== 'custom') {
      setIsCustomOpen(false);
      // Réinitialiser les dates personnalisées si on change de période
      if (newPeriod !== 'custom') {
        onCustomDateChange?.(undefined, undefined);
      }
    } else {
      setIsCustomOpen(true);
    }
  };

  const handleDateRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onCustomDateChange?.(range.from, range.to);
      // Fermer automatiquement après sélection complète
      setTimeout(() => setIsCustomOpen(false), 100);
    } else if (range?.from) {
      onCustomDateChange?.(range.from, undefined);
    }
  };

  const handleClearDates = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCustomDateChange?.(undefined, undefined);
  };

  const dateRange =
    customStartDate && customEndDate
      ? { from: customStartDate, to: customEndDate }
      : customStartDate
        ? { from: customStartDate, to: undefined }
        : undefined;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select value={period} onValueChange={handlePeriodChange}>
        <SelectTrigger
          className={cn(
            'h-9 sm:h-10 text-[10px] sm:text-xs md:text-sm',
            className?.includes('w-full') ? 'w-full' : 'w-[180px]'
          )}
        >
          <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1.5 sm:mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d" className="text-[10px] sm:text-xs md:text-sm">
            7 derniers jours
          </SelectItem>
          <SelectItem value="30d" className="text-[10px] sm:text-xs md:text-sm">
            30 derniers jours
          </SelectItem>
          <SelectItem value="90d" className="text-[10px] sm:text-xs md:text-sm">
            90 derniers jours
          </SelectItem>
          <SelectItem value="custom" className="text-[10px] sm:text-xs md:text-sm">
            Personnalisé
          </SelectItem>
        </SelectContent>
      </Select>

      {period === 'custom' && (
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal h-9 sm:h-10 text-[10px] sm:text-xs md:text-sm',
                className?.includes('w-full') ? 'w-full' : 'w-full sm:w-[280px] md:w-[320px]',
                !customStartDate && !customEndDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
              {customStartDate && customEndDate ? (
                <span className="flex-1 truncate">
                  {format(customStartDate, 'dd MMM yyyy', { locale: fr })} -{' '}
                  {format(customEndDate, 'dd MMM yyyy', { locale: fr })}
                </span>
              ) : customStartDate ? (
                <span className="flex-1 truncate">
                  {format(customStartDate, 'dd MMM yyyy', { locale: fr })} - ...
                </span>
              ) : (
                <span className="flex-1">Sélectionner une période</span>
              )}
              {customStartDate && (
                <button
                  type="button"
                  onClick={handleClearDates}
                  className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label="Effacer les dates"
                >
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                </button>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 shadow-lg border-border/50"
            align="start"
            sideOffset={5}
          >
            <div className="p-4">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={customStartDate || new Date()}
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={isMobile ? 1 : 2}
                locale={fr}
                className="rounded-lg"
                classNames={{
                  months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                  month: 'space-y-4',
                  caption: 'flex justify-center pt-1 relative items-center',
                  caption_label: 'text-sm font-semibold',
                  nav: 'space-x-1 flex items-center',
                  nav_button: cn(
                    'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input hover:bg-accent hover:text-accent-foreground rounded-md'
                  ),
                  nav_button_previous: 'absolute left-1',
                  nav_button_next: 'absolute right-1',
                  table: 'w-full border-collapse space-y-1',
                  head_row: 'flex',
                  head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                  row: 'flex w-full mt-2',
                  cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                  day: cn(
                    'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors'
                  ),
                  day_range_end: 'day-range-end',
                  day_selected:
                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                  day_today: 'bg-accent text-accent-foreground font-semibold',
                  day_outside:
                    'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                  day_disabled: 'text-muted-foreground opacity-50',
                  day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
                  day_hidden: 'invisible',
                }}
              />
              {customStartDate && customEndDate && (
                <div className="p-2 sm:p-3 border-t border-border flex items-center justify-between gap-2 bg-muted/30">
                  <div className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {format(customStartDate, 'dd MMM yyyy', { locale: fr })}
                    </span>
                    {' - '}
                    <span className="font-medium text-foreground">
                      {format(customEndDate, 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsCustomOpen(false)}
                    className="h-8 text-[10px] sm:text-xs"
                  >
                    Appliquer
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
