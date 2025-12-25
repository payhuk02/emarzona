/**
 * Templates de Size Charts par Catégorie
 * Date: 3 Février 2025
 *
 * Templates prédéfinis pour différentes catégories de produits
 */

import type { SizeChart, SizeChartMeasurement } from '@/components/physical/SizeChartBuilder';

export type ProductCategory =
  | 'clothing'
  | 'shoes'
  | 'accessories'
  | 'bags'
  | 'jewelry'
  | 'watches'
  | 'underwear'
  | 'sportswear'
  | 'kids'
  | 'maternity';

export interface SizeChartTemplate {
  id: string;
  name: string;
  category: ProductCategory;
  system: 'eu' | 'us' | 'uk' | 'asia' | 'universal';
  description?: string;
  chart: Partial<SizeChart>;
}

// =====================================================
// TEMPLATES VÊTEMENTS
// =====================================================

const clothingTemplates: SizeChartTemplate[] = [
  {
    id: 'tshirt_eu',
    name: 'T-Shirt Standard (EU)',
    category: 'clothing',
    system: 'eu',
    description: 'T-shirts et tops standards',
    chart: {
      name: 'T-Shirt Standard (EU)',
      system: 'eu',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
      measurements: [
        {
          label: 'Tour de poitrine',
          unit: 'cm',
          values: { XS: 86, S: 91, M: 96, L: 101, XL: 106, XXL: 111, XXXL: 116 },
        },
        {
          label: 'Longueur',
          unit: 'cm',
          values: { XS: 68, S: 70, M: 72, L: 74, XL: 76, XXL: 78, XXXL: 80 },
        },
        {
          label: 'Largeur épaules',
          unit: 'cm',
          values: { XS: 41, S: 42, M: 44, L: 46, XL: 48, XXL: 50, XXXL: 52 },
        },
        {
          label: 'Manche',
          unit: 'cm',
          values: { XS: 18, S: 19, M: 20, L: 21, XL: 22, XXL: 23, XXXL: 24 },
        },
      ],
    },
  },
  {
    id: 'dress_eu',
    name: 'Robe Standard (EU)',
    category: 'clothing',
    system: 'eu',
    description: 'Robes et jupes',
    chart: {
      name: 'Robe Standard (EU)',
      system: 'eu',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      measurements: [
        {
          label: 'Tour de poitrine',
          unit: 'cm',
          values: { XS: 80, S: 84, M: 88, L: 92, XL: 96, XXL: 100 },
        },
        {
          label: 'Tour de taille',
          unit: 'cm',
          values: { XS: 60, S: 64, M: 68, L: 72, XL: 76, XXL: 80 },
        },
        {
          label: 'Tour de hanches',
          unit: 'cm',
          values: { XS: 86, S: 90, M: 94, L: 98, XL: 102, XXL: 106 },
        },
        {
          label: 'Longueur',
          unit: 'cm',
          values: { XS: 100, S: 102, M: 104, L: 106, XL: 108, XXL: 110 },
        },
      ],
    },
  },
  {
    id: 'pants_eu',
    name: 'Pantalon Standard (EU)',
    category: 'clothing',
    system: 'eu',
    description: 'Pantalons et jeans',
    chart: {
      name: 'Pantalon Standard (EU)',
      system: 'eu',
      sizes: ['28', '30', '32', '34', '36', '38', '40', '42'],
      measurements: [
        {
          label: 'Tour de taille',
          unit: 'cm',
          values: {
            '28': 71,
            '30': 76,
            '32': 81,
            '34': 86,
            '36': 91,
            '38': 96,
            '40': 101,
            '42': 106,
          },
        },
        {
          label: 'Tour de hanches',
          unit: 'cm',
          values: {
            '28': 89,
            '30': 94,
            '32': 99,
            '34': 104,
            '36': 109,
            '38': 114,
            '40': 119,
            '42': 124,
          },
        },
        {
          label: 'Longueur jambe',
          unit: 'cm',
          values: {
            '28': 81,
            '30': 81,
            '32': 81,
            '34': 81,
            '36': 81,
            '38': 81,
            '40': 81,
            '42': 81,
          },
        },
        {
          label: 'Largeur cuisse',
          unit: 'cm',
          values: {
            '28': 52,
            '30': 54,
            '32': 56,
            '34': 58,
            '36': 60,
            '38': 62,
            '40': 64,
            '42': 66,
          },
        },
      ],
    },
  },
  {
    id: 'jacket_eu',
    name: 'Veste/Manteau (EU)',
    category: 'clothing',
    system: 'eu',
    description: 'Vestes, manteaux et blazers',
    chart: {
      name: 'Veste/Manteau (EU)',
      system: 'eu',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      measurements: [
        {
          label: 'Tour de poitrine',
          unit: 'cm',
          values: { XS: 88, S: 93, M: 98, L: 103, XL: 108, XXL: 113 },
        },
        {
          label: 'Longueur',
          unit: 'cm',
          values: { XS: 70, S: 72, M: 74, L: 76, XL: 78, XXL: 80 },
        },
        {
          label: 'Largeur épaules',
          unit: 'cm',
          values: { XS: 42, S: 44, M: 46, L: 48, XL: 50, XXL: 52 },
        },
        {
          label: 'Manche',
          unit: 'cm',
          values: { XS: 60, S: 61, M: 62, L: 63, XL: 64, XXL: 65 },
        },
      ],
    },
  },
];

