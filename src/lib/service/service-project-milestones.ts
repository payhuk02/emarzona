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
  use_project_milestones?: boolean | string | null;
  project_milestones?: ServiceProjectMilestoneDraft[];
};

function isTruthyPaymentFlag(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export function parseServicePaymentOptions(
  raw: unknown
): ServicePaymentOptionsWithMilestones | null {
  if (!raw) return null;
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const row = parsed as ServicePaymentOptionsWithMilestones;
  return {
    ...row,
    use_project_milestones: isTruthyPaymentFlag(row.use_project_milestones),
  };
}

export type ServiceMilestoneCheckoutContext = {
  isProjectCheckout?: boolean;
  /** Prix fixe sans créneau (fiche service → checkout direct). */
  isFixedPriceBuyNow?: boolean;
};

/** Jalons actifs au checkout (projet ou achat immédiat prix fixe). */
export function serviceCheckoutMilestonesEnabled(
  paymentOptions: ServicePaymentOptionsWithMilestones | null | undefined,
  context: ServiceMilestoneCheckoutContext
): boolean {
  if (paymentOptions?.payment_type !== 'delivery_secured') return false;
  if (!isTruthyPaymentFlag(paymentOptions.use_project_milestones)) return false;
  return Boolean(context.isProjectCheckout || context.isFixedPriceBuyNow);
}

export function projectMilestonesEnabled(
  paymentOptions: ServicePaymentOptionsWithMilestones | null | undefined,
  isProjectCheckout: boolean
): boolean {
  return serviceCheckoutMilestonesEnabled(paymentOptions, { isProjectCheckout });
}

export type ServiceMilestoneSyncResult = {
  applied: boolean;
  dueNow: number;
  remaining: number;
};

/** Persiste les jalons côté serveur (SECURITY DEFINER, invité OK) et retourne le montant dû. */
export async function syncServiceOrderMilestones(
  supabase: {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
  },
  orderId: string,
  billedTotal: number,
  paymentOptions: ServicePaymentOptionsWithMilestones
): Promise<ServiceMilestoneSyncResult> {
  const normalizedOptions = parseServicePaymentOptions(paymentOptions) ?? paymentOptions;

  let data: unknown = null;
  let error: { message?: string } | null = null;

  ({ data, error } = await supabase.rpc('sync_service_order_milestone_payment', {
    p_order_id: orderId,
  }));

  if (error) {
    ({ data, error } = await supabase.rpc('apply_service_project_milestones_on_order', {
      p_order_id: orderId,
      p_total_amount: billedTotal,
      p_payment_options: normalizedOptions,
    }));
  }

  if (error) {
    throw new Error(error.message || 'Impossible de préparer le paiement par jalons');
  }

  const payload = (data ?? {}) as {
    applied?: boolean;
    due_now?: number;
    remaining?: number;
    reason?: string;
  };

  if (!payload.applied) {
    throw new Error(
      payload.reason
        ? `Paiement par jalons indisponible (${payload.reason})`
        : 'Paiement par jalons indisponible'
    );
  }

  const dueNow = Math.round(Number(payload.due_now) || 0);
  const remaining = Math.round(Number(payload.remaining) || 0);

  if (dueNow <= 0) {
    throw new Error('Montant du premier jalon invalide');
  }

  return {
    applied: true,
    dueNow,
    remaining,
  };
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
