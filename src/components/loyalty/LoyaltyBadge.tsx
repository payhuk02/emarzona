/**
 * Loyalty Badge Component
 * Petit badge affichant les points de fidélisation de l'utilisateur
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star } from 'lucide-react';
import { useLoyaltyProfile } from '@/hooks/useAdvancedLoyalty';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LoyaltyBadgeProps {
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  /** `nav` : version compacte pour la barre supérieure (évite la coupure à droite) */
  display?: 'default' | 'nav';
}

export const LoyaltyBadge: React.FC<LoyaltyBadgeProps> = ({
  className,
  showIcon = true,
  variant = 'secondary',
  size = 'sm',
  display = 'default',
}) => {
  const { user } = useAuth();
  const { profile, isLoading } = useLoyaltyProfile(user?.id);

  if (isLoading || !profile) {
    return null;
  }

  const pointsLabel = profile.availablePoints.toLocaleString();
  const fullLabel = `${pointsLabel} pts`;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const gradientClasses =
    'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-700 border-amber-200 hover:from-amber-500/20 hover:to-yellow-500/20 dark:from-amber-400/20 dark:to-yellow-400/20 dark:text-amber-300 dark:border-amber-700/50';

  if (display === 'nav') {
    return (
      <Badge
        variant={variant}
        title={fullLabel}
        aria-label={fullLabel}
        className={cn(
          'topnav-loyalty-badge inline-flex h-8 max-w-[5.5rem] xl:max-w-none shrink-0 items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0 font-medium whitespace-nowrap overflow-hidden',
          gradientClasses,
          className
        )}
      >
        {showIcon && (
          <Star className={cn('shrink-0 text-amber-500', iconSizeClasses.sm)} aria-hidden="true" />
        )}
        <span className="truncate font-bold tabular-nums leading-none">{pointsLabel}</span>
        <span className="hidden xl:inline shrink-0 text-[10px] sm:text-xs opacity-80 leading-none">
          pts
        </span>
      </Badge>
    );
  }

  return (
    <Badge
      variant={variant}
      className={cn(
        'flex items-center gap-1.5 font-medium',
        gradientClasses,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <div className="flex items-center">
          <Star className={cn('text-amber-500', iconSizeClasses[size])} />
        </div>
      )}
      <span className="font-bold">{profile.availablePoints.toLocaleString()}</span>
      <span className="text-muted-foreground">pts</span>
    </Badge>
  );
};

// Version compacte pour les espaces restreints
export const CompactLoyaltyBadge: React.FC<
  Omit<LoyaltyBadgeProps, 'showIcon' | 'size'>
> = props => <LoyaltyBadge {...props} showIcon={false} size="sm" />;

// Badge avec niveau actuel
export const LoyaltyLevelBadge: React.FC<LoyaltyBadgeProps> = ({
  className,
  variant = 'outline',
  size = 'sm',
}) => {
  const { user } = useAuth();
  const { profile, isLoading } = useLoyaltyProfile(user?.id);

  if (isLoading || !profile) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      variant={variant}
      className={cn('flex items-center gap-1.5 font-medium', sizeClasses[size], className)}
    >
      <Trophy className={iconSizeClasses[size]} />
      <span>{profile.currentTier.name}</span>
    </Badge>
  );
};
