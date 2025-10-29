/**
 * 💎 JEWELRY & ACCESSORIES TEMPLATE
 * Luxury template for jewelry and accessories
 * Inspired by: Tiffany & Co., Cartier, Pandora
 */

import { TemplateV2 } from '@/types/templates-v2';

export const jewelryAccessoriesTemplate: TemplateV2 = {
  metadata: {
    id: 'physical-jewelry-accessories-v2',
    version: '1.0.0',
    name: 'Jewelry & Accessories - Inspired by Tiffany',
    shortDescription: 'Elegant jewelry template with certification and care guides',
    description: 'Premium jewelry template with gemstone details, sizing guides, and authentication certificates',
    category: 'jewelry-accessories',
    productType: 'physical',
    tier: 'premium',
    designStyle: 'luxury',
    author: {
      name: 'Payhuk Team',
      email: 'templates@payhuk.com',
      url: 'https://payhuk.com',
    },
    tags: ['jewelry', 'luxury', 'accessories', 'gemstones', 'precious-metals', 'certified'],
    thumbnail: '/templates/physical/jewelry-thumb.jpg',
    previewImages: [
      '/templates/physical/jewelry-1.jpg',
      '/templates/physical/jewelry-2.jpg',
      '/templates/physical/jewelry-3.jpg',
      '/templates/physical/jewelry-4.jpg',
    ],
    demoUrl: 'https://demo.payhuk.com/templates/jewelry',
    industry: 'luxury',
    targetAudience: ['jewelers', 'luxury-brands', 'accessory-stores'],
    features: [
      'Certification details',
      'Ring size guide',
      'Metal purity info',
      'Gemstone specifications',
      'Care instructions',
      'Gift packaging options',
      'Engraving services',
    ],
    requirements: [
      'High-quality product photos',
      'Certification documents',
      'Material specifications',
      'Gemstone details',
    ],
    license: 'Premium License',
    price: 29,
    analytics: {
      downloads: 892,
      views: 5234,
      rating: 5.0,
      favorites: 178,
      usageCount: 534,
    },
    seo: {
      title: 'Jewelry & Accessories Template - Luxury Jewelry Store',
      metaDescription: 'Premium template for luxury jewelry with certification and detailed specifications',
      keywords: ['jewelry template', 'luxury accessories', 'gemstones', 'precious metals'],
      ogImage: '/templates/physical/jewelry-og.jpg',
    },
    createdAt: '2025-10-29T10:45:00Z',
    updatedAt: '2025-10-29T10:45:00Z',
  },
  data: {
    basic: {
      name: 'Eternal Sparkle Diamond Ring',
      slug: 'eternal-sparkle-diamond-ring',
      tagline: 'Timeless Elegance, Endless Love',
      shortDescription: 'Exquisite 18K white gold ring with certified diamond',
      fullDescription: `Celebrate your eternal love with the Eternal Sparkle Diamond Ring.

Crafted in lustrous 18K white gold, this breathtaking ring features a brilliant-cut diamond (0.5 carat) certified by GIA. The delicate pavé band adds extra sparkle, while the classic setting ensures timeless elegance.

Each ring comes with a certificate of authenticity, luxury packaging, and lifetime warranty. Complimentary engraving available.`,
      category: 'jewelry',
      subcategory: 'rings',
      brand: 'EternityJewels',
    },

    pricing: {
      basePrice: 1299.99,
      currency: 'EUR',
      salePrice: null,
      compareAtPrice: null,
      costPerItem: 650.00,
      taxable: true,
      taxCode: 'LUXURY',
    },

    visual: {
      thumbnail: '/products/ring-main.jpg',
      images: [
        '/products/ring-top.jpg',
        '/products/ring-side.jpg',
        '/products/ring-detail.jpg',
        '/products/ring-hand.jpg',
        '/products/ring-box.jpg',
      ],
      videoUrl: 'https://youtube.com/watch?v=360-view',
      has360View: true,
      hasModelPhotos: true,
    },

    seo: {
      metaTitle: 'Eternal Sparkle Diamond Ring | 18K White Gold | GIA Certified',
      metaDescription: '0.5ct certified diamond ring in 18K white gold. Lifetime warranty. Free engraving.',
      keywords: ['diamond ring', 'engagement ring', '18k white gold', 'certified diamond'],
      slug: 'eternal-sparkle-diamond-ring',
    },

    features: [
      'GIA Certified Diamond',
      '18K White Gold',
      'Handcrafted by master jewelers',
      'Pavé diamond band',
      'Lifetime warranty',
      'Free engraving',
      'Luxury gift box',
      'Certificate of authenticity',
      'Free resizing (first time)',
    ],

    benefits: [
      'Investment-grade quality',
      'Ethical sourcing',
      'Heirloom piece',
      'Expert craftsmanship',
      'Complimentary services',
    ],

    specifications: {
      metalType: '18K White Gold',
      metalPurity: '75% Gold (750)',
      metalWeight: '3.5g',
      finish: 'High Polish',
      plating: 'Rhodium Plated',
      
      // Diamond specs
      centerStone: 'Diamond',
      caratWeight: '0.50ct',
      cut: 'Brilliant Round',
      color: 'G (Near Colorless)',
      clarity: 'VS1 (Very Slightly Included)',
      certification: 'GIA',
      
      // Additional stones
      accentStones: '16 pavé diamonds (0.15ct total)',
      accentClarity: 'SI1',
      
      // Dimensions
      bandWidth: '2mm',
      setting Height: '6mm',
      profileType: 'Comfort Fit',
    },

    physical: {
      inventory: {
        sku: 'RING-DIAMOND-001',
        barcode: '7890123456789',
        trackQuantity: true,
        quantity: 15,
        lowStockThreshold: 3,
        allowBackorders: true,
        stockStatus: 'low_stock',
      },

      variants: [
        {
          id: 'var-size-6',
          name: 'Size 6 (US)',
          options: { size: '6' },
          sku: 'RING-DIA-6',
          price: 1299.99,
          stock: 3,
          image: '/products/ring-size-6.jpg',
        },
        {
          id: 'var-size-7',
          name: 'Size 7 (US)',
          options: { size: '7' },
          sku: 'RING-DIA-7',
          price: 1299.99,
          stock: 5,
          image: '/products/ring-size-7.jpg',
        },
        {
          id: 'var-size-8',
          name: 'Size 8 (US)',
          options: { size: '8' },
          sku: 'RING-DIA-8',
          price: 1299.99,
          stock: 4,
          image: '/products/ring-size-8.jpg',
        },
        {
          id: 'var-custom',
          name: 'Custom Size (Made to Order)',
          options: { size: 'Custom' },
          sku: 'RING-DIA-CUSTOM',
          price: 1349.99,
          stock: 999,
          image: '/products/ring-custom.jpg',
        },
      ],

      variantOptions: [
        {
          name: 'Ring Size',
          values: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', 'Custom'],
        },
      ],

      shipping: {
        weight: 0.05,
        weightUnit: 'kg',
        dimensions: {
          length: 8,
          width: 8,
          height: 5,
          unit: 'cm',
        },
        requiresShipping: true,
        shippingClass: 'express-insured',
        freeShippingThreshold: 0, // Free shipping on all jewelry
        insurance: 'Required (up to declared value)',
        signature: 'Required',
      },

      // Jewelry-specific fields
      ringSizeGuide: {
        method: 'Measure existing ring or use our free ring sizer',
        conversionChart: [
          { us: '5', eu: '49', uk: 'J', diameter: '15.7mm' },
          { us: '6', eu: '51.5', uk: 'L', diameter: '16.5mm' },
          { us: '7', eu: '54', uk: 'N', diameter: '17.3mm' },
          { us: '8', eu: '57', uk: 'P', diameter: '18.2mm' },
          { us: '9', eu: '59', uk: 'R', diameter: '19.0mm' },
        ],
        tips: 'Rings should fit snugly but comfortably. Consider finger swelling in heat.',
      },

      careInstructions: [
        'Clean with soft cloth and mild soap',
        'Remove during physical activities',
        'Store in provided jewelry box',
        'Professional cleaning recommended annually',
        'Avoid harsh chemicals and abrasives',
        'Re-rhodium plating every 2-3 years',
      ],

      warranty: {
        duration: 'Lifetime',
        type: 'Manufacturer warranty',
        coverage: 'Defects in materials and craftsmanship',
        services: [
          'Free resizing (first time)',
          'Free cleaning (lifetime)',
          'Free inspection (annual)',
          'Diamond security check',
        ],
      },

      certification: {
        provider: 'GIA (Gemological Institute of America)',
        number: 'GIA-2025-1234567',
        included: true,
        verifiable: 'Online at GIA.edu',
      },

      packaging: {
        standard: 'Luxury gift box with silk pouch',
        premium: 'Wooden presentation box (available)',
        giftWrapping: 'Complimentary',
        giftMessage: 'Personalized card available',
      },

      engraving: {
        available: true,
        maxCharacters: 20,
        fonts: ['Script', 'Block', 'Classic'],
        location: 'Inside band',
        cost: 'Complimentary',
        turnaround: '3-5 business days',
      },

      ethicalSourcing: {
        conflictFree: true,
        certification: 'Kimberley Process Certified',
        fairTrade: true,
        transparency: 'Full supply chain disclosure',
      },
    },

    designTokens: {
      colors: {
        primary: '#1a1a1a',
        secondary: '#f8f8f8',
        accent: '#d4af37',
        background: '#ffffff',
        text: '#2c2c2c',
      },
      typography: {
        fontFamily: 'Cormorant Garamond, serif',
        headingSize: '48px',
        bodySize: '18px',
        lineHeight: '1.8',
      },
      spacing: {
        small: '16px',
        medium: '32px',
        large: '64px',
      },
      borderRadius: '2px',
      shadows: {
        card: '0 8px 32px rgba(0,0,0,0.08)',
        hover: '0 12px 48px rgba(0,0,0,0.12)',
      },
    },

    faqs: [
      {
        question: 'Is the diamond certified?',
        answer: 'Yes, each diamond comes with a GIA certificate verifying its authenticity and specifications.',
      },
      {
        question: 'Can I customize the ring?',
        answer: 'Absolutely! We offer custom sizing, metal choices, and engraving. Contact us for bespoke designs.',
      },
      {
        question: 'What is your return policy for jewelry?',
        answer: '30-day return policy. Ring must be unworn, unaltered, and in original packaging.',
      },
      {
        question: 'Do you offer payment plans?',
        answer: 'Yes, we offer flexible payment plans through our financing partners.',
      },
      {
        question: 'Is the gold real?',
        answer: 'Yes, 18K white gold (75% pure gold) hallmarked and certified.',
      },
    ],

    customFields: {
      collection: 'Eternal Collection 2025',
      gender: 'Unisex',
      occasion: 'Engagement, Anniversary, Special Gift',
      style: 'Classic Solitaire',
      setting: 'Prong Setting',
      hypoallergenic: true,
      madeToOrder: 'Custom sizes available',
      productionTime: '2-3 weeks for custom',
      appraisalIncluded: true,
      appraisalValue: 1800.00,
      insurance: 'Certificate suitable for insurance',
    },
  },
};

export default jewelryAccessoriesTemplate;

