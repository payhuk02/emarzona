/**
 * Epic 3.6.2 — Timeline unifiée commande (5 types produits)
 */

import { formatLocaleDateTime } from '@/lib/i18n/locale-format';

export type OrderTimelineStepStatus = 'done' | 'current' | 'pending' | 'error';

export interface OrderTimelineStep {
  id: string;
  label: string;
  description?: string;
  status: OrderTimelineStepStatus;
}

export interface OrderTimelineInput {
  orderStatus: string;
  paymentStatus: string;
  productTypes: string[];
  createdAt?: string;
  locale?: string | null;
}

const FULFILLMENT_LABELS: Record<string, string> = {
  digital: 'Téléchargement disponible',
  physical: 'Préparation & expédition',
  service: 'Réservation confirmée',
  course: 'Accès cours activé',
  artist: 'Certificat & livraison œuvre',
};

function isPaid(paymentStatus: string): boolean {
  return paymentStatus === 'paid' || paymentStatus === 'completed';
}

function stepStatus(index: number, currentIndex: number, failed: boolean): OrderTimelineStepStatus {
  if (failed && index === currentIndex) return 'error';
  if (index < currentIndex) return 'done';
  if (index === currentIndex) return 'current';
  return 'pending';
}

/** Construit les étapes timeline pour une commande client. */
export function buildOrderTimeline(input: OrderTimelineInput): OrderTimelineStep[] {
  const types = [...new Set(input.productTypes.filter(Boolean))];
  const paid = isPaid(input.paymentStatus);
  const cancelled = input.orderStatus === 'cancelled' || input.paymentStatus === 'refunded';
  const failed = input.paymentStatus === 'failed';

  const steps: OrderTimelineStep[] = [
    {
      id: 'placed',
      label: 'Commande passée',
      description: input.createdAt
        ? formatLocaleDateTime(new Date(input.createdAt), input.locale)
        : undefined,
      status: 'done',
    },
    {
      id: 'payment',
      label: paid ? 'Paiement confirmé' : failed ? 'Paiement échoué' : 'Paiement en attente',
      status: cancelled ? 'error' : paid ? 'done' : failed ? 'error' : 'current',
    },
  ];

  if (cancelled) {
    steps.push({
      id: 'cancelled',
      label: 'Commande annulée',
      status: 'error',
    });
    return steps;
  }

  if (!paid) {
    return steps;
  }

  const fulfillmentIndex = 2;
  const isComplete =
    input.orderStatus === 'completed' ||
    (input.orderStatus === 'confirmed' && types.every(t => t === 'physical'));

  types.forEach((type, i) => {
    const idx = fulfillmentIndex + i;
    steps.push({
      id: `fulfill-${type}`,
      label: FULFILLMENT_LABELS[type] ?? `Traitement ${type}`,
      status: stepStatus(idx, isComplete ? idx + 1 : fulfillmentIndex, false),
    });
  });

  if (types.length === 0) {
    steps.push({
      id: 'fulfill',
      label: 'Traitement commande',
      status: isComplete ? 'done' : 'current',
    });
  }

  steps.push({
    id: 'complete',
    label: 'Commande terminée',
    status: isComplete ? 'done' : 'pending',
  });

  return steps;
}
