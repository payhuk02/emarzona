/**
 * Service Calendar Component
 * Date: 28 octobre 2025
 * 
 * Calendar for selecting service booking dates
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfToday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ServiceCalendarProps {
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
}

export const ServiceCalendar = ({
  selectedDate,
  onSelectDate,
  minDate = startOfToday(),
  maxDate,
  disabledDates = [],
}: ServiceCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, minDate)) return true;
    if (maxDate && isBefore(maxDate, date)) return true;
    if (disabledDates.some(d => isSameDay(d, date))) return true;
    return false;
  };

  // Get the starting day of week for the month (0 = Sunday, 1 = Monday, etc.)
  const startDay = monthStart.getDay();
  
  // Days of week labels starting with Monday
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  
  // Adjust days array to start from Monday
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: adjustedStartDay }).map((_, index) => (
            <div key={`empty-${index}`} />
          ))}

          {/* Calendar days */}
          {days.map((day) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);
            const disabled = isDateDisabled(day);

            return (
              <Button
                key={day.toISOString()}
                variant={isSelected ? 'default' : 'ghost'}
                className={`
                  h-10 w-full p-0 font-normal
                  ${isCurrentDay && !isSelected ? 'border-2 border-primary' : ''}
                  ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
                `}
                onClick={() => !disabled && onSelectDate(day)}
                disabled={disabled}
              >
                <time dateTime={format(day, 'yyyy-MM-dd')}>
                  {format(day, 'd')}
                </time>
              </Button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded border-2 border-primary" />
            <span>Aujourd'hui</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-primary" />
            <span>Sélectionné</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCalendar;

