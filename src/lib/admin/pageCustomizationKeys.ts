/**
 * Lecture des valeurs pages.* avec compatibilité clés préfixées (landingPremium.*).
 */

export function getPageCustomizationValue(
  pageData: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  if (!pageData) return undefined;
  const direct = pageData[key];
  if (typeof direct === 'string' && direct.length > 0) return direct;
  const prefixed = pageData[`landingPremium.${key}`];
  if (typeof prefixed === 'string' && prefixed.length > 0) return prefixed;
  return undefined;
}
