import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Badge } from "./badge";

interface CountdownTimerProps {
  endDate: string | Date;
  startDate?: string | Date;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const CountdownTimer = ({ endDate, startDate, onExpire }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft | null => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const start = startDate ? new Date(startDate).getTime() : now;

      // Si la promo n'a pas encore commencé
      if (now < start) {
        setIsActive(false);
        return null;
      }

      // Si la promo est terminée
      if (now > end) {
        setIsActive(false);
        if (onExpire) {
          onExpire();
        }
        return null;
      }

      setIsActive(true);
      const difference = end - now;

      return {
        total: difference,
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Calcul initial
    setTimeLeft(calculateTimeLeft());

    // Mise à jour chaque seconde
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, startDate, onExpire]);

  // Si la promo n'est pas active, ne rien afficher
  if (!isActive || !timeLeft) {
    return null;
  }

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
      <Clock className="h-4 w-4 text-orange-600 animate-pulse" />
      <div className="flex items-center gap-1 text-sm font-semibold">
        {timeLeft.days > 0 && (
          <>
            <div className="flex flex-col items-center">
              <span className="text-lg text-orange-700">{formatNumber(timeLeft.days)}</span>
              <span className="text-xs text-muted-foreground">j</span>
            </div>
            <span className="text-orange-600">:</span>
          </>
        )}
        <div className="flex flex-col items-center">
          <span className="text-lg text-orange-700">{formatNumber(timeLeft.hours)}</span>
          <span className="text-xs text-muted-foreground">h</span>
        </div>
        <span className="text-orange-600">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg text-orange-700">{formatNumber(timeLeft.minutes)}</span>
          <span className="text-xs text-muted-foreground">m</span>
        </div>
        <span className="text-orange-600">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg text-orange-700">{formatNumber(timeLeft.seconds)}</span>
          <span className="text-xs text-muted-foreground">s</span>
        </div>
      </div>
      <Badge variant="destructive" className="ml-2 animate-pulse">
        Offre limitée
      </Badge>
    </div>
  );
};

