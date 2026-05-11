/**
 * Composant Countdown Timer pour Enchères
 * Date: 1 Février 2025
 */

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <Clock className="h-4 w-4" />
        <span className="font-semibold">Enchère terminée</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-1 font-semibold">
        {timeLeft.days > 0 && <span>{timeLeft.days}j</span>}
        <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
    </div>
  );
}







