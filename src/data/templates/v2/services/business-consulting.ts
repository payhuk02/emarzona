/**
 * 💼 BUSINESS CONSULTING SERVICE TEMPLATE
 * Professional template for consulting services
 * Inspired by: McKinsey, BCG, Calendly
 */

import { TemplateV2 } from '@/types/templates-v2';

export const businessConsultingTemplate: TemplateV2 = {
  metadata: {
    id: 'service-business-consulting-v2',
    version: '1.0.0',
    name: 'Business Consulting - Inspired by McKinsey',
    shortDescription: 'Professional consulting service with packages and scheduling',
    description: 'Complete consulting service template with tiered packages, availability calendar, and client portal',
    category: 'business-consulting',
    productType: 'service',
    tier: 'free',
    designStyle: 'professional',
    author: { name: 'Payhuk Team', email: 'templates@payhuk.com', url: 'https://payhuk.com' },
    tags: ['consulting', 'business', 'strategy', 'advisory', 'professional-services'],
    thumbnail: '/templates/services/consulting-thumb.jpg',
    previewImages: ['/templates/services/consulting-1.jpg'],
    demoUrl: 'https://demo.payhuk.com/templates/consulting',
    industry: 'professional-services',
    targetAudience: ['consultants', 'advisors', 'strategists', 'coaches'],
    features: ['Tiered packages', 'Online scheduling', 'Video calls', 'Document sharing', 'Progress tracking'],
    requirements: ['Expertise area', 'Availability schedule', 'Package pricing'],
    license: 'Standard License',
    price: 0,
    analytics: { downloads: 1234, views: 5678, rating: 4.9, favorites: 156, usageCount: 789 },
    seo: {
      title: 'Business Consulting Service Template - Professional Advisory',
      metaDescription: 'Professional consulting template with packages and scheduling',
      keywords: ['consulting template', 'business advisory', 'professional services'],
      ogImage: '/templates/services/consulting-og.jpg',
    },
    createdAt: '2025-10-29T12:00:00Z',
    updatedAt: '2025-10-29T12:00:00Z',
  },
  data: {
    basic: {
      name: 'Business Strategy Consulting',
      slug: 'business-strategy-consulting',
      tagline: 'Transform Your Business with Expert Guidance',
      shortDescription: 'Strategic consulting for growth-stage companies',
      fullDescription: `Accelerate your business growth with our proven consulting methodology.

We work with CEOs and leadership teams to define strategy, optimize operations, and drive sustainable growth. Our data-driven approach has helped 200+ companies achieve their goals.`,
      category: 'consulting',
      subcategory: 'strategy',
      brand: 'StrategyPro',
    },
    pricing: {
      basePrice: 250.00,
      currency: 'EUR',
      salePrice: null,
      compareAtPrice: null,
      costPerItem: 0,
      taxable: true,
      taxCode: 'SERVICES',
    },
    visual: {
      thumbnail: '/services/consulting-main.jpg',
      images: ['/services/consulting-process.jpg', '/services/consulting-results.jpg'],
      videoUrl: 'https://youtube.com/watch?v=intro',
      has360View: false,
      hasModelPhotos: true,
    },
    seo: {
      metaTitle: 'Business Strategy Consulting | Expert Advisory Services',
      metaDescription: 'Transform your business with proven strategy consulting. 200+ successful engagements.',
      keywords: ['business consulting', 'strategy consulting', 'business advisory'],
      slug: 'business-strategy-consulting',
    },
    features: [
      'Initial assessment call',
      'Custom strategy roadmap',
      'Weekly progress meetings',
      'Executive coaching',
      'Implementation support',
      'Performance metrics tracking',
    ],
    benefits: ['Accelerated growth', 'Clear direction', 'Expert guidance', 'Measurable results', 'Long-term success'],
    specifications: {
      duration: '60 minutes per session',
      deliveryMethod: 'Video call or in-person',
      languages: 'English, French',
      responseTime: 'Within 24 hours',
      availability: 'Monday-Friday, 9AM-6PM CET',
    },
    // Service-specific fields
    service: {
      type: 'consulting',
      delivery: 'remote',
      duration: 60,
      durationUnit: 'minutes',
      
      // Booking settings
      booking: {
        enabled: true,
        requiresApproval: false,
        minAdvanceBooking: 24, // hours
        maxAdvanceBooking: 90, // days
        bufferTime: 15, // minutes between sessions
        cancellationPolicy: '24 hours notice required',
        reschedulingAllowed: true,
      },

      // Packages/Tiers
      packages: [
        {
          id: 'pkg-initial',
          name: 'Initial Consultation',
          price: 250,
          duration: 60,
          sessions: 1,
          description: 'One-time assessment and recommendations',
          features: ['60-min strategy session', 'Written recommendations', 'Action plan'],
        },
        {
          id: 'pkg-monthly',
          name: 'Monthly Advisory',
          price: 1500,
          duration: 60,
          sessions: 4,
          description: 'Ongoing monthly support',
          features: ['4x 60-min sessions/month', 'Email support', 'Resource library access', 'Progress reports'],
          popular: true,
        },
        {
          id: 'pkg-quarterly',
          name: 'Quarterly Retainer',
          price: 15000,
          duration: 60,
          sessions: 12,
          description: 'Comprehensive quarterly engagement',
          features: ['12 sessions over 3 months', 'Priority support', 'Team workshops', 'Implementation help'],
        },
      ],

      // Availability
      availability: {
        timezone: 'Europe/Paris',
        schedule: [
          { day: 'monday', slots: ['09:00', '11:00', '14:00', '16:00'] },
          { day: 'tuesday', slots: ['09:00', '11:00', '14:00', '16:00'] },
          { day: 'wednesday', slots: ['09:00', '11:00', '14:00'] },
          { day: 'thursday', slots: ['09:00', '11:00', '14:00', '16:00'] },
          { day: 'friday', slots: ['09:00', '11:00', '14:00'] },
        ],
      },

      // Meeting details
      meetingDetails: {
        platform: 'Zoom, Google Meet, or in-person',
        preparation: 'Please complete intake form 24h before',
        materials: 'Shared via secure portal',
        recording: 'Available upon request',
      },
    },
    designTokens: {
      colors: { primary: '#1e3a8a', secondary: '#f1f5f9', accent: '#3b82f6', background: '#ffffff', text: '#1e293b' },
      typography: { fontFamily: 'Inter, sans-serif', headingSize: '32px', bodySize: '16px', lineHeight: '1.6' },
      spacing: { small: '12px', medium: '24px', large: '48px' },
      borderRadius: '8px',
      shadows: { card: '0 1px 3px rgba(0,0,0,0.1)', hover: '0 4px 6px rgba(0,0,0,0.1)' },
    },
    faqs: [
      { question: 'How does booking work?', answer: 'Select a package and choose available time slots. You\'ll receive confirmation within 2 hours.' },
      { question: 'Can I reschedule?', answer: 'Yes, with 24 hours notice.' },
      { question: 'Do you offer refunds?', answer: 'Full refund if cancelled 48+ hours before first session.' },
    ],
    customFields: {
      expertise: ['Strategy', 'Operations', 'Digital Transformation'],
      industries: ['Technology', 'Healthcare', 'Finance', 'Retail'],
      clientSize: 'Series A to Series C startups',
      experience: '15+ years',
      certifications: ['MBA', 'PMP'],
    },
  },
};

export default businessConsultingTemplate;

