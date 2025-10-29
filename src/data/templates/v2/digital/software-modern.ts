/**
 * 💻 SOFTWARE MODERN TEMPLATE V2
 * Tech-forward design for SaaS, apps, and software products
 * 
 * Design Inspiration: Stripe, Linear, Vercel, Framer
 * Best for: SaaS, applications, software tools, tech products
 */

import { TemplateV2 } from '@/types/templates-v2';

export const softwareModernTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-software-modern-v2',
    slug: 'software-modern',
    version: '2.0.0',
    name: 'Software Modern',
    description: 'Cutting-edge design for SaaS and software products. Inspired by Stripe and Linear, with smooth animations, gradient accents, and a tech-forward aesthetic.',
    shortDescription: 'Modern SaaS template with gradient accents and smooth animations',
    
    productType: 'digital',
    category: 'software',
    tags: ['software', 'saas', 'app', 'modern', 'tech', 'gradient'],
    industry: ['technology', 'software', 'startup'],
    
    tier: 'free',
    status: 'published',
    
    designStyle: 'modern',
    colorScheme: 'dark',
    
    author: {
      id: 'payhula-official',
      name: 'Payhula Design Team',
      verified: true,
    },
    
    license: {
      type: 'commercial',
      details: 'Free to use for commercial projects',
    },
    
    thumbnail: '/templates/v2/digital/software-modern-thumb.jpg',
    thumbnailHd: '/templates/v2/digital/software-modern-thumb-hd.jpg',
    previewImages: [
      '/templates/v2/digital/software-modern-preview-1.jpg',
      '/templates/v2/digital/software-modern-preview-2.jpg',
      '/templates/v2/digital/software-modern-preview-3.jpg',
      '/templates/v2/digital/software-modern-preview-4.jpg',
    ],
    previewVideo: '/templates/v2/digital/software-modern-demo.mp4',
    demoUrl: 'https://demo.payhula.com/templates/software-modern',
    
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
      title: 'Software Modern Template - SaaS & App Landing Page',
      description: 'Professional software template with modern design, gradient accents, and smooth animations. Perfect for SaaS products and apps.',
      keywords: ['saas template', 'software template', 'app landing page', 'modern design', 'tech'],
      schema: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        applicationCategory: 'BusinessApplication',
      },
    },
    
    supportedLanguages: ['fr', 'en', 'es'],
    defaultLanguage: 'fr',
    
    features: [
      'Modern gradient design',
      'Smooth scroll animations',
      'Interactive feature showcase',
      'Pricing table',
      'Dashboard preview',
      'API documentation section',
      'Integration logos',
      'Video demo',
      'Dark mode optimized',
      'Tech stack display',
    ],
    
    highlights: [
      'Tech-forward design',
      'High conversion',
      'Enterprise-ready',
    ],
  },
  
  content: {
    // ========================================================================
    // DESIGN SYSTEM
    // ========================================================================
    designTokens: {
      colors: {
        primary: '#6366F1',        // Indigo
        secondary: '#8B5CF6',      // Purple
        accent: '#EC4899',         // Pink
        background: '#0F172A',     // Slate 900
        surface: '#1E293B',        // Slate 800
        text: '#F8FAFC',           // Slate 50
        textSecondary: '#94A3B8',  // Slate 400
        border: '#334155',         // Slate 700
        success: '#10B981',        // Emerald
        warning: '#F59E0B',        // Amber
        error: '#EF4444',          // Red
        info: '#3B82F6',           // Blue
      },
      
      typography: {
        fontFamily: {
          heading: 'Inter, -apple-system, sans-serif',
          body: 'Inter, -apple-system, sans-serif',
          mono: 'JetBrains Mono, monospace',
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.75rem',
          '3xl': '2.25rem',
          '4xl': '3.5rem',
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeight: {
          tight: 1.1,
          normal: 1.5,
          relaxed: 1.7,
        },
      },
      
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem',
      },
      
      borderRadius: {
        none: '0',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 20px rgba(0, 0, 0, 0.5)',
        xl: '0 25px 50px rgba(0, 0, 0, 0.6)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        none: 'none',
        glow: '0 0 20px rgba(99, 102, 241, 0.5)',
      },
      
      animations: [
        {
          name: 'fadeIn',
          duration: '0.6s',
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
        {
          name: 'slideUp',
          duration: '0.8s',
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        },
        {
          name: 'scaleIn',
          duration: '0.5s',
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        {
          name: 'gradient',
          duration: '3s',
          easing: 'ease-in-out',
          iterationCount: 'infinite',
        },
      ],
    },
    
    // ========================================================================
    // TEMPLATE LOGIC
    // ========================================================================
    logic: {
      variables: [
        {
          key: 'productName',
          type: 'string',
          label: 'Nom du produit',
          defaultValue: 'YourSaaS',
          required: true,
          category: 'Basic Info',
        },
        {
          key: 'tagline',
          type: 'string',
          label: 'Tagline',
          defaultValue: 'The modern way to work',
          required: true,
          validation: {
            max: 60,
          },
          category: 'Basic Info',
        },
        {
          key: 'description',
          type: 'richtext',
          label: 'Description',
          defaultValue: 'Build better products, faster...',
          required: true,
          category: 'Basic Info',
        },
        {
          key: 'pricingModel',
          type: 'string',
          label: 'Modèle de tarification',
          defaultValue: 'subscription',
          validation: {
            options: ['one_time', 'subscription', 'freemium'],
          },
          category: 'Pricing',
        },
        {
          key: 'starterPrice',
          type: 'number',
          label: 'Prix Starter',
          defaultValue: 9,
          category: 'Pricing',
        },
        {
          key: 'proPrice',
          type: 'number',
          label: 'Prix Pro',
          defaultValue: 29,
          category: 'Pricing',
        },
        {
          key: 'enterprisePrice',
          type: 'string',
          label: 'Prix Enterprise',
          defaultValue: 'Sur devis',
          category: 'Pricing',
        },
        {
          key: 'demoVideoUrl',
          type: 'string',
          label: 'URL vidéo démo',
          required: false,
          category: 'Media',
        },
        {
          key: 'githubUrl',
          type: 'string',
          label: 'URL GitHub',
          required: false,
          category: 'Links',
        },
        {
          key: 'documentationUrl',
          type: 'string',
          label: 'URL Documentation',
          required: false,
          category: 'Links',
        },
      ],
      
      computed: {
        starterPriceFormatted: '{{ starterPrice | currency }} /mois',
        proPriceFormatted: '{{ proPrice | currency }} /mois',
      },
    },
    
    // ========================================================================
    // CONTENT
    // ========================================================================
    content: {
      default: {
        hero: {
          type: 'tech-hero',
          headline: '{{ productName }}',
          tagline: '{{ tagline }}',
          description: '{{ description }}',
          ctaPrimary: 'Commencer gratuitement',
          ctaSecondary: 'Voir la démo',
          showDashboardPreview: true,
          backgroundEffect: 'gradient-mesh',
        },
        
        features: [
          {
            icon: 'Zap',
            title: 'Ultra-rapide',
            description: 'Performance optimale avec un temps de réponse < 50ms',
            gradient: 'from-yellow-400 to-orange-500',
          },
          {
            icon: 'Shield',
            title: 'Sécurisé',
            description: 'Chiffrement de bout en bout et conformité SOC 2',
            gradient: 'from-green-400 to-cyan-500',
          },
          {
            icon: 'Code',
            title: 'API First',
            description: 'API REST complète avec SDK pour tous les langages',
            gradient: 'from-blue-400 to-indigo-500',
          },
          {
            icon: 'Users',
            title: 'Collaboration',
            description: 'Travaillez en équipe en temps réel',
            gradient: 'from-purple-400 to-pink-500',
          },
          {
            icon: 'BarChart',
            title: 'Analytics',
            description: 'Tableaux de bord et rapports avancés',
            gradient: 'from-red-400 to-orange-500',
          },
          {
            icon: 'Globe',
            title: 'Multi-langue',
            description: 'Interface disponible en 20+ langues',
            gradient: 'from-cyan-400 to-blue-500',
          },
        ],
        
        techStack: {
          title: 'Built with modern tech',
          technologies: [
            { name: 'React', icon: '/tech/react.svg' },
            { name: 'TypeScript', icon: '/tech/typescript.svg' },
            { name: 'Node.js', icon: '/tech/nodejs.svg' },
            { name: 'PostgreSQL', icon: '/tech/postgresql.svg' },
            { name: 'Redis', icon: '/tech/redis.svg' },
            { name: 'Docker', icon: '/tech/docker.svg' },
          ],
        },
        
        dashboard: {
          title: 'Dashboard puissant',
          description: 'Interface intuitive pour gérer tous vos projets',
          screenshots: [
            '/dashboard/overview.png',
            '/dashboard/analytics.png',
            '/dashboard/settings.png',
          ],
        },
        
        integrations: {
          title: 'S\'intègre avec vos outils favoris',
          providers: [
            { name: 'Stripe', logo: '/integrations/stripe.svg' },
            { name: 'Slack', logo: '/integrations/slack.svg' },
            { name: 'GitHub', logo: '/integrations/github.svg' },
            { name: 'Figma', logo: '/integrations/figma.svg' },
            { name: 'Notion', logo: '/integrations/notion.svg' },
            { name: 'Zapier', logo: '/integrations/zapier.svg' },
          ],
        },
        
        pricing: {
          title: 'Tarifs simples et transparents',
          description: 'Choisissez le plan qui vous convient',
          plans: [
            {
              name: 'Starter',
              price: '{{ starterPrice | currency }}',
              period: 'mois',
              description: 'Parfait pour démarrer',
              features: [
                '5 projets',
                '10 Go de stockage',
                'Support par email',
                'API access',
              ],
              cta: 'Commencer',
              highlighted: false,
            },
            {
              name: 'Pro',
              price: '{{ proPrice | currency }}',
              period: 'mois',
              description: 'Pour les professionnels',
              features: [
                'Projets illimités',
                '100 Go de stockage',
                'Support prioritaire',
                'API illimitée',
                'Collaboration d\'équipe',
                'Analytics avancés',
              ],
              cta: 'Commencer l\'essai',
              highlighted: true,
            },
            {
              name: 'Enterprise',
              price: '{{ enterprisePrice }}',
              period: '',
              description: 'Pour les grandes organisations',
              features: [
                'Tout de Pro +',
                'Stockage illimité',
                'Support dédié 24/7',
                'SLA garanti',
                'Formation personnalisée',
                'Intégration sur mesure',
              ],
              cta: 'Contactez-nous',
              highlighted: false,
            },
          ],
        },
        
        api: {
          title: 'API Developer-Friendly',
          description: 'Documentation complète et SDKs pour tous les langages',
          codeExample: {
            language: 'javascript',
            code: `import { YourSaaS } from '@yoursaas/sdk';

const client = new YourSaaS('your-api-key');

// Create a project
const project = await client.projects.create({
  name: 'My Project',
  description: 'A great project'
});

// Get analytics
const stats = await client.analytics.get(project.id);

console.log(stats);`,
          },
          sdks: ['JavaScript', 'Python', 'Ruby', 'PHP', 'Go', 'Java'],
        },
        
        testimonials: [
          {
            quote: 'This tool has 10x our productivity. The API is a dream to work with.',
            author: 'Alex Johnson',
            role: 'CTO @ TechCorp',
            avatar: '/testimonials/alex.jpg',
            company: 'TechCorp',
            rating: 5,
          },
          {
            quote: 'Finally, a modern solution that just works. Clean, fast, reliable.',
            author: 'Sarah Chen',
            role: 'Lead Developer @ StartupXYZ',
            avatar: '/testimonials/sarah.jpg',
            company: 'StartupXYZ',
            rating: 5,
          },
        ],
        
        cta: {
          title: 'Prêt à transformer votre workflow?',
          description: 'Rejoignez des milliers d\'équipes qui utilisent {{ productName }}',
          primaryButton: 'Commencer gratuitement',
          secondaryButton: 'Planifier une démo',
          features: [
            'Aucune carte de crédit requise',
            'Essai gratuit de 14 jours',
            'Annulation à tout moment',
          ],
        },
      },
      
      localized: {
        en: {
          'hero.ctaPrimary': 'Get Started Free',
          'hero.ctaSecondary': 'Watch Demo',
          'pricing.title': 'Simple, transparent pricing',
        },
      },
    },
    
    // ========================================================================
    // SECTIONS
    // ========================================================================
    sections: [
      {
        id: 'hero',
        type: 'hero-tech',
        name: 'Hero with Gradient',
        enabled: true,
        order: 0,
        settings: {
          layout: 'centered',
          showDashboardPreview: true,
          backgroundEffect: 'gradient-mesh',
          animation: 'fadeIn',
        },
        responsive: {
          mobile: true,
          tablet: true,
          desktop: true,
        },
      },
      
      {
        id: 'social-proof',
        type: 'logo-cloud',
        name: 'Trusted By',
        enabled: true,
        order: 1,
        settings: {
          title: 'Utilisé par les meilleures équipes',
          grayscale: true,
        },
      },
      
      {
        id: 'features',
        type: 'features-grid-gradient',
        name: 'Features',
        enabled: true,
        order: 2,
        settings: {
          columns: 3,
          showGradients: true,
          iconSize: 'xl',
        },
      },
      
      {
        id: 'dashboard-preview',
        type: 'dashboard-showcase',
        name: 'Dashboard Preview',
        enabled: true,
        order: 3,
        settings: {
          layout: 'carousel',
          showTabs: true,
          autoplay: true,
        },
      },
      
      {
        id: 'integrations',
        type: 'integration-grid',
        name: 'Integrations',
        enabled: true,
        order: 4,
        settings: {
          columns: 6,
          showTooltips: true,
        },
      },
      
      {
        id: 'api-section',
        type: 'code-showcase',
        name: 'API Documentation',
        enabled: true,
        order: 5,
        settings: {
          showCodeEditor: true,
          syntaxHighlight: true,
          theme: 'dark',
        },
      },
      
      {
        id: 'pricing',
        type: 'pricing-table',
        name: 'Pricing',
        enabled: true,
        order: 6,
        settings: {
          columns: 3,
          highlightMiddle: true,
          showComparison: true,
          billingToggle: true,
        },
      },
      
      {
        id: 'testimonials',
        type: 'testimonials-slider',
        name: 'Testimonials',
        enabled: true,
        order: 7,
        settings: {
          layout: 'cards',
          autoplay: true,
          showCompany: true,
        },
      },
      
      {
        id: 'tech-stack',
        type: 'tech-stack',
        name: 'Tech Stack',
        enabled: true,
        order: 8,
        settings: {
          showTooltips: true,
          grayscale: false,
        },
      },
      
      {
        id: 'final-cta',
        type: 'cta-section',
        name: 'Final CTA',
        enabled: true,
        order: 9,
        settings: {
          style: 'gradient-background',
          showFeatures: true,
          size: 'large',
        },
      },
    ],
    
    // ========================================================================
    // DIGITAL PRODUCT SETTINGS
    // ========================================================================
    digitalSettings: {
      fileTypes: ['zip', 'exe', 'dmg', 'appimage'],
      
      licenseManagement: {
        enabled: true,
        type: 'multi',
        activationLimit: 5,
        expirationDays: 365,
      },
      
      downloadSettings: {
        maxDownloads: 10,
        tokenExpiration: 48,
        ipRestriction: false,
      },
      
      versionControl: {
        enabled: true,
        autoUpdate: true,
        notifyCustomers: true,
      },
      
      security: {
        drmEnabled: true,
        watermarkEnabled: false,
        encryptionLevel: 'advanced',
      },
    },
  },
};

export default softwareModernTemplate;

