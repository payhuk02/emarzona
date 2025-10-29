/**
 * 💄 COSMETICS & BEAUTY TEMPLATE
 * Professional template for beauty products
 * Inspired by: Sephora, Glossier, Fenty Beauty
 */

import { TemplateV2 } from '@/types/templates-v2';

export const cosmeticsBeautyTemplate: TemplateV2 = {
  metadata: {
    id: 'physical-cosmetics-beauty-v2',
    version: '1.0.0',
    name: 'Cosmetics & Beauty - Inspired by Sephora',
    shortDescription: 'Luxurious beauty product template with ingredients and usage',
    description: 'Complete cosmetics template with ingredient lists, skin type guides, and beauty tutorials',
    category: 'beauty-cosmetics',
    productType: 'physical',
    tier: 'free',
    designStyle: 'elegant',
    author: {
      name: 'Payhuk Team',
      email: 'templates@payhuk.com',
      url: 'https://payhuk.com',
    },
    tags: ['cosmetics', 'beauty', 'skincare', 'makeup', 'ingredients', 'cruelty-free'],
    thumbnail: '/templates/physical/cosmetics-thumb.jpg',
    previewImages: [
      '/templates/physical/cosmetics-1.jpg',
      '/templates/physical/cosmetics-2.jpg',
      '/templates/physical/cosmetics-3.jpg',
      '/templates/physical/cosmetics-4.jpg',
    ],
    demoUrl: 'https://demo.payhuk.com/templates/cosmetics',
    industry: 'beauty',
    targetAudience: ['beauty-brands', 'cosmetics-stores', 'skincare-lines'],
    features: [
      'Ingredient transparency',
      'Skin type guide',
      'How-to videos',
      'Before/after gallery',
      'Shade finder',
      'Allergen warnings',
      'Certifications display',
    ],
    requirements: [
      'Product ingredients list',
      'Swatch images',
      'Usage instructions',
      'Safety information',
    ],
    license: 'Standard License',
    price: 0,
    analytics: {
      downloads: 2634,
      views: 11892,
      rating: 4.9,
      favorites: 312,
      usageCount: 1445,
    },
    seo: {
      title: 'Cosmetics & Beauty Template - Luxury Beauty Store',
      metaDescription: 'Professional template for beauty products with full ingredient transparency',
      keywords: ['cosmetics template', 'beauty products', 'skincare', 'makeup'],
      ogImage: '/templates/physical/cosmetics-og.jpg',
    },
    createdAt: '2025-10-29T10:30:00Z',
    updatedAt: '2025-10-29T10:30:00Z',
  },
  data: {
    basic: {
      name: 'Radiance Glow Serum',
      slug: 'radiance-glow-serum',
      tagline: 'Illuminate Your Natural Beauty',
      shortDescription: 'Vitamin C serum for brighter, more radiant skin',
      fullDescription: `Unlock your skin's natural radiance with our Radiance Glow Serum.

Formulated with 20% Vitamin C, hyaluronic acid, and botanical extracts, this powerful serum brightens, hydrates, and evens skin tone. The lightweight formula absorbs quickly, leaving no greasy residue.

Clinical results show 92% of users saw visible improvements in skin brightness within 4 weeks. Dermatologist-tested, cruelty-free, and suitable for all skin types.`,
      category: 'skincare',
      subcategory: 'serums',
      brand: 'GlowLab',
    },

    pricing: {
      basePrice: 49.99,
      currency: 'EUR',
      salePrice: 39.99,
      compareAtPrice: 69.99,
      costPerItem: 18.00,
      taxable: true,
      taxCode: 'COSMETICS',
    },

    visual: {
      thumbnail: '/products/serum-main.jpg',
      images: [
        '/products/serum-bottle.jpg',
        '/products/serum-texture.jpg',
        '/products/serum-before-after.jpg',
        '/products/serum-ingredients.jpg',
        '/products/serum-lifestyle.jpg',
      ],
      videoUrl: 'https://youtube.com/watch?v=how-to-use',
      has360View: false,
      hasModelPhotos: true,
    },

    seo: {
      metaTitle: 'Radiance Glow Serum | Vitamin C Serum for Bright Skin',
      metaDescription: '20% Vitamin C serum for radiant skin. Clinically proven results. Cruelty-free & vegan.',
      keywords: ['vitamin c serum', 'brightening serum', 'glow serum', 'radiance serum'],
      slug: 'radiance-glow-serum',
    },

    features: [
      '20% Pure Vitamin C (L-Ascorbic Acid)',
      'Hyaluronic Acid for hydration',
      'Ferulic Acid antioxidant boost',
      'Botanical extracts blend',
      'Fast-absorbing formula',
      'Dermatologist-tested',
      'Cruelty-free & Vegan',
      'Fragrance-free',
      'Non-comedogenic',
    ],

    benefits: [
      'Brightens dull skin',
      'Evens skin tone',
      'Reduces dark spots',
      'Boosts collagen production',
      'Protects against free radicals',
      'Hydrates and plumps',
    ],

    specifications: {
      volume: '30ml',
      texture: 'Lightweight Serum',
      scent: 'Fragrance-Free',
      color: 'Clear to Light Yellow',
      ph: '3.5',
      shelfLife: '12 months after opening',
      storage: 'Store in a cool, dark place',
      packaging: 'Airless pump bottle',
      recyclable: true,
    },

    physical: {
      inventory: {
        sku: 'SERUM-GLOW-001',
        barcode: '5432167890123',
        trackQuantity: true,
        quantity: 250,
        lowStockThreshold: 25,
        allowBackorders: true,
        stockStatus: 'in_stock',
      },

      variants: [
        {
          id: 'var-30ml',
          name: '30ml Bottle',
          options: { size: '30ml' },
          sku: 'SERUM-30ML',
          price: 49.99,
          stock: 150,
          image: '/products/serum-30ml.jpg',
        },
        {
          id: 'var-50ml',
          name: '50ml Bottle (Value Size)',
          options: { size: '50ml' },
          sku: 'SERUM-50ML',
          price: 69.99,
          stock: 100,
          image: '/products/serum-50ml.jpg',
        },
      ],

      variantOptions: [
        {
          name: 'Size',
          values: ['30ml', '50ml'],
        },
      ],

      shipping: {
        weight: 0.08,
        weightUnit: 'kg',
        dimensions: {
          length: 12,
          width: 5,
          height: 5,
          unit: 'cm',
        },
        requiresShipping: true,
        shippingClass: 'standard',
        freeShippingThreshold: 50,
        temperatureControlled: false,
      },

      // Beauty-specific fields
      ingredients: {
        full: 'Aqua, L-Ascorbic Acid (20%), Hyaluronic Acid, Ferulic Acid, Vitamin E, Aloe Barbadensis Leaf Extract, Glycerin, Phenoxyethanol, Ethylhexylglycerin',
        keyIngredients: [
          {
            name: 'L-Ascorbic Acid (Vitamin C)',
            percentage: '20%',
            benefit: 'Brightens and evens skin tone',
          },
          {
            name: 'Hyaluronic Acid',
            percentage: '2%',
            benefit: 'Deeply hydrates and plumps skin',
          },
          {
            name: 'Ferulic Acid',
            percentage: '0.5%',
            benefit: 'Antioxidant protection',
          },
        ],
        free From: ['Parabens', 'Sulfates', 'Phthalates', 'Fragrance', 'Mineral Oil'],
      },

      usage: {
        howToUse: [
          'Cleanse face thoroughly',
          'Apply 3-4 drops to fingertips',
          'Gently pat onto face and neck',
          'Allow to absorb for 1-2 minutes',
          'Follow with moisturizer and SPF (AM)',
        ],
        frequency: 'Use morning and evening',
        bestUsedWith: ['Vitamin C Moisturizer', 'SPF 50 Sunscreen'],
        patchTestRecommended: true,
      },

      skinTypeGuide: {
        suitable: ['All skin types', 'Dull skin', 'Uneven tone', 'Aging skin'],
        idealFor: 'Normal to Dry skin',
        cautions: 'May tingle on first use - this is normal',
      },

      certifications: [
        'Cruelty-Free (Leaping Bunny)',
        'Vegan Society Certified',
        'Dermatologist Tested',
        'Hypoallergenic',
      ],

      clinicalResults: {
        studyParticipants: 100,
        duration: '4 weeks',
        results: [
          '92% saw brighter skin',
          '87% noticed more even tone',
          '83% saw reduced dark spots',
          '95% would recommend',
        ],
      },
    },

    designTokens: {
      colors: {
        primary: '#f7e7ce',
        secondary: '#d4a373',
        accent: '#c9a879',
        background: '#fffaf5',
        text: '#4a3f35',
      },
      typography: {
        fontFamily: 'Playfair Display, serif',
        headingSize: '36px',
        bodySize: '16px',
        lineHeight: '1.7',
      },
      spacing: {
        small: '12px',
        medium: '24px',
        large: '40px',
      },
      borderRadius: '8px',
      shadows: {
        card: '0 4px 20px rgba(212,163,115,0.15)',
        hover: '0 8px 30px rgba(212,163,115,0.25)',
      },
    },

    faqs: [
      {
        question: 'Can I use this if I have sensitive skin?',
        answer: 'Yes! Our formula is dermatologist-tested and hypoallergenic. However, we recommend a patch test first.',
      },
      {
        question: 'When will I see results?',
        answer: 'Most users notice brighter skin within 2 weeks. Full results typically appear after 4-6 weeks of consistent use.',
      },
      {
        question: 'Should I use it morning or night?',
        answer: 'Use twice daily - morning and evening. Always follow with SPF in the morning as Vitamin C can increase sun sensitivity.',
      },
      {
        question: 'Is it cruelty-free?',
        answer: 'Absolutely! We\'re certified cruelty-free and vegan.',
      },
      {
        question: 'How should I store it?',
        answer: 'Store in a cool, dark place. Vitamin C is sensitive to light and air, which is why we use an airless pump bottle.',
      },
    ],

    customFields: {
      concerns: ['Dullness', 'Uneven Tone', 'Dark Spots', 'Fine Lines'],
      texture: 'Lightweight Serum',
      finish: 'Natural Glow',
      timeOfUse: 'Morning & Evening',
      layering: 'Apply before moisturizer',
      madeIn: 'South Korea',
      shelfLifeUnopened: '24 months',
      animalTesting: 'Never',
      sustainable: true,
      recycling: 'Bottle and pump are recyclable',
    },
  },
};

export default cosmeticsBeautyTemplate;

