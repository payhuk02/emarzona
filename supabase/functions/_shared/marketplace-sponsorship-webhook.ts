/**
 * Active une campagne marketplace_sponsorship après paiement webhook réussi.
 * Vérifie montant (centimes) + store_id avant activation.
 */

type SponsorshipActivationRow = {
  id: string;
  store_id: string;
  status: string;
  amount_paid_cents: number | null;
  currency: string | null;
};

function toAmountCents(amountMajor: number): number {
  return Math.round(Number(amountMajor) * 100);
}

export async function activateMarketplaceSponsorshipFromWebhook(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  options: {
    sponsorshipId: string;
    paymentRef?: string | null;
    /** Montant major units (ex: 500 pour 500 XOF) tel que stocké sur payment_transactions */
    paidAmount?: number | null;
    paidCurrency?: string | null;
    storeId?: string | null;
  }
): Promise<void> {
  const { data: sponsorship, error: fetchError } = await supabase
    .from('marketplace_sponsorships')
    .select('id, store_id, status, amount_paid_cents, currency')
    .eq('id', options.sponsorshipId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(
      `Failed to load sponsorship ${options.sponsorshipId}: ${fetchError.message ?? JSON.stringify(fetchError)}`
    );
  }

  const row = sponsorship as SponsorshipActivationRow | null;
  if (!row?.id) {
    throw new Error(`Sponsorship not found: ${options.sponsorshipId}`);
  }

  if (row.status === 'active') {
    return;
  }

  if (options.storeId && String(options.storeId) !== String(row.store_id)) {
    throw new Error(
      `Sponsorship store mismatch: expected ${row.store_id}, got ${options.storeId}`
    );
  }

  if (row.amount_paid_cents != null && row.amount_paid_cents > 0) {
    if (options.paidAmount == null || Number.isNaN(Number(options.paidAmount))) {
      throw new Error(
        `Missing paid amount for sponsorship ${options.sponsorshipId} (expected ${row.amount_paid_cents} cents)`
      );
    }

    const paidCents = toAmountCents(Number(options.paidAmount));
    // Allow 1 cent rounding tolerance
    if (Math.abs(paidCents - Number(row.amount_paid_cents)) > 1) {
      throw new Error(
        `Sponsorship amount mismatch: paid ${paidCents} cents, expected ${row.amount_paid_cents} cents`
      );
    }

    if (
      options.paidCurrency &&
      row.currency &&
      String(options.paidCurrency).toUpperCase() !== String(row.currency).toUpperCase()
    ) {
      throw new Error(
        `Sponsorship currency mismatch: paid ${options.paidCurrency}, expected ${row.currency}`
      );
    }
  }

  const { data, error } = await supabase.rpc('activate_marketplace_sponsorship', {
    p_sponsorship_id: options.sponsorshipId,
    p_payment_ref: options.paymentRef ?? null,
  });

  if (error) {
    throw new Error(
      `activate_marketplace_sponsorship failed: ${error.message ?? JSON.stringify(error)}`
    );
  }

  if (!data) {
    throw new Error('activate_marketplace_sponsorship returned empty result');
  }
}
