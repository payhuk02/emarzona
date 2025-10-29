import { Template } from '@/types/templates-v2';

export const marketingCourseTemplate: Template = {
  id: 'course-marketing-hubspot',
  name: 'Digital Marketing Course',
  description: 'Template marketing - Style HubSpot professionnel',
  category: 'course',
  subCategory: 'marketing',
  metadata: { version: '2.0.0', author: 'Payhuk Templates', tags: ['marketing', 'digital', 'hubspot', 'seo', 'social-media'], tier: 'free', designStyle: 'professional', industry: 'marketing', language: 'fr', isPopular: true, usageCount: 3987, rating: 4.9, reviewCount: 654, lastUpdated: '2025-01-15', previewImages: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720'] },
  data: { productName: '{{ course_name }}', slug: '{{ course_name | slugify }}', shortDescription: 'Certification marketing digital. SEO, content, social media, analytics. Reconnu industrie.', longDescription: `# 📈 MAÎTRISEZ LE MARKETING DIGITAL\n\n## Programme Certifiant\n\n- 🔍 SEO & SEM\n- 📱 Social Media Marketing\n- ✍️ Content Marketing\n- 📊 Analytics & Data\n- 🎯 Strategy & Planning\n\n## 🏆 Certification HubSpot Style\n\nReconnue par {{ companies_count }}+ entreprises\n\n## 💰 {{ price }}€\n\n---\n\n**Boostez votre carrière !** 🚀`, price: 199.00, currency: 'EUR', images: [{ url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop', alt: 'Marketing', isPrimary: true, sortOrder: 1 }], colors: { primary: '#FF7A59', secondary: '#2E475D', accent: '#00BDA5', background: '#FFFFFF', text: '#2E475D' }, seo: { metaTitle: 'Certification Marketing Digital | HubSpot Style | SEO, Social Media', metaDescription: 'Formation marketing digital complète. Certification reconnue. SEO, content, analytics. {{ price }}€.', keywords: ['marketing digital', 'hubspot', 'seo', 'certification', 'social media'] }, course: { level: 'beginner-to-intermediate', duration: 2, durationUnit: 'months', totalHours: 80, format: ['video', 'quizzes', 'projects'], certificate: true, pricing: [{ id: 'full', name: 'Certification', price: 199, description: 'Accès lifetime + cert', isPopular: true }] } },
};

export default marketingCourseTemplate;

