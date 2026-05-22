/** Formate un montant en FCFA (devise plateforme) */
export function formatFcfa(amount: number, options?: { compact?: boolean }): string {
  if (options?.compact && amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}M FCFA`;
  }
  if (options?.compact && amount >= 1_000) {
    return `${(amount / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k FCFA`;
  }
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}
