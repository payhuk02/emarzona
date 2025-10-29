import { Template } from '@/types/templates-v2';

export const businessCourseTemplate: Template = {
  id: 'course-business-coursera',
  name: 'Business & Management Course',
  description: 'Template pour cours business - Style Coursera académique',
  category: 'course',
  subCategory: 'business',
  metadata: { version: '2.0.0', author: 'Payhuk Templates', tags: ['business', 'management', 'coursera', 'mba', 'entrepreneurship'], tier: 'free', designStyle: 'academic', industry: 'education', language: 'fr', isPopular: true, usageCount: 3421, rating: 4.8, reviewCount: 654, lastUpdated: '2025-01-15', previewImages: ['https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1280&h=720'] },
  data: {
    productName: '{{ course_name }}',
    slug: '{{ course_name | slugify }}',
    shortDescription: 'Cours business complet avec certification. Professeurs top universités mondiales.',
    longDescription: `# 🎓 EXCELLENCE ACADÉMIQUE EN BUSINESS\n\n## Programme Complet\n\n**{{ total_hours }}h** de contenu | **{{ modules_count }}** modules | Certification incluse\n\n### Modules\n- 📊 Stratégie d'entreprise\n- 💰 Finance & comptabilité\n- 📈 Marketing digital\n- 👥 Management & leadership\n- 🚀 Entrepreneurship\n\n## 🏆 Certification\n\nCertificat reconnu par {{ partner_universities_count }}+ universités partenaires\n\n## 💰 Prix: {{ price }}€\n\n---\n\n**Commencez votre MBA en ligne aujourd'hui !** 🎓`,
    price: 89.00,
    currency: 'EUR',
    images: [{ url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1280&h=720&fit=crop', alt: 'Business Course', isPrimary: true, sortOrder: 1 }],
    colors: { primary: '#0056D2', secondary: '#FFFFFF', accent: '#1F8DE8', background: '#FFFFFF', text: '#1F1F1F' },
    seo: { metaTitle: 'Cours Business & Management | Certification Université | Coursera Style', metaDescription: 'Cours business complet en ligne. {{ total_hours }}h de contenu, certification reconnue. Professeurs top universités.', keywords: ['business', 'management', 'coursera', 'mba', 'certification'] },
    course: { level: 'intermediate', duration: 3, durationUnit: 'months', totalHours: 120, format: ['video', 'quizzes', 'projects'], certificate: true, modules: [{ id: 'strategy', name: 'Stratégie', lessons: 20, duration: 4, durationUnit: 'weeks' }, { id: 'finance', name: 'Finance', lessons: 20, duration: 4, durationUnit: 'weeks' }, { id: 'marketing', name: 'Marketing', lessons: 20, duration: 4, durationUnit: 'weeks' }], pricing: [{ id: 'single', name: 'Cours unique', price: 89, description: 'Accès lifetime' }] },
  },
};

export default businessCourseTemplate;

