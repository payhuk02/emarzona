/**
 * Artist Info Badges - Composants pour afficher les informations spécifiques aux œuvres d'artiste
 * Date: 2 Février 2025
 *
 * Badges pour:
 * - Délai de préparation/expédition
 * - Signature authentifiée
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Badge Délai de préparation/expédition
 */
export function ArtistHandlingTimeBadge({
  handlingTimeDays,
  size = 'sm',
  className,
}: {
  handlingTimeDays?: number | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!handlingTimeDays || handlingTimeDays <= 0) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
  };

  const displayTime =
    handlingTimeDays === 1
      ? '1 jour'
      : handlingTimeDays < 7
        ? `${handlingTimeDays} jours`
        : handlingTimeDays === 7
          ? '1 semaine'
          : `${Math.ceil(handlingTimeDays / 7)} semaines`;

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
        sizeClasses[size],
        className
      )}
      title={`Expédié sous ${displayTime}`}
    >
      <Truck className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
      <span className="hidden sm:inline">Expédié sous {displayTime}</span>
      <span className="sm:hidden">{displayTime}</span>
    </Badge>
  );
}

/**
 * Badge Signature authentifiée
 */
export function ArtistSignatureBadge({
  signatureAuthenticated,
  size = 'sm',
  className,
}: {
  signatureAuthenticated?: boolean | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!signatureAuthenticated) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
        sizeClasses[size],
        className
      )}
      title="Signature authentifiée par un expert"
    >
      <CheckCircle2 className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
      <span className="hidden sm:inline">Signature authentifiée</span>
      <span className="sm:hidden">Sign. vérifiée</span>
    </Badge>
  );
}







