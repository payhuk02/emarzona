/**
 * Payment Options Badge - Composant réutilisable pour afficher les options de paiement
 * Date: 2 Février 2025
 *
 * Affiche les badges pour les différentes options de paiement:
 * - Paiement complet
 * - Paiement partiel (avec pourcentage)
 * - Paiement sécurisé (escrow)
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentType = 'full' | 'percentage' | 'delivery_secured';

interface PaymentOptionsData {
  payment_type?: PaymentType;
  percentage_rate?: number;
}

interface PaymentOptionsBadgeProps {
  paymentOptions?: PaymentOptionsData | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Composant pour afficher un badge d'option de paiement
 */
export function PaymentOptionsBadge({
  paymentOptions,
  className,
  size = 'sm',
}: PaymentOptionsBadgeProps) {
  // Valeurs par défaut : toujours afficher "Paiement complet" si pas de données
  const paymentType = paymentOptions?.payment_type || 'full';
  const percentageRate = paymentOptions?.percentage_rate || 30;

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

  // Badge Paiement complet
  if (paymentType === 'full') {
    return (
      <Badge
        className={cn('bg-green-500 text-white border-0 shadow-sm', sizeClasses[size], className)}
        title="Paiement complet requis à la commande"
      >
        <CheckCircle className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
        <span className="hidden sm:inline">Paiement complet</span>
        <span className="sm:hidden">Complet</span>
      </Badge>
    );
  }

  // Badge Paiement partiel
  if (paymentType === 'percentage') {
    return (
      <Badge
        className={cn('bg-orange-500 text-white border-0 shadow-sm', sizeClasses[size], className)}
        title={`Paiement partiel de ${percentageRate}% à la commande`}
      >
        <CreditCard className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
        <span className="hidden sm:inline">Paiement partiel {percentageRate}%</span>
        <span className="sm:hidden">{percentageRate}%</span>
      </Badge>
    );
  }

  // Badge Paiement sécurisé (escrow)
  if (paymentType === 'delivery_secured') {
    return (
      <Badge
        className={cn('bg-blue-500 text-white border-0 shadow-sm', sizeClasses[size], className)}
        title="Paiement sécurisé : fonds bloqués jusqu'à confirmation de livraison"
      >
        <Shield className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
        <span className="hidden sm:inline">Paiement sécurisé</span>
        <span className="sm:hidden">Sécurisé</span>
      </Badge>
    );
  }

  return null;
}

/**
 * Helper pour extraire paymentOptions depuis un produit
 */
export function getPaymentOptions(
  product:
    | {
        payment_options?: PaymentOptionsData | string | null;
        payment?: {
          payment_type?: PaymentType;
          percentage_rate?: number;
        } | null;
      }
    | null
    | undefined
): PaymentOptionsData | null {
  if (!product) return null;

  // Cas 1: payment_options est un objet direct
  if (product.payment_options && typeof product.payment_options === 'object') {
    return product.payment_options as PaymentOptionsData;
  }

  // Cas 2: payment_options est une string JSON
  if (product.payment_options && typeof product.payment_options === 'string') {
    try {
      return JSON.parse(product.payment_options) as PaymentOptionsData;
    } catch {
      return null;
    }
  }

  // Cas 3: payment est un objet
  if (product.payment && typeof product.payment === 'object') {
    return {
      payment_type: product.payment.payment_type || 'full',
      percentage_rate: product.payment.percentage_rate || 30,
    };
  }

  // Cas 4: Aucune donnée trouvée, retourner les valeurs par défaut (Paiement complet)
  // Cela permet d'afficher toujours le badge même si les données ne sont pas présentes
  return {
    payment_type: 'full',
    percentage_rate: 30,
  };
}
