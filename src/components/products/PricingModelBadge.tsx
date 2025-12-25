/**
 * Pricing Model Badge - Composant réutilisable pour afficher le modèle de tarification
 * Date: 2 Février 2025
 *
 * Affiche les badges pour les différents modèles de tarification:
 * - Achat unique (one-time)
 * - Abonnement (subscription)
 * - Accès à vie (lifetime)
 * - Gratuit (free)
 * - Prix libre (pay-what-you-want)
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DollarSign, RefreshCw, InfinityIcon, Gift, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PricingModel = 'one-time' | 'subscription' | 'lifetime' | 'free' | 'pay-what-you-want';

interface PricingModelBadgeProps {
  pricingModel?: PricingModel | string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Composant pour afficher un badge de modèle de tarification
 */
export function PricingModelBadge({
  pricingModel,
  className,
  size = 'sm',
}: PricingModelBadgeProps) {
  if (!pricingModel) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
    lg: 'text-sm sm:text-base px-3 sm:px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
    lg: 'h-4 w-4 sm:h-5 sm:w-5',
  };

  // Achat unique
  if (pricingModel === 'one-time') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-green-500 text-green-600 dark:text-green-400',
          sizeClasses[size],
          className
        )}
        title="Achat unique, pas d'abonnement"
      >
        <DollarSign className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
        <span className="hidden sm:inline">Achat unique</span>
        <span className="sm:hidden">Unique</span>
      </Badge>
    );
  }

  // Abonnement
  if (pricingModel === 'subscription') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-orange-500 text-orange-600 dark:text-orange-400',
          sizeClasses[size],
          className
        )}
        title="Abonnement récurrent"
      >
        <RefreshCw className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
        <span className="hidden sm:inline">Abonnement</span>
        <span className="sm:hidden">Abonnement</span>
      </Badge>
    );
  }

  // Accès à vie
  if (pricingModel === 'lifetime') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-purple-500 text-purple-600 dark:text-purple-400',
          sizeClasses[size],
          className
        )}
        title="Accès à vie après achat"
      >
        <InfinityIcon className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
        <span className="hidden sm:inline">Accès à vie</span>
        <span className="sm:hidden">À vie</span>
      </Badge>
    );
  }

  // Gratuit
  if (pricingModel === 'free') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-blue-500 text-blue-600 dark:text-blue-400',
          sizeClasses[size],
          className
        )}
        title="Produit gratuit"
      >
        <Gift className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
        <span className="hidden sm:inline">Gratuit</span>
        <span className="sm:hidden">Gratuit</span>
      </Badge>
    );
  }

  // Prix libre
  if (pricingModel === 'pay-what-you-want') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-yellow-500 text-yellow-600 dark:text-yellow-400',
          sizeClasses[size],
          className
        )}
        title="Vous choisissez le prix"
      >
        <Percent className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
        <span className="hidden sm:inline">Prix libre</span>
        <span className="sm:hidden">Libre</span>
      </Badge>
    );
  }

  return null;
}
