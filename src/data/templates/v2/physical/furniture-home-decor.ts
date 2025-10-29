/**
 * 🛋️ FURNITURE & HOME DECOR TEMPLATE
 * Professional template for furniture and home goods
 * Inspired by: IKEA, West Elm, Wayfair
 */

import { TemplateV2 } from '@/types/templates-v2';

export const furnitureHomeDecorTemplate: TemplateV2 = {
  metadata: {
    id: 'physical-furniture-home-decor-v2',
    version: '1.0.0',
    name: 'Furniture & Home Decor - Inspired by West Elm',
    shortDescription: 'Modern furniture template with assembly guides and room planners',
    description: 'Complete furniture template with dimensions, assembly instructions, and AR visualization',
    category: 'furniture-home-decor',
    productType: 'physical',
    tier: 'free',
    designStyle: 'modern',
    author: {
      name: 'Payhuk Team',
      email: 'templates@payhuk.com',
      url: 'https://payhuk.com',
    },
    tags: ['furniture', 'home-decor', 'interior-design', 'assembly', 'dimensions'],
    thumbnail: '/templates/physical/furniture-thumb.jpg',
    previewImages: [
      '/templates/physical/furniture-1.jpg',
      '/templates/physical/furniture-2.jpg',
      '/templates/physical/furniture-3.jpg',
      '/templates/physical/furniture-4.jpg',
    ],
    demoUrl: 'https://demo.payhuk.com/templates/furniture',
    industry: 'home-living',
    targetAudience: ['furniture-stores', 'home-decor-shops', 'interior-designers'],
    features: [
      'Detailed dimensions',
      'Assembly instructions',
      'Room planner integration',
      'AR visualization',
      'Multiple angle views',
      'Material specifications',
      'Weight capacity',
    ],
    requirements: [
      'Product dimensions',
      'Assembly guides',
      'Room scene photos',
      'Material details',
    ],
    license: 'Standard License',
    price: 0,
    analytics: {
      downloads: 2245,
      views: 9876,
      rating: 4.7,
      favorites: 201,
      usageCount: 1234,
    },
    seo: {
      title: 'Furniture & Home Decor Template - Modern Furniture Store',
      metaDescription: 'Professional template for furniture with detailed specs and assembly guides',
      keywords: ['furniture template', 'home decor', 'interior design', 'assembly'],
      ogImage: '/templates/physical/furniture-og.jpg',
    },
    createdAt: '2025-10-29T11:00:00Z',
    updatedAt: '2025-10-29T11:00:00Z',
  },
  data: {
    basic: {
      name: 'Nordic Modern Sofa',
      slug: 'nordic-modern-sofa',
      tagline: 'Scandinavian Comfort Meets Contemporary Style',
      shortDescription: '3-seater sofa with premium fabric and solid wood legs',
      fullDescription: `Transform your living space with the Nordic Modern Sofa.

Inspired by Scandinavian design principles, this 3-seater sofa combines clean lines with plush comfort. The premium linen-blend fabric and solid oak legs create a timeless piece that complements any interior.

Deep, supportive cushions filled with high-density foam ensure lasting comfort. Easy assembly in under 30 minutes with included tools.`,
      category: 'furniture',
      subcategory: 'sofas',
      brand: 'NordicHome',
    },

    pricing: {
      basePrice: 899.99,
      currency: 'EUR',
      salePrice: 749.99,
      compareAtPrice: 1199.99,
      costPerItem: 400.00,
      taxable: true,
      taxCode: 'FURNITURE',
    },

    visual: {
      thumbnail: '/products/sofa-main.jpg',
      images: [
        '/products/sofa-front.jpg',
        '/products/sofa-angle.jpg',
        '/products/sofa-detail.jpg',
        '/products/sofa-room.jpg',
        '/products/sofa-dimensions.jpg',
      ],
      videoUrl: 'https://youtube.com/watch?v=assembly-guide',
      has360View: true,
      hasModelPhotos: false,
    },

    seo: {
      metaTitle: 'Nordic Modern Sofa | 3-Seater | Premium Fabric',
      metaDescription: 'Scandinavian-inspired 3-seater sofa with solid oak legs. Easy assembly. Free shipping.',
      keywords: ['modern sofa', 'scandinavian sofa', 'nordic furniture', '3 seater sofa'],
      slug: 'nordic-modern-sofa',
    },

    features: [
      'Premium linen-blend fabric',
      'Solid oak wood legs',
      'High-density foam cushions',
      'Removable covers (machine washable)',
      'Easy 30-minute assembly',
      'Weight capacity: 300kg',
      'No-sag suspension system',
      'Stain-resistant treatment',
      'Lifetime frame warranty',
    ],

    benefits: [
      'Long-lasting comfort',
      'Easy maintenance',
      'Sustainable materials',
      'Timeless design',
      'Quick setup',
    ],

    specifications: {
      // Dimensions
      overallWidth: '210cm',
      overallDepth: '90cm',
      overallHeight: '85cm',
      seatWidth: '180cm',
      seatDepth: '55cm',
      seatHeight: '45cm',
      armHeight: '60cm',
      legHeight: '15cm',
      
      // Materials
      upholstery: '60% Linen, 40% Polyester',
      frame: 'Solid Oak Wood',
      cushionFill: 'High-density foam (35kg/m³)',
      legMaterial: 'Solid Oak',
      legFinish: 'Natural oil',
      
      // Capacity
      seatingCapacity: '3 people',
      weightCapacity: '300kg',
      
      // Care
      cleaning: 'Covers: Machine wash 30°C / Frame: Wipe with damp cloth',
      treatment: 'Stain-resistant coating',
    },

    physical: {
      inventory: {
        sku: 'SOFA-NORDIC-001',
        barcode: '4567890123456',
        trackQuantity: true,
        quantity: 50,
        lowStockThreshold: 10,
        allowBackorders: false,
        stockStatus: 'in_stock',
      },

      variants: [
        {
          id: 'var-gray',
          name: 'Light Gray',
          options: { color: 'Light Gray' },
          sku: 'SOFA-GRAY',
          price: 899.99,
          stock: 20,
          image: '/products/sofa-gray.jpg',
        },
        {
          id: 'var-beige',
          name: 'Natural Beige',
          options: { color: 'Beige' },
          sku: 'SOFA-BEIGE',
          price: 899.99,
          stock: 18,
          image: '/products/sofa-beige.jpg',
        },
        {
          id: 'var-navy',
          name: 'Deep Navy',
          options: { color: 'Navy' },
          sku: 'SOFA-NAVY',
          price: 899.99,
          stock: 12,
          image: '/products/sofa-navy.jpg',
        },
      ],

      variantOptions: [
        {
          name: 'Color',
          values: ['Light Gray', 'Natural Beige', 'Deep Navy', 'Charcoal'],
        },
      ],

      shipping: {
        weight: 65,
        weightUnit: 'kg',
        dimensions: {
          length: 215,
          width: 95,
          height: 75,
          unit: 'cm',
        },
        requiresShipping: true,
        shippingClass: 'freight',
        freeShippingThreshold: 500,
        deliveryType: 'Curbside or Room of Choice (+50€)',
        assemblyService: 'Available (+100€)',
      },

      // Furniture-specific fields
      assembly: {
        required: true,
        difficulty: 'Easy',
        estimatedTime: '30 minutes',
        tools Included: true,
        toolsRequired: ['Allen wrench (included)', 'Screwdriver (optional)'],
        instructions: 'Illustrated PDF guide + Video tutorial',
        peopleRequired: 1,
      },

      dimensions: {
        assembled: {
          width: 210,
          depth: 90,
          height: 85,
          unit: 'cm',
        },
        packaged: {
          package1: { length: 215, width: 95, height: 75, weight: 65 },
          totalPackages: 1,
        },
        doorwayRequired: {
          width: 100,
          height: 210,
          note: 'Ensure doorways and stairwells can accommodate package',
        },
      },

      roomPlanner: {
        arVisualizationAvailable: true,
        recommendedRoomSize: 'Minimum 3m x 4m',
        clearanceRequired: {
          front: '100cm (for legroom)',
          sides: '50cm (for circulation)',
        },
        pairsWellWith: ['Coffee Table', 'Side Tables', 'Floor Lamp'],
      },

      sustainability: {
        fscCertified: true,
        recyclable: true,
        sustainableMaterials: 'Oak from certified forests',
        packaging: 'Recycled cardboard',
        carbonNeutralShipping: true,
      },

      warranty: {
        duration: '10 years (frame), 2 years (cushions)',
        type: 'Manufacturer warranty',
        coverage: 'Defects in materials and workmanship',
        registration: 'Online registration extends to 12 years',
      },

      careInstructions: [
        'Vacuum regularly with soft brush attachment',
        'Remove and wash covers according to care label',
        'Rotate cushions monthly for even wear',
        'Keep away from direct sunlight',
        'Treat spills immediately with clean, damp cloth',
        'Professional cleaning recommended annually',
      ],
    },

    designTokens: {
      colors: {
        primary: '#3e4c59',
        secondary: '#f7f7f5',
        accent: '#c9a869',
        background: '#ffffff',
        text: '#2c2c2c',
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        headingSize: '36px',
        bodySize: '16px',
        lineHeight: '1.6',
      },
      spacing: {
        small: '16px',
        medium: '32px',
        large: '48px',
      },
      borderRadius: '8px',
      shadows: {
        card: '0 4px 16px rgba(0,0,0,0.08)',
        hover: '0 8px 24px rgba(0,0,0,0.12)',
      },
    },

    faqs: [
      {
        question: 'How difficult is assembly?',
        answer: 'Very easy! Most customers assemble in under 30 minutes. All tools and instructions are included.',
      },
      {
        question: 'Are the covers removable and washable?',
        answer: 'Yes, all covers are removable and machine washable at 30°C.',
      },
      {
        question: 'Will it fit through my door?',
        answer: 'The package requires a 100cm wide x 210cm high doorway. Check stairwells if applicable.',
      },
      {
        question: 'What is the return policy?',
        answer: '30-day return policy. Item must be in original condition. Return shipping fees apply.',
      },
      {
        question: 'Do you offer assembly service?',
        answer: 'Yes! Add white-glove delivery and assembly for €100.',
      },
    ],

    customFields: {
      collection: 'Nordic Living 2025',
      style: 'Scandinavian Modern',
      room: 'Living Room',
      features: ['Removable covers', 'FSC certified wood', 'No-sag suspension'],
      floorProtectors: 'Included',
      petFriendly: true,
      kidFriendly: true,
      apartments: 'Suitable',
      fireRetardant: 'Meets EU standards',
    },
  },
};

export default furnitureHomeDecorTemplate;

