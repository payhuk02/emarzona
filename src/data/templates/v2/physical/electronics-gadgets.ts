/**
 * 📱 ELECTRONICS & GADGETS TEMPLATE
 * Professional template for tech products
 * Inspired by: Apple, Samsung, Best Buy
 */

import { TemplateV2 } from '@/types/templates-v2';

export const electronicsGadgetsTemplate: TemplateV2 = {
  metadata: {
    id: 'physical-electronics-gadgets-v2',
    version: '1.0.0',
    name: 'Electronics & Gadgets - Inspired by Apple',
    shortDescription: 'Premium tech product template with specs and compatibility',
    description: 'Complete electronics template with technical specifications, compatibility info, and warranty details',
    category: 'electronics',
    productType: 'physical',
    tier: 'free',
    designStyle: 'modern',
    author: {
      name: 'Payhuk Team',
      email: 'templates@payhuk.com',
      url: 'https://payhuk.com',
    },
    tags: ['electronics', 'gadgets', 'tech', 'devices', 'specifications', 'warranty'],
    thumbnail: '/templates/physical/electronics-thumb.jpg',
    previewImages: [
      '/templates/physical/electronics-1.jpg',
      '/templates/physical/electronics-2.jpg',
      '/templates/physical/electronics-3.jpg',
      '/templates/physical/electronics-4.jpg',
    ],
    demoUrl: 'https://demo.payhuk.com/templates/electronics',
    industry: 'technology',
    targetAudience: ['electronics-stores', 'tech-retailers', 'gadget-shops'],
    features: [
      'Technical specifications',
      'Compatibility checker',
      'Warranty information',
      'Comparison tables',
      'What\'s in the box',
      'Installation guide',
      'Troubleshooting tips',
    ],
    requirements: [
      'Product specifications',
      'High-res product images',
      'Warranty details',
      'Compatibility information',
    ],
    license: 'Standard License',
    price: 0,
    analytics: {
      downloads: 3156,
      views: 15234,
      rating: 4.9,
      favorites: 289,
      usageCount: 1876,
    },
    seo: {
      title: 'Electronics & Gadgets Template - Tech Product Store',
      metaDescription: 'Professional template for electronics with detailed specs and warranty info',
      keywords: ['electronics template', 'tech products', 'gadgets', 'specifications'],
      ogImage: '/templates/physical/electronics-og.jpg',
    },
    createdAt: '2025-10-29T10:15:00Z',
    updatedAt: '2025-10-29T10:15:00Z',
  },
  data: {
    basic: {
      name: 'Wireless Bluetooth Earbuds Pro',
      slug: 'wireless-bluetooth-earbuds-pro',
      tagline: 'Premium Sound, Ultimate Freedom',
      shortDescription: 'High-fidelity wireless earbuds with active noise cancellation',
      fullDescription: `Experience audio perfection with our Wireless Bluetooth Earbuds Pro.

Featuring active noise cancellation, premium drivers, and an ergonomic design, these earbuds deliver studio-quality sound wherever you go. With 30-hour battery life and IPX7 water resistance, they're built for your active lifestyle.

Crystal-clear calls, instant pairing, and touch controls make these the ultimate wireless earbuds.`,
      category: 'electronics',
      subcategory: 'audio',
      brand: 'SoundTech',
    },

    pricing: {
      basePrice: 149.99,
      currency: 'EUR',
      salePrice: 129.99,
      compareAtPrice: 199.99,
      costPerItem: 60.00,
      taxable: true,
      taxCode: 'ELECTRONICS',
    },

    visual: {
      thumbnail: '/products/earbuds-main.jpg',
      images: [
        '/products/earbuds-case.jpg',
        '/products/earbuds-wearing.jpg',
        '/products/earbuds-charging.jpg',
        '/products/earbuds-colors.jpg',
        '/products/earbuds-360.gif',
      ],
      videoUrl: 'https://youtube.com/watch?v=product-demo',
      has360View: true,
      hasModelPhotos: true,
    },

    seo: {
      metaTitle: 'Wireless Bluetooth Earbuds Pro | Noise Cancelling',
      metaDescription: 'Premium wireless earbuds with ANC, 30h battery life, and studio-quality sound. IPX7 waterproof.',
      keywords: ['wireless earbuds', 'bluetooth earbuds', 'noise cancelling', 'ANC earbuds'],
      slug: 'wireless-bluetooth-earbuds-pro',
    },

    features: [
      'Active Noise Cancellation (ANC)',
      '30-hour total battery life',
      'IPX7 water resistance',
      'Touch controls',
      'Instant pairing',
      'Premium 10mm drivers',
      'Transparency mode',
      'USB-C fast charging',
      'Find My Earbuds feature',
    ],

    benefits: [
      'Immersive audio experience',
      'All-day battery life',
      'Sweat & water resistant',
      'Intuitive controls',
      'Universal compatibility',
    ],

    specifications: {
      // Audio
      driverSize: '10mm',
      frequencyResponse: '20Hz - 20kHz',
      impedance: '32Ω',
      sensitivity: '98dB',
      codec: 'AAC, SBC, aptX',
      
      // Connectivity
      bluetooth: '5.3',
      range: '15 meters',
      latency: '60ms',
      
      // Battery
      earbудBattery: '8 hours',
      caseBattery: '22 hours',
      chargingTime: '1.5 hours',
      quickCharge: '15 min = 2 hours',
      chargingPort: 'USB-C',
      wirelessCharging: true,
      
      // Physical
      weight: '5g per earbud',
      dimensions: 'Case: 60 x 45 x 25mm',
      waterResistance: 'IPX7',
      
      // Compatibility
      compatibility: 'iOS, Android, Windows, Mac',
      minBluetoothVersion: '4.2',
    },

    physical: {
      inventory: {
        sku: 'EARBUDS-PRO-001',
        barcode: '9876543210987',
        trackQuantity: true,
        quantity: 300,
        lowStockThreshold: 30,
        allowBackorders: false,
        stockStatus: 'in_stock',
      },

      variants: [
        {
          id: 'var-black',
          name: 'Matte Black',
          options: { color: 'Black' },
          sku: 'EARBUDS-BLK',
          price: 149.99,
          stock: 150,
          image: '/products/earbuds-black.jpg',
        },
        {
          id: 'var-white',
          name: 'Pearl White',
          options: { color: 'White' },
          sku: 'EARBUDS-WHT',
          price: 149.99,
          stock: 100,
          image: '/products/earbuds-white.jpg',
        },
        {
          id: 'var-blue',
          name: 'Ocean Blue',
          options: { color: 'Blue' },
          sku: 'EARBUDS-BLU',
          price: 149.99,
          stock: 50,
          image: '/products/earbuds-blue.jpg',
        },
      ],

      variantOptions: [
        {
          name: 'Color',
          values: ['Black', 'White', 'Blue', 'Rose Gold'],
        },
      ],

      shipping: {
        weight: 0.1,
        weightUnit: 'kg',
        dimensions: {
          length: 15,
          width: 10,
          height: 5,
          unit: 'cm',
        },
        requiresShipping: true,
        shippingClass: 'express',
        freeShippingThreshold: 100,
      },

      // What's in the Box
      packageContents: [
        'Wireless Earbuds (Pair)',
        'Charging Case',
        'USB-C Charging Cable',
        'Ear Tips (S, M, L)',
        'Quick Start Guide',
        'Warranty Card',
      ],

      // Warranty
      warranty: {
        duration: '2 years',
        type: 'Manufacturer warranty',
        coverage: 'Defects in materials and workmanship',
        registration: 'Online registration recommended',
      },

      // Installation/Setup
      setupInstructions: [
        'Remove earbuds from charging case',
        'Open Bluetooth settings on your device',
        'Select "SoundTech Earbuds Pro" from the list',
        'Confirm pairing when prompted',
        'Download the companion app (optional)',
      ],
    },

    designTokens: {
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        accent: '#0071e3',
        background: '#f5f5f7',
        text: '#1d1d1f',
      },
      typography: {
        fontFamily: 'SF Pro Display, system-ui, sans-serif',
        headingSize: '40px',
        bodySize: '17px',
        lineHeight: '1.5',
      },
      spacing: {
        small: '12px',
        medium: '24px',
        large: '48px',
      },
      borderRadius: '12px',
      shadows: {
        card: '0 4px 12px rgba(0,0,0,0.08)',
        hover: '0 8px 24px rgba(0,0,0,0.12)',
      },
    },

    faqs: [
      {
        question: 'How long does the battery last?',
        answer: '8 hours on earbuds, 30 hours total with charging case. Quick charge: 15 min = 2 hours.',
      },
      {
        question: 'Are they waterproof?',
        answer: 'IPX7 rated - resistant to sweat and rain. Not suitable for swimming.',
      },
      {
        question: 'Do they work with iPhone and Android?',
        answer: 'Yes! Compatible with any Bluetooth-enabled device (iOS, Android, Windows, Mac).',
      },
      {
        question: 'Can I use just one earbud?',
        answer: 'Yes, both earbuds work independently for mono listening or calls.',
      },
      {
        question: 'What\'s the warranty?',
        answer: '2-year manufacturer warranty covering defects in materials and workmanship.',
      },
    ],

    customFields: {
      model: 'EBP-2025',
      releaseDate: '2025-01-15',
      certifications: 'CE, FCC, RoHS',
      appRequired: false,
      appName: 'SoundTech Connect',
      firmware: 'v2.4.1',
      multipoint: true, // Connect to 2 devices simultaneously
      voiceAssistant: 'Siri, Google Assistant, Alexa',
      controls: 'Touch Controls',
      includesApp: true,
    },
  },
};

export default electronicsGadgetsTemplate;

