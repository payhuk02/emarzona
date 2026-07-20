/**
 * Sanitize valeurs CSS injectées dans StoreThemeProvider (défense client).
 */

const HEX_COLOR = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const ALLOWED_STORE_FONTS = new Set([
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
  'Raleway',
]);

const CSS_SIZE = /^([0-9.]+(px|rem|em|%)|normal)$/;

export function sanitizeHexColor(value: string | null | undefined, fallback: string): string {
  if (!value || !HEX_COLOR.test(value.trim())) {
    return fallback;
  }
  return value.trim();
}

export function sanitizeStoreFont(value: string | null | undefined, fallback = 'Inter'): string {
  const trimmed = value?.trim();
  if (!trimmed || !ALLOWED_STORE_FONTS.has(trimmed)) {
    return fallback;
  }
  return trimmed;
}

export function sanitizeCssSize(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed || !CSS_SIZE.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}

/** Échappe une valeur pour interpolation dans une déclaration CSS. */
export function escapeCssValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
}
