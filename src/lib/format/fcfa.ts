/** Affichage montants en franc CFA (XOF / FCFA) */
export function formatFcfa(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} FCFA`;
}