// =====================================================
// TEMPLATES CHAUSSURES
// =====================================================

const shoesTemplates: SizeChartTemplate[] = [
  {
    id: 'shoes_eu',
    name: 'Chaussures Standard (EU)',
    category: 'shoes',
    system: 'eu',
    description: 'Chaussures standards',
    chart: {
      name: 'Chaussures Standard (EU)',
      system: 'eu',
      sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
      measurements: [
        {
          label: 'Longueur du pied',
          unit: 'cm',
          values: {
            '36': 23.0,
            '37': 23.5,
            '38': 24.0,
            '39': 24.5,
            '40': 25.0,
            '41': 25.5,
            '42': 26.0,
            '43': 26.5,
            '44': 27.0,
            '45': 27.5,
            '46': 28.0,
          },
        },
        {
          label: 'Largeur du pied',
          unit: 'cm',
          values: {
            '36': 9.0,
            '37': 9.2,
            '38': 9.4,
            '39': 9.6,
            '40': 9.8,
            '41': 10.0,
            '42': 10.2,
            '43': 10.4,
            '44': 10.6,
            '45': 10.8,
            '46': 11.0,
          },
        },
      ],
    },
  },
  {
    id: 'shoes_us',
    name: 'Chaussures Standard (US)',
    category: 'shoes',
    system: 'us',
    description: 'Chaussures standards US',
    chart: {
      name: 'Chaussures Standard (US)',
      system: 'us',
      sizes: [
        '5',
        '5.5',
        '6',
        '6.5',
        '7',
        '7.5',
        '8',
        '8.5',
        '9',
        '9.5',
        '10',
        '10.5',
        '11',
        '11.5',
        '12',
      ],
      measurements: [
        {
          label: 'Longueur du pied',
          unit: 'inch',
          values: {
            '5': 9.0,
            '5.5': 9.2,
            '6': 9.4,
            '6.5': 9.6,
            '7': 9.8,
            '7.5': 10.0,
            '8': 10.2,
            '8.5': 10.4,
            '9': 10.6,
            '9.5': 10.8,
            '10': 11.0,
            '10.5': 11.2,
            '11': 11.4,
            '11.5': 11.6,
            '12': 11.8,
          },
        },
      ],
    },
  },
];

// =====================================================
// TEMPLATES ACCESSOIRES
// =====================================================

const accessoriesTemplates: SizeChartTemplate[] = [
  {
    id: 'hat_universal',
    name: 'Chapeaux/Casquettes',
    category: 'accessories',
    system: 'universal',
    description: 'Chapeaux et casquettes',
    chart: {
      name: 'Chapeaux/Casquettes',
      system: 'universal',
      sizes: ['S', 'M', 'L', 'XL'],
      measurements: [
        {
          label: 'Tour de tête',
          unit: 'cm',
          values: { S: 54, M: 56, L: 58, XL: 60 },
        },
      ],
    },
  },
  {
    id: 'gloves_universal',
    name: 'Gants',
    category: 'accessories',
    system: 'universal',
    description: 'Gants',
    chart: {
      name: 'Gants',
      system: 'universal',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      measurements: [
        {
          label: 'Longueur main',
          unit: 'cm',
          values: { XS: 16, S: 17, M: 18, L: 19, XL: 20 },
        },
        {
          label: 'Largeur main',
          unit: 'cm',
          values: { XS: 7.5, S: 8, M: 8.5, L: 9, XL: 9.5 },
        },
      ],
    },
  },
];

// =====================================================
// TEMPLATES SACS
// =====================================================

const bagsTemplates: SizeChartTemplate[] = [
  {
    id: 'bag_universal',
    name: 'Sac à main/Sac à dos',
    category: 'bags',
    system: 'universal',
    description: 'Sacs à main et sacs à dos',
    chart: {
      name: 'Sac à main/Sac à dos',
      system: 'universal',
      sizes: ['Petit', 'Moyen', 'Grand'],
      measurements: [
        {
          label: 'Longueur',
          unit: 'cm',
          values: { Petit: 25, Moyen: 30, Grand: 35 },
        },
        {
          label: 'Largeur',
          unit: 'cm',
          values: { Petit: 20, Moyen: 25, Grand: 30 },
        },
        {
          label: 'Hauteur',
          unit: 'cm',
          values: { Petit: 15, Moyen: 20, Grand: 25 },
        },
      ],
    },
  },
];

// =====================================================
// TEMPLATES BIJOUX
// =====================================================

