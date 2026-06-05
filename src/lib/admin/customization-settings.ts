/**
 * Commissions et retraits sont stockés dans platform_settings (singleton colonnes).
 * Ne pas les dupliquer dans customization.settings (JSON).
 */
export function stripFinancialSettingsFromCustomizationSettings(
  settings: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!settings || typeof settings !== 'object') return {};
  const { commissions: _c, withdrawals: _w, ...rest } = settings;
  return rest;
}
