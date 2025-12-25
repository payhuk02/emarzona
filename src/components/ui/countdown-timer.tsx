/**
 * Countdown Timer Component
 * Date: 28 octobre 2025
 * 
 * Affiche un compte à rebours jusqu'à une date cible
 * Utile pour auto-release escrow, deadlines, etc.
 */

import { useEffect, useState } from 'react';
import { Clock } from '@/components/icons';

interface CountdownTimerProps {
  targetDate: string | Date;
  onComplete?: () => void;
  className?: string;
  showIcon?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const CountdownTimer = ({
  targetDate,
  onComplete,
  className = '',
  showIcon = true,
}: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        });
        
        if (onComplete) {
          onComplete();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total: difference,
      });
    };

    // Initial calculation
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  const formatUnit = (value: number, label: string) => {
    const plural = value !== 1 ? 's' : '';
    return value > 0 ? `${value} ${label}${plural}` : '';
  };

  const getFormattedTime = () => {
    const parts = [];
    
    if (timeRemaining.days > 0) {
      parts.push(formatUnit(timeRemaining.days, 'jour'));
    }
    if (timeRemaining.hours > 0 || timeRemaining.days > 0) {
      parts.push(formatUnit(timeRemaining.hours, 'heure'));
    }
    if (timeRemaining.minutes > 0 || timeRemaining.hours > 0 || timeRemaining.days > 0) {
      parts.push(formatUnit(timeRemaining.minutes, 'minute'));
    }
    if (timeRemaining.days === 0) {
      parts.push(formatUnit(timeRemaining.seconds, 'seconde'));
    }

    return parts.filter(Boolean).join(', ') || 'Expiré';
  };

  const getUrgencyClass = () => {
    if (timeRemaining.total === 0) return 'text-red-600 dark:text-red-400';
    if (timeRemaining.days === 0 && timeRemaining.hours < 24) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-700 dark:text-gray-300';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <Clock className={`h-4 w-4 ${getUrgencyClass()}`} />}
      <span className={`font-medium ${getUrgencyClass()}`}>
        {getFormattedTime()}
      </span>
    </div>
  );
};

/**
 * Compact version for badges
 */
export const CountdownBadge = ({
  targetDate,
  onComplete,
}: {
  targetDate: string | Date;
  onComplete?: () => void;
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        });
        
        if (onComplete) {
          onComplete();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total: difference,
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  const getCompactFormat = () => {
    if (timeRemaining.total === 0) return 'Expiré';
    if (timeRemaining.days > 0) return `${timeRemaining.days}j ${timeRemaining.hours}h`;
    if (timeRemaining.hours > 0) return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  };

  const getBadgeColor = () => {
    if (timeRemaining.total === 0) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (timeRemaining.days === 0 && timeRemaining.hours < 24) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor()}`}>
      <Clock className="h-3 w-3" />
      {getCompactFormat()}
    </span>
  );
};