const jewelryTemplates: SizeChartTemplate[] = [
  {
    id: 'ring_universal',
    name: 'Bagues',
    category: 'jewelry',
    system: 'universal',
    description: 'Bagues',
    chart: {
      name: 'Bagues',
      system: 'universal',
      sizes: ['48', '50', '52', '54', '56', '58', '60', '62', '64'],
      measurements: [
        {
          label: 'Tour de doigt',
          unit: 'mm',
          values: {
            '48': 15.3,
            '50': 15.9,
            '52': 16.5,
            '54': 17.1,
            '56': 17.7,
            '58': 18.3,
            '60': 18.9,
            '62': 19.5,
            '64': 20.1,
          },
        },
        {
          label: 'Diamètre intérieur',
          unit: 'mm',
          values: {
            '48': 4.9,
            '50': 5.1,
            '52': 5.3,
            '54': 5.5,
            '56': 5.7,
            '58': 5.9,
            '60': 6.1,
            '62': 6.3,
            '64': 6.5,
          },
        },
      ],
    },
  },
  {
    id: 'bracelet_universal',
    name: 'Bracelets',
    category: 'jewelry',
    system: 'universal',
    description: 'Bracelets',
    chart: {
      name: 'Bracelets',
      system: 'universal',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      measurements: [
        {
          label: 'Tour de poignet',
          unit: 'cm',
          values: { XS: 14, S: 15, M: 16, L: 17, XL: 18 },
        },
      ],
    },
  },
];

// =====================================================
// TEMPLATES SPORT
// =====================================================

const sportswearTemplates: SizeChartTemplate[] = [
  {
    id: 'sportswear_eu',
    name: 'Vêtements de Sport (EU)',
    category: 'sportswear',
    system: 'eu',
    description: 'Vêtements de sport et fitness',
    chart: {
      name: 'Vêtements de Sport (EU)',
      system: 'eu',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      measurements: [
        {
          label: 'Tour de poitrine',
          unit: 'cm',
          values: { XS: 88, S: 93, M: 98, L: 103, XL: 108, XXL: 113 },
        },
        {
          label: 'Tour de taille',
          unit: 'cm',
          values: { XS: 70, S: 75, M: 80, L: 85, XL: 90, XXL: 95 },
        },
        {
          label: 'Tour de hanches',
          unit: 'cm',
          values: { XS: 90, S: 95, M: 100, L: 105, XL: 110, XXL: 115 },
        },
      ],
    },
  },
];

// =====================================================
// TEMPLATES ENFANTS
// =====================================================

const kidsTemplates: SizeChartTemplate[] = [
  {
    id: 'kids_clothing_eu',
    name: 'Vêtements Enfants (EU)',
    category: 'kids',
    system: 'eu',
    description: 'Vêtements pour enfants',
    chart: {
      name: 'Vêtements Enfants (EU)',
      system: 'eu',
      sizes: ['2 ans', '4 ans', '6 ans', '8 ans', '10 ans', '12 ans', '14 ans'],
      measurements: [
        {
          label: 'Tour de poitrine',
          unit: 'cm',
          values: {
            '2 ans': 52,
            '4 ans': 56,
            '6 ans': 60,
            '8 ans': 64,
            '10 ans': 68,
            '12 ans': 72,
            '14 ans': 76,
          },
        },
        {
          label: 'Tour de taille',
          unit: 'cm',
          values: {
            '2 ans': 50,
            '4 ans': 52,
            '6 ans': 54,
            '8 ans': 56,
            '10 ans': 58,
            '12 ans': 60,
            '14 ans': 62,
          },
        },
        {
          label: 'Longueur',
          unit: 'cm',
          values: {
            '2 ans': 40,
            '4 ans': 48,
            '6 ans': 56,
            '8 ans': 64,
            '10 ans': 72,
            '12 ans': 80,
            '14 ans': 88,
          },
        },
      ],
    },
  },
];

// =====================================================
// EXPORT UNIFIÉ
// =====================================================

export const SIZE_CHART_TEMPLATES: SizeChartTemplate[] = [
  ...clothingTemplates,
  ...shoesTemplates,
  ...accessoriesTemplates,
  ...bagsTemplates,
  ...jewelryTemplates,
  ...sportswearTemplates,
  ...kidsTemplates,
];

export const TEMPLATES_BY_CATEGORY: Record<ProductCategory, SizeChartTemplate[]> = {
  clothing: clothingTemplates,
  shoes: shoesTemplates,
  accessories: accessoriesTemplates,
  bags: bagsTemplates,
  jewelry: jewelryTemplates,
  watches: [],
  underwear: [],
  sportswear: sportswearTemplates,
  kids: kidsTemplates,
  maternity: [],
};

/**
 * Récupère les templates pour une catégorie donnée
 */
export function getTemplatesByCategory(category: ProductCategory): SizeChartTemplate[] {
  return TEMPLATES_BY_CATEGORY[category] || [];
}

/**
 * Récupère un template par son ID
 */
export function getTemplateById(id: string): SizeChartTemplate | undefined {
  return SIZE_CHART_TEMPLATES.find(t => t.id === id);
}

/**
 * Récupère tous les templates
 */
export function getAllTemplates(): SizeChartTemplate[] {
  return SIZE_CHART_TEMPLATES;
}

