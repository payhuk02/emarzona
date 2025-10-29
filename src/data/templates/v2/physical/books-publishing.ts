/**
 * 📚 BOOKS & PUBLISHING TEMPLATE
 * Template for books and publications
 * Inspired by: Amazon Books, Barnes & Noble
 */

import { TemplateV2 } from '@/types/templates-v2';

export const booksPublishingTemplate: TemplateV2 = {
  metadata: {
    id: 'physical-books-publishing-v2',
    version: '1.0.0',
    name: 'Books & Publishing - Inspired by Amazon',
    shortDescription: 'Professional book template with previews and author bio',
    description: 'Complete book template with table of contents, sample chapters, ISBN, and author information',
    category: 'books-publishing',
    productType: 'physical',
    tier: 'free',
    designStyle: 'professional',
    author: { name: 'Payhuk Team', email: 'templates@payhuk.com', url: 'https://payhuk.com' },
    tags: ['books', 'publishing', 'literature', 'reading', 'ISBN', 'author'],
    thumbnail: '/templates/physical/books-thumb.jpg',
    previewImages: ['/templates/physical/books-1.jpg', '/templates/physical/books-2.jpg'],
    demoUrl: 'https://demo.payhuk.com/templates/books',
    industry: 'publishing',
    targetAudience: ['publishers', 'bookstores', 'authors', 'literary-agents'],
    features: ['Book preview', 'Author bio', 'Table of contents', 'ISBN tracking', 'Reviews section', 'Sample chapters'],
    requirements: ['ISBN', 'Book details', 'Author information', 'Cover images', 'Sample content'],
    license: 'Standard License',
    price: 0,
    analytics: { downloads: 1654, views: 7432, rating: 4.8, favorites: 187, usageCount: 923 },
    seo: {
      title: 'Books & Publishing Template - Professional Bookstore',
      metaDescription: 'Professional template for books with previews and author info',
      keywords: ['book template', 'publishing', 'ISBN', 'author bio'],
      ogImage: '/templates/physical/books-og.jpg',
    },
    createdAt: '2025-10-29T11:30:00Z',
    updatedAt: '2025-10-29T11:30:00Z',
  },
  data: {
    basic: {
      name: 'The Modern Developer\'s Guide',
      slug: 'modern-developers-guide',
      tagline: 'Master Full-Stack Development in 2025',
      shortDescription: 'Comprehensive guide to modern web development practices',
      fullDescription: `Become a full-stack developer with this comprehensive 450-page guide.

Covering React, Node.js, TypeScript, and modern DevOps practices, this book provides hands-on projects and real-world examples. Perfect for intermediate developers looking to level up.

Includes access to companion code repository and video tutorials.`,
      category: 'books',
      subcategory: 'technology',
      brand: 'TechPress',
    },
    pricing: { basePrice: 34.99, currency: 'EUR', salePrice: 29.99, compareAtPrice: 49.99, costPerItem: 12.00, taxable: true, taxCode: 'BOOKS' },
    visual: {
      thumbnail: '/products/book-cover.jpg',
      images: ['/products/book-spine.jpg', '/products/book-pages.jpg', '/products/book-table.jpg'],
      videoUrl: 'https://youtube.com/watch?v=book-preview',
      has360View: false,
      hasModelPhotos: false,
    },
    seo: {
      metaTitle: 'The Modern Developer\'s Guide | Full-Stack Development 2025',
      metaDescription: 'Learn React, Node.js, TypeScript. 450 pages + code + videos. Best-selling tech book.',
      keywords: ['web development', 'full-stack', 'react', 'nodejs', 'typescript'],
      slug: 'modern-developers-guide',
    },
    features: [
      '450 pages of expert content',
      'Full-color illustrations',
      'Hands-on projects',
      'Code repository access',
      'Video tutorials',
      'Hardcover & Paperback',
      'eBook included',
      'Regular updates',
    ],
    benefits: ['Master modern stack', 'Build real projects', 'Career advancement', 'Community access', 'Lifetime updates'],
    specifications: {
      format: 'Hardcover',
      pages: 450,
      dimensions: '23.5 x 19 x 3 cm',
      weight: '1.2 kg',
      language: 'English',
      publisher: 'TechPress Publishing',
      publicationDate: '2025-01-15',
      edition: '1st Edition',
      isbn10: '1234567890',
      isbn13: '978-1234567890',
      binding: 'Hardcover',
      illustrations: 'Full Color',
    },
    physical: {
      inventory: {
        sku: 'BOOK-DEV-001',
        barcode: '9781234567890',
        trackQuantity: true,
        quantity: 500,
        lowStockThreshold: 50,
        allowBackorders: true,
        stockStatus: 'in_stock',
      },
      variants: [
        { id: 'var-hardcover', name: 'Hardcover', options: { format: 'Hardcover' }, sku: 'BOOK-HC', price: 34.99, stock: 300 },
        { id: 'var-paperback', name: 'Paperback', options: { format: 'Paperback' }, sku: 'BOOK-PB', price: 24.99, stock: 200 },
      ],
      variantOptions: [{ name: 'Format', values: ['Hardcover', 'Paperback', 'eBook'] }],
      shipping: {
        weight: 1.2,
        weightUnit: 'kg',
        dimensions: { length: 23.5, width: 19, height: 3, unit: 'cm' },
        requiresShipping: true,
        shippingClass: 'media-mail',
        freeShippingThreshold: 25,
      },
      // Book-specific fields
      bookDetails: {
        author: 'Sarah Johnson',
        contributor: 'Tech Community',
        series: 'Modern Development Series',
        volume: '1',
        tableOfContents: [
          'Part 1: Frontend Foundations',
          'Part 2: Backend Architecture',
          'Part 3: Database Design',
          'Part 4: DevOps & Deployment',
          'Part 5: Advanced Patterns',
        ],
        sampleChapter: '/samples/chapter-1.pdf',
        audience: 'Intermediate to Advanced Developers',
        prerequisites: 'Basic JavaScript knowledge',
      },
      authorBio: {
        name: 'Sarah Johnson',
        title: 'Senior Software Architect',
        bio: '15+ years in web development. Previously at Google and Netflix. Speaker at major tech conferences.',
        photo: '/authors/sarah-johnson.jpg',
        website: 'https://sarahjohnson.dev',
        socialMedia: { twitter: '@sarahcodes', linkedin: 'sarahjohnson' },
      },
    },
    designTokens: {
      colors: { primary: '#2c3e50', secondary: '#ecf0f1', accent: '#3498db', background: '#ffffff', text: '#34495e' },
      typography: { fontFamily: 'Merriweather, serif', headingSize: '36px', bodySize: '18px', lineHeight: '1.8' },
      spacing: { small: '16px', medium: '32px', large: '48px' },
      borderRadius: '4px',
      shadows: { card: '0 2px 8px rgba(0,0,0,0.1)', hover: '0 4px 16px rgba(0,0,0,0.15)' },
    },
    faqs: [
      { question: 'Is this for beginners?', answer: 'It\'s best suited for developers with basic JavaScript knowledge looking to advance.' },
      { question: 'Do I get the eBook too?', answer: 'Yes! Free eBook (PDF/EPUB) included with physical purchase.' },
      { question: 'Is it up to date?', answer: 'Published January 2025 with latest frameworks and best practices.' },
      { question: 'Any video content?', answer: 'Yes, includes access to 10+ hours of companion video tutorials.' },
    ],
    customFields: {
      genre: 'Technology',
      subjects: ['Web Development', 'Programming', 'Software Engineering'],
      awards: 'Best Tech Book 2025 - Dev Community',
      reviews: 4.9,
      bestSeller: true,
    },
  },
};

export default booksPublishingTemplate;

