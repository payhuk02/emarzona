/**
 * Lazy Calendar Wrapper Component
 * Charge react-big-calendar de manière lazy et expose les composants nécessaires
 */

import { useState, useEffect, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface LazyCalendarWrapperProps {
  children: (calendar: {
    Calendar: typeof import('react-big-calendar').Calendar;
    dateFnsLocalizer: typeof import('react-big-calendar').dateFnsLocalizer;
    View: typeof import('react-big-calendar').View;
    Views: typeof import('react-big-calendar').Views;
  }) => ReactNode;
}

const CalendarLoadingFallback = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    </CardContent>
  </Card>
);

/**
 * Wrapper pour utiliser react-big-calendar de manière lazy
 * Usage:
 * <LazyCalendarWrapper>
 *   {(calendar) => (
 *     <calendar.Calendar
 *       localizer={localizer}
 *       events={events}
 *       startAccessor="start"
 *       endAccessor="end"
 *     />
 *   )}
 * </LazyCalendarWrapper>
 */
export const LazyCalendarWrapper = ({ children }: LazyCalendarWrapperProps) => {
  const [calendarModule, setCalendarModule] = useState<typeof import('react-big-calendar') | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      import('react-big-calendar'),
      import('react-big-calendar/lib/css/react-big-calendar.css')
    ]).then(([module]) => {
      setCalendarModule(module);
      setLoading(false);
    });
  }, []);

  if (loading || !calendarModule) {
    return <CalendarLoadingFallback />;
  }

  return (
    <>
      {children({
        Calendar: calendarModule.Calendar,
        dateFnsLocalizer: calendarModule.dateFnsLocalizer,
        View: calendarModule.View,
        Views: calendarModule.Views,
      })}
    </>
  );
};

