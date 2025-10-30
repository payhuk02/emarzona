/**
 * 👕 FASHION & APPAREL TEMPLATE - ULTRA PRO
 * Professional template for clothing and fashion brands
 * Inspired by: Zara, H&M, ASOS, Uniqlo
 * 
 * @version 2.0.0
 * @date 2025-10-30
 * @category Physical Products
 */

import { TemplateV2 } from '@/types/templates-v2';

export const fashionApparelTemplate: TemplateV2 = {
  metadata: {
    id: 'physical-fashion-apparel-v2-pro',
    version: '2.0.0',
    name: 'Fashion & Apparel Pro - Zara Level',
    shortDescription: 'Complete fashion e-commerce solution with advanced variant management, size guides, and seasonal collections',
    description: `Transform your fashion brand with this ultra-professional template inspired by global leaders like Zara, H&M, and ASOS.

This comprehensive solution includes everything needed to launch a world-class online clothing store: intelligent size chart builder, multi-dimensional variant system (color, size, material), seasonal collection management, and sophisticated inventory tracking.

Perfect for fashion brands, boutiques, designers, and retailers who demand excellence. Features advanced tools like fit guide recommendations, fabric composition displays, care instruction generators, and model measurement references.

Built with conversion optimization in mind, this template includes trust badges, sustainable fashion certifications, customer reviews integration, and professional product photography guidelines. The responsive design ensures flawless shopping experiences across all devices.

Whether you're launching a new brand or upgrading your existing store, this template provides the professional foundation you need to compete with industry leaders.`,
    category: 'fashion-apparel',
    productType: 'physical',
    tier: 'free',
    designStyle: 'modern',
    author: {
      name: 'Payhuk Professional Templates',
      email: 'templates@payhuk.com',
      url: 'https://payhuk.com',
    },
    tags: [
      'fashion',
      'clothing',
      'apparel',
      'style',
      'wardrobe',
      'variants',
      'sizes',
      'sustainable-fashion',
      'boutique',
      'designer',
      'retail',
      'e-commerce',
    ],
    thumbnail: '/templates/physical/fashion-apparel-thumb.jpg',
    previewImages: [
      '/templates/physical/fashion-apparel-hero.jpg',
      '/templates/physical/fashion-apparel-grid.jpg',
      '/templates/physical/fashion-apparel-detail.jpg',
      '/templates/physical/fashion-apparel-mobile.jpg',
      '/templates/physical/fashion-apparel-checkout.jpg',
    ],
    demoUrl: 'https://demo.payhuk.com/templates/fashion-apparel-pro',
    industry: 'fashion',
    targetAudience: [
      'fashion-brands',
      'clothing-boutiques',
      'independent-designers',
      'fashion-retailers',
      'sustainable-fashion',
      'streetwear-brands',
    ],
    features: [
      'Advanced size chart builder with EU/US/UK conversions',
      'Multi-dimensional variants (Color × Size × Material)',
      'Seasonal collection management system',
      'Professional style guide generator',
      'Model measurements reference',
      'Fabric composition display with care icons',
      'Automated care instruction templates',
      'Smart fit guide recommendations',
      'Virtual try-on integration ready',
      'Sustainability badges & certifications',
      'Customer review system with photo uploads',
      'Wishlist & save for later functionality',
    ],
    requirements: [
      'High-quality product photos (minimum 1280x720)',
      'Complete size chart data',
      'Fabric information and composition',
      'Multiple product angles (front, back, side, detail)',
      'Model measurements for fit reference',
    ],
    license: 'Standard License - Free for commercial use',
    price: 0,
    analytics: {
      downloads: 3847,
      views: 18956,
      rating: 4.9,
      favorites: 456,
      usageCount: 2143,
    },
    seo: {
      title: 'Fashion & Apparel Pro Template - Launch Your Clothing Brand',
      metaDescription: 'Professional fashion e-commerce template with size guides, advanced variants, and modern design. Inspired by Zara & H&M. Launch your clothing store today!',
      keywords: [
        'fashion template',
        'clothing store template',
        'apparel ecommerce',
        'size chart builder',
        'fashion variants',
        'clothing boutique',
        'designer template',
        'retail fashion',
        'sustainable fashion',
        'fashion marketplace',
      ],
      ogImage: '/templates/physical/fashion-apparel-og.jpg',
    },
    createdAt: '2025-10-29T10:00:00Z',
    updatedAt: '2025-10-30T15:30:00Z',
  },
  data: {
    // Basic Information
    basic: {
      name: 'Premium Organic Cotton T-Shirt - Essential Collection',
      slug: 'premium-organic-cotton-tshirt-essential',
      tagline: 'Where Comfort Meets Conscious Style',
      shortDescription: 'Ultra-soft GOTS certified organic cotton t-shirt with modern fit and timeless design. The perfect wardrobe essential.',
      fullDescription: `Discover the ultimate in everyday luxury with our Premium Organic Cotton T-Shirt from the Essential Collection. This isn't just another t-shirt—it's a commitment to quality, sustainability, and timeless style.

**Crafted from 100% GOTS Certified Organic Cotton**
We source only the finest organic cotton, grown without harmful pesticides and processed using eco-friendly methods. The result? Fabric that's incredibly soft against your skin while being gentle on the planet.

**Modern Fit That Flatters**
Our design team spent months perfecting the fit. Neither too tight nor too loose, this modern cut flatters all body types. The slightly tapered silhouette provides a contemporary look without sacrificing comfort.

**Built to Last**
Premium construction means this t-shirt maintains its shape, color, and softness wash after wash. Reinforced shoulder seams, double-stitched hems, and quality craftsmanship ensure this becomes your go-to piece for years to come.

**Versatile Styling**
Perfect for casual Friday at the office, weekend brunches, layering under jackets, or paired with jeans for a classic look. Available in a curated palette of timeless colors that complement any wardrobe.

**Sustainable & Ethical**
GOTS certified, Fair Trade approved, and made in Portugal by artisans paid fair wages. Fashion that feels as good as it looks.

Join thousands of satisfied customers who've made this their #1 wardrobe essential. Order now and experience the difference quality makes.`,
      category: 'clothing',
      subcategory: 'tops',
      brand: 'StyleLab Essentials',
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
      pricePerUnit: {
        amount: 29.99,
        unit: 'piece',
      },
    },

    // Visual Assets
    visual: {
      thumbnail: '/products/tshirt-essential-white-front.jpg',
      images: [
        '/products/tshirt-essential-white-front.jpg',
        '/products/tshirt-essential-white-back.jpg',
        '/products/tshirt-essential-white-side.jpg',
        '/products/tshirt-essential-detail-fabric.jpg',
        '/products/tshirt-essential-detail-stitching.jpg',
        '/products/tshirt-essential-model-male.jpg',
        '/products/tshirt-essential-model-female.jpg',
        '/products/tshirt-essential-lifestyle.jpg',
      ],
      videoUrl: 'https://youtube.com/watch?v=fashion-tshirt-demo',
      has360View: true,
      hasModelPhotos: true,
      altTexts: [
        'Premium organic cotton t-shirt white - front view',
        'Organic cotton t-shirt - back view showing quality stitching',
        'T-shirt side view - modern fit',
        'Close-up fabric texture - 100% organic cotton',
        'Detail of reinforced shoulder seams',
        'Male model wearing size M (180cm height)',
        'Female model wearing size S (165cm height)',
        'Lifestyle photo - casual everyday wear',
      ],
    },

    // SEO
    seo: {
      metaTitle: 'Premium Organic Cotton T-Shirt | GOTS Certified | Essential Collection',
      metaDescription: 'Shop our best-selling Premium Organic Cotton T-Shirt. GOTS certified, modern fit, available in 5 colors and 6 sizes. Sustainable fashion that lasts. Free shipping over €50.',
      keywords: [
        'organic cotton t-shirt',
        'GOTS certified clothing',
        'sustainable t-shirt',
        'eco-friendly fashion',
        'premium basics',
        'essential tee',
        'comfortable tshirt',
        'modern fit shirt',
        'wardrobe essentials',
      ],
      slug: 'premium-organic-cotton-tshirt-essential',
    },

    // Features & Benefits
    features: [
      '100% GOTS Certified Organic Cotton',
      'Pre-shrunk for guaranteed fit retention',
      'Reinforced shoulder seams for durability',
      'Tagless design - no irritation',
      'Machine washable - easy care',
      'Eco-friendly AZO-free dyes',
      'Breathable & moisture-wicking fabric',
      'Double-stitched hems for longevity',
      'Fair Trade certified production',
      'Medium weight 180 GSM fabric',
      'Unisex modern fit design',
      'Made in Portugal by skilled artisans',
    ],

    benefits: [
      'All-day comfort without compromise',
      'Maintains shape and color after 50+ washes',
      'Sustainable choice - better for the planet',
      'Versatile styling for any occasion',
      'Long-lasting quality - investment piece',
      'Hypoallergenic - perfect for sensitive skin',
      'Ethical fashion you can feel good about',
    ],

    // Specifications
    specifications: {
      material: '100% Organic Cotton (GOTS Certified)',
      weight: '180 GSM (Medium Weight)',
      fit: 'Modern Fit - Slightly Tapered',
      neckline: 'Ribbed Crew Neck',
      sleeveLength: 'Short Sleeve (20cm)',
      care: 'Machine wash cold (30°C), tumble dry low, cool iron if needed',
      madeIn: 'Portugal',
      sustainabilityCertification: 'GOTS Certified, Fair Trade, OEKO-TEX Standard 100',
      fabricComposition: '100% Organic Cotton',
      fabricWeight: '180g/m²',
      shrinkage: 'Pre-shrunk - Less than 3% shrinkage',
      colorFastness: 'Grade 4 (Excellent)',
    },

    // Physical Product Specifics
    physical: {
      // Inventory
      inventory: {
        sku: 'ESS-TSHIRT-ORG-001',
        barcode: '5901234567890',
        trackQuantity: true,
        quantity: 850,
        lowStockThreshold: 100,
        allowBackorders: true,
        stockStatus: 'in_stock',
        reorderPoint: 150,
        supplierLeadTime: '14 days',
      },

      // Variants (Expanded)
      variants: [
        // White
        { id: 'var-white-xs', name: 'White / XS', options: { color: 'White', size: 'XS' }, sku: 'ESS-WHT-XS', price: 29.99, stock: 45, image: '/products/tshirt-white-xs.jpg' },
        { id: 'var-white-s', name: 'White / S', options: { color: 'White', size: 'S' }, sku: 'ESS-WHT-S', price: 29.99, stock: 120, image: '/products/tshirt-white-s.jpg' },
        { id: 'var-white-m', name: 'White / M', options: { color: 'White', size: 'M' }, sku: 'ESS-WHT-M', price: 29.99, stock: 180, image: '/products/tshirt-white-m.jpg' },
        { id: 'var-white-l', name: 'White / L', options: { color: 'White', size: 'L' }, sku: 'ESS-WHT-L', price: 29.99, stock: 150, image: '/products/tshirt-white-l.jpg' },
        { id: 'var-white-xl', name: 'White / XL', options: { color: 'White', size: 'XL' }, sku: 'ESS-WHT-XL', price: 29.99, stock: 90, image: '/products/tshirt-white-xl.jpg' },
        { id: 'var-white-xxl', name: 'White / XXL', options: { color: 'White', size: 'XXL' }, sku: 'ESS-WHT-XXL', price: 29.99, stock: 35, image: '/products/tshirt-white-xxl.jpg' },
        
        // Black
        { id: 'var-black-s', name: 'Black / S', options: { color: 'Black', size: 'S' }, sku: 'ESS-BLK-S', price: 29.99, stock: 100, image: '/products/tshirt-black-s.jpg' },
        { id: 'var-black-m', name: 'Black / M', options: { color: 'Black', size: 'M' }, sku: 'ESS-BLK-M', price: 29.99, stock: 160, image: '/products/tshirt-black-m.jpg' },
        { id: 'var-black-l', name: 'Black / L', options: { color: 'Black', size: 'L' }, sku: 'ESS-BLK-L', price: 29.99, stock: 130, image: '/products/tshirt-black-l.jpg' },
        
        // Navy
        { id: 'var-navy-m', name: 'Navy / M', options: { color: 'Navy', size: 'M' }, sku: 'ESS-NAV-M', price: 29.99, stock: 85, image: '/products/tshirt-navy-m.jpg' },
        { id: 'var-navy-l', name: 'Navy / L', options: { color: 'Navy', size: 'L' }, sku: 'ESS-NAV-L', price: 29.99, stock: 75, image: '/products/tshirt-navy-l.jpg' },
        
        // Gray
        { id: 'var-gray-m', name: 'Heather Gray / M', options: { color: 'Heather Gray', size: 'M' }, sku: 'ESS-GRY-M', price: 29.99, stock: 70, image: '/products/tshirt-gray-m.jpg' },
        
        // Olive
        { id: 'var-olive-m', name: 'Olive / M', options: { color: 'Olive', size: 'M' }, sku: 'ESS-OLV-M', price: 29.99, stock: 55, image: '/products/tshirt-olive-m.jpg' },
      ],

      // Variant Options
      variantOptions: [
        {
          name: 'Color',
          values: [
            { value: 'White', hex: '#FFFFFF' },
            { value: 'Black', hex: '#000000' },
            { value: 'Navy', hex: '#001f3f' },
            { value: 'Heather Gray', hex: '#A8A8A8' },
            { value: 'Olive', hex: '#6B8E23' },
          ],
        },
        {
          name: 'Size',
          values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        },
      ],

      // Shipping
      shipping: {
        weight: 0.22,
        weightUnit: 'kg',
        dimensions: {
          length: 30,
          width: 25,
          height: 2.5,
          unit: 'cm',
        },
        requiresShipping: true,
        shippingClass: 'standard',
        freeShippingThreshold: 50,
        estimatedDelivery: '3-5 business days',
        internationalShipping: true,
        shippingRestrictions: [],
      },

      // Size Chart (Enhanced)
      sizeChart: {
        name: 'Essential T-Shirt Size Guide',
        measurements: [
          { size: 'XS', chest: '86-91', length: '68', shoulders: '41', sleeveLength: '19' },
          { size: 'S', chest: '91-96', length: '70', shoulders: '43', sleeveLength: '19.5' },
          { size: 'M', chest: '96-101', length: '72', shoulders: '45', sleeveLength: '20' },
          { size: 'L', chest: '101-106', length: '74', shoulders: '47', sleeveLength: '20.5' },
          { size: 'XL', chest: '106-111', length: '76', shoulders: '49', sleeveLength: '21' },
          { size: 'XXL', chest: '111-116', length: '78', shoulders: '51', sleeveLength: '21.5' },
        ],
        unit: 'cm',
        guide: 'For chest: Measure around the fullest part of your chest, keeping the tape horizontal. For length: Measure from the highest point of the shoulder to the hem. For shoulders: Measure across the back from shoulder seam to shoulder seam.',
        fitGuide: 'This t-shirt has a modern fit. If you prefer a looser fit, we recommend sizing up. For a more fitted look, order your usual size.',
      },

      // Care Instructions (Enhanced)
      careInstructions: [
        {
          icon: 'wash',
          title: 'Machine Wash Cold',
          description: 'Wash at 30°C (86°F) with similar colors',
        },
        {
          icon: 'no-bleach',
          title: 'Do Not Bleach',
          description: 'Avoid bleach to preserve color and fabric',
        },
        {
          icon: 'tumble-dry-low',
          title: 'Tumble Dry Low',
          description: 'Low heat setting to prevent shrinkage',
        },
        {
          icon: 'iron-low',
          title: 'Iron Low If Needed',
          description: 'Cool iron on reverse side if necessary',
        },
        {
          icon: 'no-dry-clean',
          title: 'Do Not Dry Clean',
          description: 'Dry cleaning not required or recommended',
        },
      ],
    },

    // Design Tokens (Premium)
    designTokens: {
      colors: {
        primary: '#1a1a1a',      // Deep Black
        secondary: '#f5f5f5',    // Soft White
        accent: '#d4af37',       // Elegant Gold
        success: '#4ade80',      // Fresh Green (sustainability)
        background: '#ffffff',
        text: '#333333',
        textLight: '#6b7280',
        border: '#e5e7eb',
      },
      typography: {
        fontFamily: "'Inter', 'Montserrat', sans-serif",
        headingFont: "'Playfair Display', serif",
        headingSize: '36px',
        subheadingSize: '24px',
        bodySize: '16px',
        smallSize: '14px',
        lineHeight: '1.6',
        headingWeight: '600',
        bodyWeight: '400',
      },
      spacing: {
        xs: '4px',
        small: '8px',
        medium: '16px',
        large: '32px',
        xl: '48px',
        xxl: '64px',
      },
      borderRadius: '6px',
      shadows: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        hover: '0 4px 16px rgba(0,0,0,0.12)',
        focus: '0 0 0 3px rgba(212,175,55,0.1)',
      },
      transitions: {
        fast: '150ms ease',
        normal: '250ms ease',
        slow: '350ms ease',
      },
    },

    // FAQ (Enhanced)
    faqs: [
      {
        question: 'What makes this t-shirt sustainable?',
        answer: 'Our t-shirt is made from 100% GOTS certified organic cotton, meaning it\'s grown without harmful pesticides or synthetic fertilizers. We use eco-friendly AZO-free dyes and the production is Fair Trade certified, ensuring fair wages for all workers. Plus, it\'s made to last, reducing the need for frequent replacements.',
      },
      {
        question: 'How does the modern fit compare to regular fit?',
        answer: 'Our modern fit is designed to be more contemporary than a traditional regular fit. It\'s slightly tapered through the body for a flattering silhouette, but not tight or restrictive. It sits comfortably without being boxy. Check our detailed size chart for exact measurements, and if you prefer a looser fit, we recommend sizing up.',
      },
      {
        question: 'Will this t-shirt shrink after washing?',
        answer: 'The fabric is pre-shrunk during manufacturing, so you can expect less than 3% shrinkage (minimal). To maintain the perfect fit, we recommend washing in cold water (30°C) and tumble drying on low heat. Following these care instructions will help preserve the size and shape.',
      },
      {
        question: 'Is it suitable for sensitive skin?',
        answer: 'Absolutely! The organic cotton is hypoallergenic and OEKO-TEX Standard 100 certified, meaning it\'s tested for harmful substances. The tagless design eliminates a common source of irritation. Many customers with sensitive skin specifically choose this t-shirt for its gentle, breathable fabric.',
      },
      {
        question: 'What if the size doesn\'t fit perfectly?',
        answer: 'We offer hassle-free returns and exchanges within 30 days of purchase. If the size isn\'t quite right, simply request an exchange for a different size. Return shipping is free within the EU. We want you to love your t-shirt!',
      },
      {
        question: 'How long will this t-shirt last?',
        answer: 'With proper care, our t-shirts are designed to last for years. The premium 180 GSM organic cotton, reinforced seams, and quality construction mean this isn\'t a disposable fast-fashion item. Most customers report the t-shirt maintains its shape, color, and softness even after 50+ washes.',
      },
      {
        question: 'Can I order in bulk or get wholesale pricing?',
        answer: 'Yes! We offer bulk discounts for orders of 10+ pieces and have a dedicated wholesale program for retailers. Contact our sales team at wholesale@payhuk.com for custom pricing and terms.',
      },
      {
        question: 'Where is this t-shirt made?',
        answer: 'This t-shirt is proudly made in Portugal by skilled artisans in Fair Trade certified facilities. We maintain close relationships with our manufacturing partners to ensure high quality standards and ethical working conditions.',
      },
    ],

    // Custom Fields (Fashion Specific - Enhanced)
    customFields: {
      // Collection Info
      collection: 'Essentials 2025 Spring/Summer',
      collectionCode: 'ESS-SS25',
      season: 'All Season',
      launchDate: '2025-01-15',
      
      // Target Demographics
      gender: 'Unisex',
      ageGroup: 'Adult (18-65)',
      targetCustomer: 'Conscious consumers seeking quality basics',
      
      // Design Details
      pattern: 'Solid',
      necklineStyle: 'Classic Crew Neck with Ribbing',
      sleeveStyle: 'Set-In Short Sleeve',
      hemStyle: 'Straight Hem with Double Stitching',
      fitType: 'Modern Fit',
      silhouette: 'Slightly Tapered',
      
      // Occasion & Style
      occasion: 'Casual, Smart Casual, Athleisure',
      styleCategory: 'Wardrobe Essential, Basics',
      seasonality: 'Year-Round',
      
      // Model Reference
      modelHeight: '180cm (5\'11")',
      modelSize: 'M',
      modelChest: '96cm',
      modelWaist: '81cm',
      
      // Fabric Details
      fabricType: 'Jersey Knit',
      fabricWeight: 'Medium Weight (180 GSM)',
      fabricFeel: 'Soft, Breathable, Smooth',
      transparency: 'Opaque',
      stretch: 'Slight Stretch (5-10%)',
      texture: 'Smooth with subtle grain',
      
      // Sustainability
      sustainabilityScore: '9/10',
      carbonFootprint: 'Low - Certified Carbon Neutral Production',
      waterUsage: '91% less than conventional cotton',
      certifications: ['GOTS', 'Fair Trade', 'OEKO-TEX Standard 100', 'Carbon Neutral'],
      recyclable: true,
      packaging: 'Plastic-free, compostable packaging',
      
      // Production
      madeIn: 'Portugal',
      factoryCertification: 'Fair Trade, SA8000',
      productionTime: '14-21 days',
      qualityGrade: 'Premium A+',
      
      // Care & Maintenance
      estimatedLifespan: '3-5 years with proper care',
      washRecommendation: 'Wash after 2-3 wears',
      ironingNeeded: 'Minimal - only if desired',
      
      // Additional
      colorFamily: 'Neutrals',
      printMethod: 'None - Solid Dyed',
      embellishments: 'None',
      specialFeatures: 'Tagless, Pre-shrunk, Reinforced seams',
      trending: true,
      bestseller: true,
      newArrival: false,
      limitedEdition: false,
    },
  },
};

export default fashionApparelTemplate;
