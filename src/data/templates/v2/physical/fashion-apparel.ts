/**
 * 👕 FASHION & APPAREL TEMPLATE
 * Professional template for clothing and fashion brands
 * Inspired by: Zara, H&M, ASOS
 */

import { TemplateV2 } from '@/types/templates-v2';

export const fashionApparelTemplate: TemplateV2 = {
  metadata: {
    id: 'physical-fashion-apparel-v2',
    version: '1.0.0',
    name: 'Fashion & Apparel - Inspired by Zara',
    shortDescription: 'Modern clothing template with size guides and variant management',
    description: 'Complete fashion e-commerce template with size charts, color variants, and seasonal collections',
    category: 'fashion-apparel',
    productType: 'physical',
    tier: 'free',
    designStyle: 'modern',
    author: {
      name: 'Payhuk Team',
      email: 'templates@payhuk.com',
      url: 'https://payhuk.com',
    },
    tags: ['fashion', 'clothing', 'apparel', 'style', 'wardrobe', 'variants', 'sizes'],
    thumbnail: '/templates/physical/fashion-apparel-thumb.jpg',
    previewImages: [
      '/templates/physical/fashion-apparel-1.jpg',
      '/templates/physical/fashion-apparel-2.jpg',
      '/templates/physical/fashion-apparel-3.jpg',
      '/templates/physical/fashion-apparel-4.jpg',
    ],
    demoUrl: 'https://demo.payhuk.com/templates/fashion-apparel',
    industry: 'fashion',
    targetAudience: ['fashion-brands', 'boutiques', 'designers', 'retailers'],
    features: [
      'Size chart builder',
      'Color & size variants',
      'Seasonal collections',
      'Style guide',
      'Model measurements',
      'Fabric composition',
      'Care instructions',
      'Fit guide',
    ],
    requirements: [
      'High-quality product photos',
      'Size chart data',
      'Fabric information',
      'Multiple product angles',
    ],
    license: 'Standard License',
    price: 0,
    analytics: {
      downloads: 2847,
      views: 12456,
      rating: 4.8,
      favorites: 234,
      usageCount: 1523,
    },
    seo: {
      title: 'Fashion & Apparel Template - Professional Clothing Store',
      metaDescription: 'Launch your fashion brand with this complete template featuring size guides, variants, and modern design',
      keywords: ['fashion template', 'clothing store', 'apparel', 'size chart', 'variants'],
      ogImage: '/templates/physical/fashion-apparel-og.jpg',
    },
    createdAt: '2025-10-29T10:00:00Z',
    updatedAt: '2025-10-29T10:00:00Z',
  },
  data: {
    // Basic Information
    basic: {
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-tshirt',
      tagline: 'Comfort Meets Style',
      shortDescription: 'Ultra-soft organic cotton t-shirt with perfect fit',
      fullDescription: `Experience unmatched comfort with our Premium Cotton T-Shirt. 

Made from 100% organic cotton, this versatile piece combines exceptional softness with durability. The modern fit flatters all body types while the breathable fabric keeps you comfortable all day long.

Perfect for casual outings, layering, or everyday wear. Available in multiple colors and sizes.`,
      category: 'clothing',
      subcategory: 'tops',
      brand: 'StyleLab',
    },

    // Pricing
    pricing: {
      basePrice: 29.99,
      currency: 'EUR',
      salePrice: 24.99,
      compareAtPrice: 39.99,
      costPerItem: 12.00,
      taxable: true,
      taxCode: 'CLOTHING',
    },

    // Visual Assets
    visual: {
      thumbnail: '/products/tshirt-white-front.jpg',
      images: [
        '/products/tshirt-white-front.jpg',
        '/products/tshirt-white-back.jpg',
        '/products/tshirt-white-side.jpg',
        '/products/tshirt-white-detail.jpg',
        '/products/tshirt-model.jpg',
      ],
      videoUrl: 'https://youtube.com/watch?v=example',
      has360View: true,
      hasModelPhotos: true,
    },

    // SEO
    seo: {
      metaTitle: 'Premium Cotton T-Shirt | Organic & Comfortable',
      metaDescription: 'Shop our Premium Cotton T-Shirt made from 100% organic cotton. Soft, durable, and stylish. Available in multiple colors and sizes.',
      keywords: ['cotton t-shirt', 'organic clothing', 'comfortable tshirt', 'basic tee'],
      slug: 'premium-cotton-tshirt',
    },

    // Features & Benefits
    features: [
      '100% Organic Cotton',
      'Pre-shrunk for perfect fit',
      'Reinforced shoulder seams',
      'Tagless comfort',
      'Machine washable',
      'Eco-friendly dyes',
      'Breathable fabric',
      'Double-stitched hems',
    ],

    benefits: [
      'All-day comfort',
      'Maintains shape after washing',
      'Sustainable & eco-friendly',
      'Versatile styling options',
      'Long-lasting quality',
    ],

    // Specifications
    specifications: {
      material: '100% Organic Cotton',
      weight: '180 GSM',
      fit: 'Modern Fit',
      neckline: 'Crew Neck',
      sleeveLength: 'Short Sleeve',
      care: 'Machine wash cold, tumble dry low',
      madeIn: 'Portugal',
      sustainabilityCertification: 'GOTS Certified',
    },

    // Physical Product Specifics
    physical: {
      // Inventory
      inventory: {
        sku: 'TSHIRT-PREM-001',
        barcode: '1234567890123',
        trackQuantity: true,
        quantity: 500,
        lowStockThreshold: 50,
        allowBackorders: true,
        stockStatus: 'in_stock',
      },

      // Variants
      variants: [
        {
          id: 'var-white-s',
          name: 'White / Small',
          options: { color: 'White', size: 'S' },
          sku: 'TSHIRT-WHT-S',
          price: 29.99,
          stock: 120,
          image: '/products/tshirt-white-s.jpg',
        },
        {
          id: 'var-white-m',
          name: 'White / Medium',
          options: { color: 'White', size: 'M' },
          sku: 'TSHIRT-WHT-M',
          price: 29.99,
          stock: 150,
          image: '/products/tshirt-white-m.jpg',
        },
        {
          id: 'var-white-l',
          name: 'White / Large',
          options: { color: 'White', size: 'L' },
          sku: 'TSHIRT-WHT-L',
          price: 29.99,
          stock: 100,
          image: '/products/tshirt-white-l.jpg',
        },
        {
          id: 'var-black-m',
          name: 'Black / Medium',
          options: { color: 'Black', size: 'M' },
          sku: 'TSHIRT-BLK-M',
          price: 29.99,
          stock: 80,
          image: '/products/tshirt-black-m.jpg',
        },
      ],

      // Variant Options
      variantOptions: [
        {
          name: 'Color',
          values: ['White', 'Black', 'Navy', 'Gray', 'Olive'],
        },
        {
          name: 'Size',
          values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        },
      ],

      // Shipping
      shipping: {
        weight: 0.2,
        weightUnit: 'kg',
        dimensions: {
          length: 30,
          width: 25,
          height: 2,
          unit: 'cm',
        },
        requiresShipping: true,
        shippingClass: 'standard',
        freeShippingThreshold: 50,
      },

      // Size Chart
      sizeChart: {
        name: 'Standard T-Shirt Sizes',
        measurements: [
          { size: 'XS', chest: '86-91', length: '68', shoulders: '41' },
          { size: 'S', chest: '91-96', length: '70', shoulders: '43' },
          { size: 'M', chest: '96-101', length: '72', shoulders: '45' },
          { size: 'L', chest: '101-106', length: '74', shoulders: '47' },
          { size: 'XL', chest: '106-111', length: '76', shoulders: '49' },
          { size: 'XXL', chest: '111-116', length: '78', shoulders: '51' },
        ],
        unit: 'cm',
        guide: 'Measure across the chest at the widest point. For length, measure from shoulder to hem.',
      },

      // Care Instructions
      careInstructions: [
        'Machine wash cold with like colors',
        'Do not bleach',
        'Tumble dry low',
        'Cool iron if needed',
        'Do not dry clean',
      ],
    },

    // Design Tokens
    designTokens: {
      colors: {
        primary: '#1a1a1a',
        secondary: '#f5f5f5',
        accent: '#d4af37',
        background: '#ffffff',
        text: '#333333',
      },
      typography: {
        fontFamily: 'Montserrat, sans-serif',
        headingSize: '32px',
        bodySize: '16px',
        lineHeight: '1.6',
      },
      spacing: {
        small: '8px',
        medium: '16px',
        large: '32px',
      },
      borderRadius: '4px',
      shadows: {
        card: '0 2px 8px rgba(0,0,0,0.1)',
        hover: '0 4px 16px rgba(0,0,0,0.15)',
      },
    },

    // FAQ
    faqs: [
      {
        question: 'What is the fabric composition?',
        answer: '100% organic cotton, GOTS certified for sustainability.',
      },
      {
        question: 'How does it fit?',
        answer: 'Modern fit - not too tight, not too loose. Check our size chart for exact measurements.',
      },
      {
        question: 'Is it pre-shrunk?',
        answer: 'Yes, the fabric is pre-shrunk to maintain its size after washing.',
      },
      {
        question: 'Can I return if the size doesn\'t fit?',
        answer: 'Absolutely! We offer free returns within 30 days.',
      },
    ],

    // Custom Fields
    customFields: {
      collection: 'Essentials 2025',
      season: 'All Season',
      gender: 'Unisex',
      ageGroup: 'Adult',
      pattern: 'Solid',
      occasion: 'Casual',
      modelHeight: '180cm',
      modelSize: 'M',
      fabricWeight: 'Medium (180 GSM)',
      transparency: 'Opaque',
      stretch: 'Slight Stretch',
    },
  },
};

export default fashionApparelTemplate;

