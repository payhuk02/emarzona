/**
 * Badge Emarzona Protect v1 (checkout + fiches commande).
 */

import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EMARZONA_PROTECT_CLAIM_WINDOW_DAYS,
  type EmarzonaProtectStatus,
} from '@/lib/trust/emarzona-protect-policy';

interface EmarzonaProtectBadgeProps {
  eligible?: boolean;
  status?: EmarzonaProtectStatus | null;
  compact?: boolean;
  className?: string;
}

export function EmarzonaProtectBadge({
  eligible = false,
  status,
  compact,
  className,
}: EmarzonaProtectBadgeProps) {
  const active = status?.status === 'active' || status?.canClaim;
  const show = eligible || active || status?.status === 'claimed';

  if (!show) return null;

  const label = active
    ? 'Emarzona Protect actif'
    : status?.status === 'claimed'
      ? 'Réclamation Protect'
      : 'Éligible Emarzona Protect';

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm',
        className
      )}
    >
      <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
      <div className="space-y-0.5">
        <p className="font-medium text-emerald-900 dark:text-emerald-100">{label}</p>
        {!compact && (
          <p className="text-xs text-muted-foreground">
            {active
              ? `Réclamation possible jusqu'à expiration (${EMARZONA_PROTECT_CLAIM_WINDOW_DAYS} jours après paiement).`
              : `Couverture activée après paiement — non reçu, non conforme, endommagé (${EMARZONA_PROTECT_CLAIM_WINDOW_DAYS} jours).`}
          </p>
        )}
      </div>
    </div>
  );
}
