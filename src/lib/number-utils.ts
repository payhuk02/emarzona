/**
 * Utilitaires pour les opérations sur les nombres
 * Fournit des fonctions réutilisables pour manipuler et formater les nombres
 */

export interface RoundOptions {
  /**
   * Nombre de décimales
   * @default 2
   */
  decimals?: number;
  /**
   * Mode d'arrondi: 'round', 'floor', 'ceil'
   * @default 'round'
   */
  mode?: 'round' | 'floor' | 'ceil';
}

/**
 * Arrondit un nombre avec options
 */
export function round(
  value: number,
  options: RoundOptions = {}
): number {
  const { decimals = 2, mode = 'round' } = options;
  const multiplier = Math.pow(10, decimals);

  switch (mode) {
    case 'floor':
      return Math.floor(value * multiplier) / multiplier;
    case 'ceil':
      return Math.ceil(value * multiplier) / multiplier;
    case 'round':
    default:
      return Math.round(value * multiplier) / multiplier;
  }
}

/**
 * Arrondit un nombre vers le bas
 */
export function floor(value: number, decimals: number = 0): number {
  return round(value, { decimals, mode: 'floor' });
}

/**
 * Arrondit un nombre vers le haut
 */
export function ceil(value: number, decimals: number = 0): number {
  return round(value, { decimals, mode: 'ceil' });
}

/**
 * Clamp un nombre entre min et max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Vérifie si un nombre est dans une plage
 */
export function isInRange(
  value: number,
  min: number,
  max: number,
  inclusive: boolean = true
): boolean {
  if (inclusive) {
    return value >= min && value <= max;
  }
  return value > min && value < max;
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(
  value: number,
  locale: string = 'fr-FR',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Formate un nombre en pourcentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Formate un nombre en notation compacte (1K, 1M, etc.)
 */
export function formatCompact(
  value: number,
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Parse un nombre depuis une chaîne
 */
export function parseNumber(
  value: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Vérifie si une valeur est un nombre valide
 */
export function isNumeric(value: unknown): value is number {
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  if (typeof value === 'string') {
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
  }
  return false;
}

/**
 * Calcule le pourcentage d'une valeur par rapport à un total
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimals: number = 1
): number {
  if (total === 0) return 0;
  return round((value / total) * 100, { decimals });
}

/**
 * Calcule la différence en pourcentage entre deux valeurs
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number,
  decimals: number = 1
): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return round(((newValue - oldValue) / oldValue) * 100, { decimals });
}

/**
 * Génère un nombre aléatoire dans une plage
 */
export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Génère un nombre aléatoire avec décimales
 */
export function randomFloat(min: number, max: number, decimals: number = 2): number {
  const value = Math.random() * (max - min) + min;
  return round(value, { decimals });
}

/**
 * Calcule la moyenne d'un tableau de nombres
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return sum / numbers.length;
}

/**
 * Calcule la somme d'un tableau de nombres
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, val) => acc + val, 0);
}

/**
 * Trouve le minimum dans un tableau de nombres
 */
export function min(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return Math.min(...numbers);
}

/**
 * Trouve le maximum dans un tableau de nombres
 */
export function max(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return Math.max(...numbers);
}

/**
 * Normalise un nombre entre 0 et 1
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

/**
 * Dénormalise un nombre (inverse de normalize)
 */
export function denormalize(
  normalized: number,
  min: number,
  max: number
): number {
  return normalized * (max - min) + min;
}

/**
 * Interpole linéairement entre deux valeurs
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Formate un nombre avec un préfixe/suffixe
 */
export function formatWithPrefixSuffix(
  value: number,
  prefix: string = '',
  suffix: string = '',
  decimals: number = 2
): string {
  const formatted = round(value, { decimals }).toString();
  return `${prefix}${formatted}${suffix}`;
}

/**
 * Vérifie si deux nombres sont approximativement égaux (avec tolérance)
 */
export function isApproximatelyEqual(
  a: number,
  b: number,
  tolerance: number = 0.0001
): boolean {
  return Math.abs(a - b) < tolerance;
}

