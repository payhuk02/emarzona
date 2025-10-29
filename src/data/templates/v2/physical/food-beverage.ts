/**
 * 🍕 FOOD & BEVERAGE TEMPLATE
 * Template for food products and beverages
 * Inspired by: HelloFresh, Blue Apron, Whole Foods
 */

import { TemplateV2 } from '@/types/templates-v2';

export const foodBeverageTemplate: TemplateV2 = {
  metadata: {
    id: 'physical-food-beverage-v2',
    version: '1.0.0',
    name: 'Food & Beverage - Inspired by HelloFresh',
    shortDescription: 'Gourmet food template with nutritional info and recipes',
    description: 'Complete food product template with ingredients, nutrition facts, allergens, and recipes',
    category: 'food-beverage',
    productType: 'physical',
    tier: 'free',
    designStyle: 'modern',
    author: { name: 'Payhuk Team', email: 'templates@payhuk.com', url: 'https://payhuk.com' },
    tags: ['food', 'gourmet', 'organic', 'nutrition', 'recipes', 'allergens'],
    thumbnail: '/templates/physical/food-thumb.jpg',
    previewImages: ['/templates/physical/food-1.jpg', '/templates/physical/food-2.jpg'],
    demoUrl: 'https://demo.payhuk.com/templates/food',
    industry: 'food',
    targetAudience: ['food-brands', 'gourmet-shops', 'organic-stores'],
    features: ['Nutrition facts', 'Allergen info', 'Recipes included', 'Expiration tracking', 'Storage instructions'],
    requirements: ['Nutrition data', 'Ingredient list', 'Allergen warnings', 'Food certifications'],
    license: 'Standard License',
    price: 0,
    analytics: { downloads: 1876, views: 8234, rating: 4.6, favorites: 156, usageCount: 987 },
    seo: {
      title: 'Food & Beverage Template - Gourmet Food Store',
      metaDescription: 'Professional template for food products with complete nutrition info',
      keywords: ['food template', 'gourmet', 'organic', 'nutrition facts'],
      ogImage: '/templates/physical/food-og.jpg',
    },
    createdAt: '2025-10-29T11:15:00Z',
    updatedAt: '2025-10-29T11:15:00Z',
  },
  data: {
    basic: {
      name: 'Artisan Organic Coffee Beans',
      slug: 'artisan-organic-coffee-beans',
      tagline: 'From Farm to Cup, Ethically Sourced',
      shortDescription: 'Premium single-origin Arabica beans, medium roast',
      fullDescription: `Experience coffee perfection with our Artisan Organic Coffee Beans.

Sourced directly from sustainable farms in Colombia, these 100% Arabica beans are carefully roasted to bring out notes of chocolate, caramel, and citrus. Fair trade certified and organic.

Perfect for espresso, drip, or French press.`,
      category: 'food-beverage',
      subcategory: 'coffee',
      brand: 'RoastCraft',
    },
    pricing: { basePrice: 16.99, currency: 'EUR', salePrice: 14.99, compareAtPrice: 19.99, costPerItem: 8.00, taxable: true, taxCode: 'FOOD' },
    visual: {
      thumbnail: '/products/coffee-bag.jpg',
      images: ['/products/coffee-beans.jpg', '/products/coffee-cup.jpg', '/products/coffee-origin.jpg'],
      videoUrl: 'https://youtube.com/watch?v=brewing-guide',
      has360View: false,
      hasModelPhotos: false,
    },
    seo: {
      metaTitle: 'Artisan Organic Coffee Beans | Colombian Single-Origin',
      metaDescription: 'Premium organic coffee beans from Colombia. Fair trade certified. Medium roast.',
      keywords: ['organic coffee', 'colombian coffee', 'fair trade', 'arabica beans'],
      slug: 'artisan-organic-coffee-beans',
    },
    features: [
      '100% Organic Arabica Beans',
      'Fair Trade Certified',
      'Single-Origin Colombia',
      'Medium Roast',
      'Freshly Roasted',
      'Resealable Bag',
      'Whole Beans',
      'Biodegradable Packaging',
    ],
    benefits: ['Rich, balanced flavor', 'Ethical sourcing', 'Fresh roasted weekly', 'Versatile brewing', 'Sustainable'],
    specifications: {
      weight: '340g (12oz)',
      roastLevel: 'Medium',
      origin: 'Huila, Colombia',
      altitude: '1600-1800m',
      process: 'Washed',
      variety: '100% Arabica',
      flavorNotes: 'Chocolate, Caramel, Citrus',
      acidity: 'Medium',
      body: 'Full',
      roastDate: 'Within 7 days of order',
    },
    physical: {
      inventory: {
        sku: 'COFFEE-ORG-001',
        barcode: '3216549870123',
        trackQuantity: true,
        quantity: 200,
        lowStockThreshold: 20,
        allowBackorders: true,
        stockStatus: 'in_stock',
      },
      variants: [
        { id: 'var-whole', name: 'Whole Beans', options: { grind: 'Whole' }, sku: 'COFFEE-WHOLE', price: 16.99, stock: 120 },
        { id: 'var-ground', name: 'Ground (Drip)', options: { grind: 'Ground' }, sku: 'COFFEE-GROUND', price: 16.99, stock: 80 },
      ],
      variantOptions: [{ name: 'Grind', values: ['Whole Beans', 'Ground (Drip)', 'Ground (Espresso)', 'Ground (French Press)'] }],
      shipping: {
        weight: 0.35,
        weightUnit: 'kg',
        dimensions: { length: 20, width: 12, height: 5, unit: 'cm' },
        requiresShipping: true,
        shippingClass: 'standard',
        freeShippingThreshold: 30,
      },
      // Food-specific fields
      nutrition: {
        servingSize: '1 cup (240ml brewed)',
        servingsPerContainer: '28',
        caloriesPerServing: 2,
        totalFat: '0g',
        saturatedFat: '0g',
        transFat: '0g',
        cholesterol: '0mg',
        sodium: '5mg',
        totalCarbohydrate: '0g',
        dietaryFiber: '0g',
        sugars: '0g',
        protein: '0.3g',
        caffeine: '95mg',
      },
      ingredients: {
        list: '100% Organic Arabica Coffee Beans',
        allergens: 'None',
        certifications: ['USDA Organic', 'Fair Trade', 'Rainforest Alliance'],
        nonGMO: true,
        vegan: true,
        glutenFree: true,
      },
      storage: {
        instructions: 'Store in a cool, dry place. Keep bag sealed after opening.',
        temperature: 'Room temperature (15-25°C)',
        shelfLife: '12 months (unopened), 1 month (opened)',
        bestBy: 'See package for date',
      },
      brewingInstructions: [
        'Drip: Use 2 tbsp per 6oz water',
        'Espresso: 18-20g for double shot',
        'French Press: 1:15 ratio, steep 4 minutes',
        'Cold Brew: 1:5 ratio, steep 12-24 hours',
      ],
    },
    designTokens: {
      colors: { primary: '#6f4e37', secondary: '#f5e6d3', accent: '#d4a373', background: '#ffffff', text: '#3e2723' },
      typography: { fontFamily: 'Raleway, sans-serif', headingSize: '32px', bodySize: '16px', lineHeight: '1.7' },
      spacing: { small: '12px', medium: '24px', large: '40px' },
      borderRadius: '12px',
      shadows: { card: '0 4px 12px rgba(111,78,55,0.1)', hover: '0 8px 20px rgba(111,78,55,0.15)' },
    },
    faqs: [
      { question: 'How fresh is the coffee?', answer: 'Roasted within 7 days of your order for maximum freshness.' },
      { question: 'Is it organic?', answer: 'Yes, USDA Organic certified and Fair Trade.' },
      { question: 'What grind should I choose?', answer: 'Whole beans for maximum freshness, or select your brewing method for pre-ground.' },
      { question: 'How should I store it?', answer: 'In the resealable bag, in a cool, dry place away from sunlight.' },
    ],
    customFields: {
      origin: 'Huila, Colombia',
      farm: 'La Esperanza Cooperative',
      harvestSeason: 'March-June 2025',
      cupping Score: '86/100',
      sustainablePractices: true,
      directTrade: true,
    },
  },
};

export default foodBeverageTemplate;

