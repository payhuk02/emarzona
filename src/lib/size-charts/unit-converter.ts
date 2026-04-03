/**
 * Utilitaire de Conversion d'Unités pour Size Charts
 * Date: 3 Février 2025
 *
 * Conversion automatique entre cm, inch, mm
 */

export type MeasurementUnit = 'cm' | 'inch' | 'mm';

// =====================================================
// FACTEURS DE CONVERSION
// =====================================================

const  CONVERSION_FACTORS: Record<MeasurementUnit, Record<MeasurementUnit, number>> = {
  cm: {
    cm: 1,
    inch: 0.393701,
    mm: 10,
  },
  inch: {
    cm: 2.54,
    inch: 1,
    mm: 25.4,
  },
  mm: {
    cm: 0.1,
    inch: 0.0393701,
    mm: 1,
  },
};

// =====================================================
// FONCTIONS DE CONVERSION
// =====================================================

/**
 * Convertit une valeur d'une unité à une autre
 */
export function convertUnit(
  value: number,
  fromUnit: MeasurementUnit,
  toUnit: MeasurementUnit
): number {
  if (fromUnit === toUnit) return value;

  const factor = CONVERSION_FACTORS[fromUnit][toUnit];
  return value * factor;
}

/**
 * Convertit toutes les valeurs d'un objet de mesures
 */
export function convertMeasurementValues(
  values: Record<string, number | string>,
  fromUnit: MeasurementUnit,
  toUnit: MeasurementUnit
): Record<string, number | string> {
  if (fromUnit === toUnit) return values;

  const  converted: Record<string, number | string> = {};

  for (const [key, val] of Object.entries(values)) {
    if (typeof val === 'number') {
      converted[key] = parseFloat(convertUnit(val, fromUnit, toUnit).toFixed(2));
    } else if (typeof val === 'string') {
      const numVal = parseFloat(val);
      if (!isNaN(numVal)) {
        converted[key] = convertUnit(numVal, fromUnit, toUnit).toFixed(2);
      } else {
        converted[key] = val;
      }
    } else {
      converted[key] = val;
    }
  }

  return converted;
}

/**
 * Formate une valeur avec son unité
 */
export function formatValue(value: number, unit: MeasurementUnit, decimals: number = 1): string {
  return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Formate une valeur convertie
 */
export function formatConvertedValue(
  value: number,
  fromUnit: MeasurementUnit,
  toUnit: MeasurementUnit,
  decimals: number = 1
): string {
  const converted = convertUnit(value, fromUnit, toUnit);
  return formatValue(converted, toUnit, decimals);
}

/**
 * Convertit un size chart complet d'une unité à une autre
 */
export function convertSizeChartUnit(
  chart: {
    measurements: Array<{
      label: string;
      unit: MeasurementUnit;
      values: Record<string, number | string>;
    }>;
  },
  targetUnit: MeasurementUnit
): {
  measurements: Array<{
    label: string;
    unit: MeasurementUnit;
    values: Record<string, number | string>;
  }>;
} {
  return {
    measurements: chart.measurements.map(measurement => ({
      ...measurement,
      unit: targetUnit,
      values: convertMeasurementValues(measurement.values, measurement.unit, targetUnit),
    })),
  };
}

/**
 * Récupère l'unité recommandée selon le système de taille
 */
export function getRecommendedUnit(
  system: 'eu' | 'us' | 'uk' | 'asia' | 'universal'
): MeasurementUnit {
  switch (system) {
    case 'us':
    case 'uk':
      return 'inch';
    case 'eu':
    case 'asia':
    case 'universal':
    default:
      return 'cm';
  }
}

/**
 * Convertit automatiquement les unités selon le système de taille
 */
export function autoConvertUnits(chart: {
  system: 'eu' | 'us' | 'uk' | 'asia' | 'universal';
  measurements: Array<{
    label: string;
    unit: MeasurementUnit;
    values: Record<string, number | string>;
  }>;
}): {
  measurements: Array<{
    label: string;
    unit: MeasurementUnit;
    values: Record<string, number | string>;
  }>;
} {
  const recommendedUnit = getRecommendedUnit(chart.system);

  return convertSizeChartUnit(chart, recommendedUnit);
}

// =====================================================
// UTILITAIRES D'AFFICHAGE
// =====================================================

/**
 * Récupère le symbole d'unité
 */
export function getUnitSymbol(unit: MeasurementUnit): string {
  const  symbols: Record<MeasurementUnit, string> = {
    cm: 'cm',
    inch: '"',
    mm: 'mm',
  };
  return symbols[unit];
}

/**
 * Récupère le label complet de l'unité
 */
export function getUnitLabel(unit: MeasurementUnit): string {
  const  labels: Record<MeasurementUnit, string> = {
    cm: 'Centimètres',
    inch: 'Pouces',
    mm: 'Millimètres',
  };
  return labels[unit];
}

/**
 * Formate une valeur avec symbole d'unité
 */
export function formatValueWithSymbol(
  value: number,
  unit: MeasurementUnit,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)} ${getUnitSymbol(unit)}`;
}







