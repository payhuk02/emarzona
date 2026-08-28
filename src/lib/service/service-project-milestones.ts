export type ServiceMilestoneTrigger = 'order_placed' | 'delivery_approved';

export type ServiceProjectMilestoneDraft = {
  id?: string;
  label: string;
  percentage: number;
  trigger: ServiceMilestoneTrigger;
};

export type ServiceProjectMilestoneComputed = ServiceProjectMilestoneDraft & {
  id: string;
  sort_order: number;
  amount: number;
};

export const DEFAULT_SERVICE_PROJECT_MILESTONES: ServiceProjectMilestoneDraft[] = [
  { label: 'Démarrage', percentage: 50, trigger: 'order_placed' },
  { label: 'Livraison', percentage: 50, trigger: 'delivery_approved' },
];

export function normalizeServiceProjectMilestones(
  drafts?: ServiceProjectMilestoneDraft[] | null
): ServiceProjectMilestoneDraft[] {
  const source = drafts && drafts.length > 0 ? drafts : DEFAULT_SERVICE_PROJECT_MILESTONES;
  return source.map((row, index) => ({
    id: row.id || `milestone-${index + 1}`,
    label: row.label?.trim() || `Jalon ${index + 1}`,
    percentage: Math.round(Number(row.percentage) || 0),
    trigger: row.trigger === 'delivery_approved' ? 'delivery_approved' : 'order_placed',
  }));
}

export function validateServiceProjectMilestones(
  drafts?: ServiceProjectMilestoneDraft[] | null
): string[] {
  const errors: string[] = [];
  const rows = normalizeServiceProjectMilestones(drafts);

  if (rows.length < 2) {
    errors.push('Au moins 2 jalons de paiement sont requis');
  }
  if (rows.length > 5) {
    errors.push('Maximum 5 jalons de paiement');
  }

  const totalPct = rows.reduce((sum, row) => sum + row.percentage, 0);
  if (totalPct !== 100) {
    errors.push('La somme des pourcentages des jalons doit être égale à 100 %');
  }

  for (const row of rows) {
    if (row.percentage < 5 || row.percentage > 95) {
      errors.push(`Chaque jalon doit être entre 5 % et 95 % (${row.label})`);
      break;
    }
    if (!row.label.trim()) {
      errors.push('Chaque jalon doit avoir un libellé');
      break;
    }
  }

  const dueNow = rows.filter(row => row.trigger === 'order_placed');
  if (dueNow.length === 0) {
    errors.push('Au moins un jalon doit être dû à la commande (démarrage)');
  }

  return errors;
}

export function computeServiceProjectMilestoneAmounts(
  totalAmount: number,
  drafts?: ServiceProjectMilestoneDraft[] | null
): ServiceProjectMilestoneComputed[] {
  const total = Math.max(0, Math.round(Number(totalAmount) || 0));
  const rows = normalizeServiceProjectMilestones(drafts);
  let allocated = 0;

  return rows.map((row, index) => {
    const isLast = index === rows.length - 1;
    const amount = isLast
      ? Math.max(0, total - allocated)
      : Math.round((total * row.percentage) / 100);
    allocated += amount;
    return {
      ...row,
      id: row.id || `milestone-${index + 1}`,
      sort_order: index,
      amount,
    };
  });
}

export function amountDueAtProjectCheckout(milestones: ServiceProjectMilestoneComputed[]): number {
  return milestones
    .filter(row => row.trigger === 'order_placed')
    .reduce((sum, row) => sum + row.amount, 0);
}

export type ServicePaymentOptionsWithMilestones = {
  payment_type?: string | null;
  percentage_rate?: number | null;
  use_project_milestones?: boolean;
  project_milestones?: ServiceProjectMilestoneDraft[];
};

export function projectMilestonesEnabled(
  paymentOptions: ServicePaymentOptionsWithMilestones | null | undefined,
  isProjectCheckout: boolean
): boolean {
  if (!isProjectCheckout) return false;
  if (paymentOptions?.payment_type !== 'delivery_secured') return false;
  return paymentOptions.use_project_milestones === true;
}

/** Champs orders pour une commande projet avec jalons (solde restant après jalon 1). */
export function toMilestoneOrderFields(payable: { amountToPay: number; remainingAmount: number }): {
  payment_type: 'delivery_secured';
  percentage_paid: number;
  remaining_amount: number;
} | null {
  if (payable.remainingAmount <= 0) return null;
  return {
    payment_type: 'delivery_secured',
    percentage_paid: payable.amountToPay,
    remaining_amount: payable.remainingAmount,
  };
}
