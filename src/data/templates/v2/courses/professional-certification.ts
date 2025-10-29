import { Template } from '@/types/templates-v2';

export const professionalCertificationTemplate: Template = {
  id: 'course-professional-cert-udacity',
  name: 'Professional Certification (PREMIUM)',
  description: 'Template PREMIUM certification pro - Style Udacity nanodegree',
  category: 'course',
  subCategory: 'certification',
  metadata: { version: '2.0.0', author: 'Payhuk Templates', tags: ['certification', 'professional', 'udacity', 'nanodegree', 'career'], tier: 'premium', designStyle: 'corporate', industry: 'education', language: 'fr', isPopular: true, usageCount: 2876, rating: 4.9, reviewCount: 567, lastUpdated: '2025-01-15', previewImages: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1280&h=720'] },
  data: { productName: '{{ course_name }}', slug: '{{ course_name | slugify }}', shortDescription: 'Nanodegree professionnel. Projets réels, mentors experts, garantie emploi. Certification reconnue industrie.', longDescription: `# 🎓 CERTIFICATION PROFESSIONNELLE PREMIUM\n\n## Nanodegree Reconnu Industrie\n\nCertification **niveau master** reconnue par {{ companies_count }}+ entreprises\n\n### Programme\n- 📚 Curriculum expert-reviewed\n- 💼 {{ projects_count }} projets réels portfolio\n- 👨‍🏫 Mentors dédiés 1-on-1\n- 🏢 Garantie emploi ou remboursé\n- 🎯 Career services inclus\n\n## 🏆 Garantie Succès\n\n**{{ job_placement_rate }}%** placés en emploi sous {{ job_placement_months }} mois\n\n## 💎 {{ price }}€\n\nFinancement disponible\n\n---\n\n**Accélérez votre carrière !** 🚀`, price: 1499.00, currency: 'EUR', images: [{ url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1280&h=720&fit=crop', alt: 'Professional Certification', isPrimary: true, sortOrder: 1 }], colors: { primary: '#02B3E4', secondary: '#2D3747', accent: '#FFB900', background: '#FFFFFF', text: '#2D3747' }, seo: { metaTitle: 'Nanodegree Professionnel | Certification Industrie | Garantie Emploi', metaDescription: 'Certification professionnelle premium. {{ projects_count }} projets, mentors experts. {{ job_placement_rate }}% emploi. {{ price }}€.', keywords: ['nanodegree', 'certification', 'udacity', 'professional', 'career'] }, course: { level: 'intermediate-to-advanced', duration: 6, durationUnit: 'months', totalHours: 400, format: ['video', 'projects', 'mentorship', 'career-services'], certificate: true, pricing: [{ id: 'nanodegree', name: 'Nanodegree', price: 1499, description: 'Programme complet + garantie', isPopular: true }] } },
};

export default professionalCertificationTemplate;

