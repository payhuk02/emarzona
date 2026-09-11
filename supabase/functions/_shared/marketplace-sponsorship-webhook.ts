/**
 * Active une campagne marketplace_sponsorship après paiement webhook réussi.
 */
export async function activateMarketplaceSponsorshipFromWebhook(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  options: {
    sponsorshipId: string;
    paymentRef?: string | null;
  }
): Promise<void> {
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
