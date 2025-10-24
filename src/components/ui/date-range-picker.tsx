import * as React from "react";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateRangeChange(undefined);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full sm:w-[280px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
            aria-label="Sélectionner une plage de dates"
          >
            <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd MMM yyyy", { locale: fr })} -{" "}
                  {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                </>
              ) : (
                format(dateRange.from, "dd MMM yyyy", { locale: fr })
              )
            ) : (
              <span>Filtrer par date</span>
            )}
            {dateRange?.from && (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleReset}
                aria-label="Réinitialiser les dates"
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(range) => {
              onDateRangeChange(range);
              // Close popover when both dates are selected
              if (range?.from && range?.to) {
                setOpen(false);
              }
            }}
            numberOfMonths={2}
            locale={fr}
          />
          <div className="p-3 border-t border-border flex justify-between items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "dd MMM", { locale: fr })} - ${format(dateRange.to, "dd MMM", { locale: fr })}`
                : "Sélectionnez une plage"}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDateRangeChange({
                    from: addDays(new Date(), -7),
                    to: new Date(),
                  });
                  setOpen(false);
                }}
              >
                7 jours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDateRangeChange({
                    from: addDays(new Date(), -30),
                    to: new Date(),
                  });
                  setOpen(false);
                }}
              >
                30 jours
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

