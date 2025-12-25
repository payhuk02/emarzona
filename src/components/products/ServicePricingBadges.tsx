/**
 * Service Pricing Badges - Composants pour afficher les informations de tarification des services
 * Date: 2 Février 2025
 *
 * Badges pour:
 * - Type de tarification (fixe, horaire, par participant)
 * - Acompte requis
 * - Annulation autorisée
 * - Nombre max de participants
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, Users, CreditCard, XCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServicePricingBadgesProps {
  pricingType?: 'fixed' | 'hourly' | 'per_participant' | null;
  depositRequired?: boolean | null;
  depositAmount?: number | null;
  depositType?: 'fixed' | 'percentage' | null;
  allowCancellation?: boolean | null;
  cancellationDeadlineHours?: number | null;
  maxParticipants?: number | null;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Badge Type de tarification
 */
export function ServicePricingTypeBadge({
  pricingType,
  size = 'sm',
  className,
}: {
  pricingType?: 'fixed' | 'hourly' | 'per_participant' | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!pricingType || pricingType === 'fixed') return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
  };

  if (pricingType === 'hourly') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
          sizeClasses[size],
          className
        )}
        title="Tarif horaire"
      >
        <Clock className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
        <span className="hidden sm:inline">Tarif horaire</span>
        <span className="sm:hidden">Horaire</span>
      </Badge>
    );
  }

  if (pricingType === 'per_participant') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
          sizeClasses[size],
          className
        )}
        title="Prix par participant"
      >
        <Users className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
        <span className="hidden sm:inline">Par participant</span>
        <span className="sm:hidden">Par pers.</span>
      </Badge>
    );
  }

  return null;
}

/**
 * Badge Acompte requis
 */
export function ServiceDepositBadge({
  depositRequired,
  depositAmount,
  depositType,
  currency = 'XOF',
  size = 'sm',
  className,
}: {
  depositRequired?: boolean | null;
  depositAmount?: number | null;
  depositType?: 'fixed' | 'percentage' | null;
  currency?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!depositRequired || !depositAmount) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
  };

  const displayAmount =
    depositType === 'percentage'
      ? `${depositAmount}%`
      : `${depositAmount.toLocaleString()} ${currency}`;

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
        sizeClasses[size],
        className
      )}
      title={`Acompte de ${displayAmount} requis`}
    >
      <CreditCard className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
      <span className="hidden sm:inline">Acompte {displayAmount}</span>
      <span className="sm:hidden">{displayAmount}</span>
    </Badge>
  );
}

/**
 * Badge Annulation
 */
export function ServiceCancellationBadge({
  allowCancellation,
  cancellationDeadlineHours,
  size = 'sm',
  className,
}: {
  allowCancellation?: boolean | null;
  cancellationDeadlineHours?: number | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (allowCancellation === undefined || allowCancellation === null) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
  };

  if (allowCancellation) {
    const deadlineText = cancellationDeadlineHours
      ? cancellationDeadlineHours >= 24
        ? `${Math.floor(cancellationDeadlineHours / 24)}j`
        : `${cancellationDeadlineHours}h`
      : '';

    return (
      <Badge
        variant="outline"
        className={cn(
          'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
          sizeClasses[size],
          className
        )}
        title={`Annulation autorisée${deadlineText ? ` ${deadlineText} avant` : ''}`}
      >
        <CheckCircle className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
        <span className="hidden sm:inline">Annulable{deadlineText ? ` ${deadlineText}` : ''}</span>
        <span className="sm:hidden">Annulable</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
        sizeClasses[size],
        className
      )}
      title="Annulation non autorisée"
    >
      <XCircle className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
      <span className="hidden sm:inline">Non annulable</span>
      <span className="sm:hidden">Non annul.</span>
    </Badge>
  );
}

/**
 * Badge Max participants
 */
export function ServiceMaxParticipantsBadge({
  maxParticipants,
  size = 'sm',
  className,
}: {
  maxParticipants?: number | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!maxParticipants || maxParticipants <= 1) return null;

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
        'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
        sizeClasses[size],
        className
      )}
      title={`Jusqu'à ${maxParticipants} participants`}
    >
      <Users className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
      <span className="hidden sm:inline">Jusqu'à {maxParticipants} pers.</span>
      <span className="sm:hidden">{maxParticipants} pers.</span>
    </Badge>
  );
}

/**
 * Composant principal qui affiche tous les badges de tarification service
 */
export function ServicePricingBadges({
  pricingType,
  depositRequired,
  depositAmount,
  depositType,
  allowCancellation,
  cancellationDeadlineHours,
  maxParticipants,
  className,
  size = 'sm',
}: ServicePricingBadgesProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <ServicePricingTypeBadge pricingType={pricingType} size={size} />
      <ServiceDepositBadge
        depositRequired={depositRequired}
        depositAmount={depositAmount}
        depositType={depositType}
        size={size}
      />
      <ServiceCancellationBadge
        allowCancellation={allowCancellation}
        cancellationDeadlineHours={cancellationDeadlineHours}
        size={size}
      />
      <ServiceMaxParticipantsBadge maxParticipants={maxParticipants} size={size} />
    </div>
  );
}
