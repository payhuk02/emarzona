/**
 * Emarzona Protect v2 — éligibilité élargie, escrow, remboursement admin.
 */

import type { CartItem, ProductType } from '@/types/cart';

export const EMARZONA_PROTECT_VERSION = 'v2' as const;
export const EMARZONA_PROTECT_CLAIM_WINDOW_DAYS = 45;
export const EMARZONA_PROTECT_MIN_AMOUNT_XOF = 1000;
export const EMARZONA_PROTECT_MAX_AMOUNT_XOF = 10_000_000;

/** Tous les verticaux marketplace, y compris services et enchères (artist). */
export const EMARZONA_PROTECT_COVERED_TYPES: ProductType[] = [
  'digital',
  'physical',
  'service',
  'course',
  'artist',
];

export type ProtectReasonCode =
  | 'not_received'
  | 'not_as_described'
  | 'damaged'
  | 'unauthorized_charge'
  | 'other';

export type ProtectResolution = 'refund_full' | 'refund_partial' | 'release_seller';

export type ProtectEnrollmentStatus =
  | 'none'
  | 'pending'
  | 'active'
  | 'expired'
  | 'claimed'
  | 'void'
  | 'ineligible';

export type EmarzonaProtectStatus = {
  orderId: string;
  version: string;
  status: ProtectEnrollmentStatus;
  coverageStartsAt: string | null;
  coverageEndsAt: string | null;
  disputeId: string | null;
  ineligibleReason: string | null;
  canClaim: boolean;
  eligibleOnPaid: boolean;
  claimWindowDays: number;
};

export const PROTECT_REASON_OPTIONS: Array<{ code: ProtectReasonCode; label: string }> = [
  { code: 'not_received', label: 'Produit non reçu' },
  { code: 'not_as_described', label: 'Non conforme à la description' },
  { code: 'damaged', label: 'Produit endommagé ou défectueux' },
  { code: 'unauthorized_charge', label: 'Paiement non autorisé' },
  { code: 'other', label: 'Autre problème' },
];

export const PROTECT_RESOLUTION_OPTIONS: Array<{
  code: ProtectResolution;
  label: string;
  description: string;
}> = [
  {
    code: 'refund_full',
    label: 'Remboursement intégral',
    description: 'Rembourse l’acheteur via apply_transaction_refund (escrow Protect).',
  },
  {
    code: 'refund_partial',
    label: 'Remboursement partiel',
    description: 'Montant saisi par l’admin, plafonné au solde remboursable.',
  },
  {
    code: 'release_seller',
    label: 'Libérer au vendeur',
    description: 'Clôture la réclamation sans remboursement.',
  },
];

export function cartHasProtectCoveredItems(items: CartItem[]): boolean {
  return items.some(item => EMARZONA_PROTECT_COVERED_TYPES.includes(item.product_type));
}

export function assessCartProtectEligibility(
  items: CartItem[],
  totalAmountXof: number
): { eligible: boolean; reason?: string } {
  if (totalAmountXof < EMARZONA_PROTECT_MIN_AMOUNT_XOF) {
    return { eligible: false, reason: 'Montant minimum non atteint (1 000 XOF).' };
  }
  if (totalAmountXof > EMARZONA_PROTECT_MAX_AMOUNT_XOF) {
    return { eligible: false, reason: 'Montant au-delà de la couverture Protect (10 M XOF).' };
  }
  if (!cartHasProtectCoveredItems(items)) {
    return { eligible: false, reason: 'Aucun produit éligible dans le panier.' };
  }
  return { eligible: true };
}

export function mapProtectStatusPayload(orderId: string, payload: unknown): EmarzonaProtectStatus {
  const raw = (payload ?? {}) as Record<string, unknown>;
  return {
    orderId,
    version: String(raw.version ?? EMARZONA_PROTECT_VERSION),
    status: (raw.status as ProtectEnrollmentStatus) ?? 'none',
    coverageStartsAt: typeof raw.coverage_starts_at === 'string' ? raw.coverage_starts_at : null,
    coverageEndsAt: typeof raw.coverage_ends_at === 'string' ? raw.coverage_ends_at : null,
    disputeId: typeof raw.dispute_id === 'string' ? raw.dispute_id : null,
    ineligibleReason: typeof raw.ineligible_reason === 'string' ? raw.ineligible_reason : null,
    canClaim: raw.can_claim === true,
    eligibleOnPaid: raw.eligible_on_paid === true,
    claimWindowDays: Number(raw.claim_window_days ?? EMARZONA_PROTECT_CLAIM_WINDOW_DAYS),
  };
}

export function protectStatusLabel(status: ProtectEnrollmentStatus): string {
  switch (status) {
    case 'active':
      return 'Couverture active';
    case 'claimed':
      return 'Réclamation ouverte';
    case 'expired':
      return 'Couverture expirée';
    case 'ineligible':
      return 'Non éligible';
    case 'pending':
      return 'En attente de paiement';
    default:
      return 'Non couvert';
  }
}

export function ineligibleReasonLabel(code: string | null | undefined): string {
  switch (code) {
    case 'ORDER_NOT_PAID':
      return 'Commande non payée';
    case 'ORDER_BELOW_MIN_AMOUNT':
      return 'Montant trop faible';
    case 'ORDER_ABOVE_MAX_AMOUNT':
      return 'Montant hors plafond';
    case 'PRODUCT_TYPE_NOT_COVERED':
      return 'Type de produit non couvert';
    default:
      return code ?? 'Non éligible';
  }
}
