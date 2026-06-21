/**
 * Lecture des valeurs pages.* avec compatibilité clés préfixées (landingPremium.*).
 */

/** Ignore les surcharges admin qui ressemblent à des clés i18n non résolues. */
export function isValidCustomizationText(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^landingPremium\./.test(trimmed)) return false;
  if (/^loading\//.test(trimmed)) return false;
  if (/^sections-[a-z0-9-]+-content-/.test(trimmed)) return false;
  return true;
}

export function getPageCustomizationValue(
  pageData: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  if (!pageData) return undefined;
  const direct = pageData[key];
  if (typeof direct === 'string' && isValidCustomizationText(direct)) return direct;
  const prefixed = pageData[`landingPremium.${key}`];
  if (typeof prefixed === 'string' && isValidCustomizationText(prefixed)) return prefixed;
  return undefined;
}
