/**
 * 📚 E-BOOK MINIMAL TEMPLATE V2
 * Clean, Medium-inspired design for e-books and digital guides
 * 
 * Design Inspiration: Medium, Notion, Substack
 * Best for: E-books, guides, PDFs, written content
 */

import { TemplateV2 } from '@/types/templates-v2';

export const ebookMinimalTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-ebook-minimal-v2',
    slug: 'ebook-minimal',
    version: '2.0.0',
    name: 'E-book Minimal',
    description: 'Clean, reader-focused design inspired by Medium. Perfect for e-books, guides, and written content that puts readability first.',
    shortDescription: 'Clean, reader-focused design for e-books and guides',
    
    productType: 'digital',
    category: 'ebook',
    tags: ['ebook', 'pdf', 'guide', 'minimal', 'clean', 'readable'],
    industry: ['education', 'publishing', 'content-creation'],
    
    tier: 'free',
    status: 'published',
    
    designStyle: 'minimal',
    colorScheme: 'light',
    
    author: {
      id: 'payhula-official',
      name: 'Payhula Design Team',
      verified: true,
    },
    
    license: {
      type: 'commercial',
      details: 'Free to use for commercial projects',
    },
    
    thumbnail: '/templates/v2/digital/ebook-minimal-thumb.jpg',
    thumbnailHd: '/templates/v2/digital/ebook-minimal-thumb-hd.jpg',
    previewImages: [
      '/templates/v2/digital/ebook-minimal-preview-1.jpg',
      '/templates/v2/digital/ebook-minimal-preview-2.jpg',
      '/templates/v2/digital/ebook-minimal-preview-3.jpg',
    ],
    previewVideo: '/templates/v2/digital/ebook-minimal-demo.mp4',
    demoUrl: 'https://demo.payhula.com/templates/ebook-minimal',
    
    createdAt: '2025-10-29T00:00:00Z',
    updatedAt: '2025-10-29T00:00:00Z',
    publishedAt: '2025-10-29T00:00:00Z',
    
    analytics: {
      views: 0,
      downloads: 0,
      installs: 0,
      rating: 5.0,
      ratingsCount: 0,
      favorites: 0,
    },
    
    compatibility: {
      minVersion: '2.0.0',
      requiredPlugins: [],
    },
    
    seo: {
      title: 'E-book Minimal Template - Clean Design for Digital Books',
      description: 'Professional e-book template with minimal, reader-focused design. Perfect for authors, educators, and content creators.',
      keywords: ['ebook template', 'pdf template', 'digital book', 'minimal design', 'readable'],
      schema: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'E-book Minimal Template',
        category: 'Digital Product Template',
      },
    },
    
    supportedLanguages: ['fr', 'en', 'es'],
    defaultLanguage: 'fr',
    
    features: [
      'Clean, minimal design',
      'Optimized for readability',
      'Sample chapters preview',
      'Author bio section',
      'Table of contents',
      'Reader testimonials',
      'Related books suggestions',
      'Instant download',
      'Mobile-optimized',
      'SEO-ready',
    ],
    
    highlights: [
      'Reader-first design',
      'High conversion rate',
      'Zero distractions',
    ],
  },
  
  content: {
    // ========================================================================
    // DESIGN SYSTEM
    // ========================================================================
    designTokens: {
      colors: {
        primary: '#1A1A1A',        // Near black for text
        secondary: '#6B7280',      // Gray for secondary text
        accent: '#2563EB',         // Blue for links/CTAs
        background: '#FFFFFF',     // White background
        surface: '#F9FAFB',        // Light gray for cards
        text: '#1A1A1A',           // Main text color
        textSecondary: '#6B7280',  // Secondary text
        border: '#E5E7EB',         // Subtle borders
        success: '#10B981',        // Success green
        warning: '#F59E0B',        // Warning amber
        error: '#EF4444',          // Error red
        info: '#3B82F6',           // Info blue
      },
      
      typography: {
        fontFamily: {
          heading: 'Charter, Georgia, serif',
          body: 'Inter, -apple-system, sans-serif',
          mono: 'JetBrains Mono, monospace',
        },
        fontSize: {
          xs: '0.75rem',      // 12px
          sm: '0.875rem',     // 14px
          base: '1.0625rem',  // 17px (like Medium)
          lg: '1.25rem',      // 20px
          xl: '1.5rem',       // 24px
          '2xl': '2rem',      // 32px
          '3xl': '2.5rem',    // 40px
          '4xl': '3rem',      // 48px
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeight: {
          tight: 1.2,
          normal: 1.6,    // Generous for reading
          relaxed: 1.8,
        },
      },
      
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem',
        '3xl': '6rem',
        '4xl': '8rem',
      },
      
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        md: '0 4px 6px rgba(0, 0, 0, 0.04)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.06)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.08)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
        none: 'none',
      },
      
      animations: [
        {
          name: 'fadeIn',
          duration: '0.3s',
          easing: 'ease-in',
        },
        {
          name: 'slideUp',
          duration: '0.4s',
          easing: 'ease-out',
        },
      ],
    },
    
    // ========================================================================
    // TEMPLATE LOGIC
    // ========================================================================
    logic: {
      variables: [
        {
          key: 'bookTitle',
          type: 'string',
          label: 'Titre du livre',
          description: 'Titre principal de votre e-book',
          defaultValue: 'Le Guide Complet',
          required: true,
          validation: {
            min: 5,
            max: 100,
          },
          category: 'Basic Info',
        },
        {
          key: 'bookSubtitle',
          type: 'string',
          label: 'Sous-titre',
          description: 'Sous-titre descriptif',
          defaultValue: 'Tout ce que vous devez savoir',
          required: false,
          category: 'Basic Info',
        },
        {
          key: 'authorName',
          type: 'string',
          label: 'Nom de l\'auteur',
          defaultValue: 'Votre Nom',
          required: true,
          category: 'Author',
        },
        {
          key: 'authorBio',
          type: 'richtext',
          label: 'Biographie de l\'auteur',
          defaultValue: 'Expert dans le domaine...',
          required: false,
          category: 'Author',
        },
        {
          key: 'price',
          type: 'number',
          label: 'Prix',
          defaultValue: 29,
          required: true,
          validation: {
            min: 0,
          },
          category: 'Pricing',
        },
        {
          key: 'currency',
          type: 'string',
          label: 'Devise',
          defaultValue: 'EUR',
          required: true,
          validation: {
            options: ['EUR', 'USD', 'GBP', 'XOF'],
          },
          category: 'Pricing',
        },
        {
          key: 'pageCount',
          type: 'number',
          label: 'Nombre de pages',
          defaultValue: 150,
          required: false,
          category: 'Details',
        },
        {
          key: 'format',
          type: 'string',
          label: 'Format',
          defaultValue: 'PDF',
          required: false,
          category: 'Details',
        },
        {
          key: 'sampleChapterUrl',
          type: 'string',
          label: 'URL du chapitre gratuit',
          required: false,
          category: 'Content',
        },
      ],
      
      computed: {
        displayPrice: '{{ price | currency }}',
        fullTitle: '{{ bookTitle }}: {{ bookSubtitle }}',
      },
    },
    
    // ========================================================================
    // CONTENT
    // ========================================================================
    content: {
      default: {
        hero: {
          type: 'minimal-hero',
          headline: '{{ bookTitle }}',
          subheadline: '{{ bookSubtitle }}',
          ctaText: 'Télécharger maintenant',
          ctaSecondary: 'Lire un extrait gratuit',
        },
        
        bookDetails: {
          pages: '{{ pageCount }} pages',
          format: '{{ format }}',
          language: 'Français',
          lastUpdated: '2025',
        },
        
        description: {
          intro: 'Description de votre e-book...',
          whatYouWillLearn: [
            'Point clé 1',
            'Point clé 2',
            'Point clé 3',
          ],
        },
        
        tableOfContents: [
          { chapter: 1, title: 'Introduction', pages: '1-10' },
          { chapter: 2, title: 'Les Fondamentaux', pages: '11-40' },
          { chapter: 3, title: 'Techniques Avancées', pages: '41-80' },
          { chapter: 4, title: 'Études de Cas', pages: '81-120' },
          { chapter: 5, title: 'Conclusion', pages: '121-150' },
        ],
        
        author: {
          name: '{{ authorName }}',
          bio: '{{ authorBio }}',
          image: '/placeholder-author.jpg',
          credentials: [
            'Expert avec 10+ ans d\'expérience',
            'Auteur de 5 best-sellers',
          ],
        },
        
        testimonials: [
          {
            quote: 'Ce livre a changé ma façon de travailler.',
            author: 'Jean Dupont',
            role: 'CEO, Company XYZ',
            rating: 5,
          },
          {
            quote: 'Incroyablement pratique et bien écrit.',
            author: 'Marie Martin',
            role: 'Consultante',
            rating: 5,
          },
        ],
        
        features: [
          {
            icon: 'FileText',
            title: 'Contenu Complet',
            description: '{{ pageCount }} pages de contenu expert',
          },
          {
            icon: 'Download',
            title: 'Téléchargement Immédiat',
            description: 'Accès instantané après achat',
          },
          {
            icon: 'RefreshCw',
            title: 'Mises à Jour Gratuites',
            description: 'Recevez toutes les futures mises à jour',
          },
          {
            icon: 'Smartphone',
            title: 'Multi-Support',
            description: 'Lisez sur tous vos appareils',
          },
        ],
        
        faq: [
          {
            question: 'Quel format est utilisé ?',
            answer: 'L\'e-book est disponible en format {{ format }}, compatible avec tous les lecteurs PDF.',
          },
          {
            question: 'Puis-je obtenir un remboursement ?',
            answer: 'Oui, garantie satisfait ou remboursé de 30 jours.',
          },
        ],
      },
      
      localized: {
        en: {
          'hero.headline': '{{ bookTitle }}',
          'hero.ctaText': 'Download Now',
          'hero.ctaSecondary': 'Read Free Sample',
        },
      },
    },
    
    // ========================================================================
    // SECTIONS
    // ========================================================================
    sections: [
      {
        id: 'hero',
        type: 'hero-minimal',
        name: 'Hero Section',
        enabled: true,
        order: 0,
        settings: {
          layout: 'centered',
          showImage: true,
          imagePosition: 'right',
          backgroundColor: 'background',
        },
        responsive: {
          mobile: true,
          tablet: true,
          desktop: true,
        },
      },
      
      {
        id: 'book-preview',
        type: 'image-gallery',
        name: 'Book Preview',
        enabled: true,
        order: 1,
        settings: {
          layout: '3d-cover',
          showNavigation: true,
        },
      },
      
      {
        id: 'description',
        type: 'rich-content',
        name: 'Description',
        enabled: true,
        order: 2,
        settings: {
          maxWidth: '680px',
          fontSize: 'lg',
        },
      },
      
      {
        id: 'table-of-contents',
        type: 'list',
        name: 'Table of Contents',
        enabled: true,
        order: 3,
        settings: {
          style: 'numbered',
          collapsible: false,
        },
      },
      
      {
        id: 'author',
        type: 'author-bio',
        name: 'About the Author',
        enabled: true,
        order: 4,
        settings: {
          layout: 'horizontal',
          showImage: true,
          showCredentials: true,
        },
      },
      
      {
        id: 'testimonials',
        type: 'testimonials',
        name: 'Reviews',
        enabled: true,
        order: 5,
        settings: {
          layout: 'grid',
          columns: 2,
          showRating: true,
        },
      },
      
      {
        id: 'features',
        type: 'features-grid',
        name: 'What You Get',
        enabled: true,
        order: 6,
        settings: {
          columns: 4,
          iconSize: 'lg',
        },
      },
      
      {
        id: 'cta',
        type: 'cta-box',
        name: 'Call to Action',
        enabled: true,
        order: 7,
        settings: {
          style: 'centered',
          showPrice: true,
          showGuarantee: true,
        },
      },
      
      {
        id: 'faq',
        type: 'faq-accordion',
        name: 'FAQ',
        enabled: true,
        order: 8,
        settings: {
          collapsible: true,
          openFirst: true,
        },
      },
    ],
    
    // ========================================================================
    // DIGITAL PRODUCT SETTINGS
    // ========================================================================
    digitalSettings: {
      fileTypes: ['pdf', 'epub', 'mobi'],
      
      licenseManagement: {
        enabled: true,
        type: 'single',
        activationLimit: 3,
      },
      
      downloadSettings: {
        maxDownloads: 5,
        tokenExpiration: 24, // hours
        ipRestriction: false,
      },
      
      versionControl: {
        enabled: true,
        autoUpdate: true,
        notifyCustomers: true,
      },
      
      security: {
        drmEnabled: false,
        watermarkEnabled: true,
        encryptionLevel: 'basic',
      },
    },
  },
};

export default ebookMinimalTemplate;

