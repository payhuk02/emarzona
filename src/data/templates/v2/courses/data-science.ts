import { Template } from '@/types/templates-v2';

export const dataScienceTemplate: Template = {
  id: 'course-data-science-datacamp',
  name: 'Data Science Course',
  description: 'Template data science - Style DataCamp tech',
  category: 'course',
  subCategory: 'data-science',
  metadata: { version: '2.0.0', author: 'Payhuk Templates', tags: ['data-science', 'python', 'datacamp', 'machine-learning', 'ai'], tier: 'free', designStyle: 'tech', industry: 'data', language: 'fr', isPopular: true, usageCount: 3654, rating: 4.9, reviewCount: 543, lastUpdated: '2025-01-15', previewImages: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720'] },
  data: { productName: '{{ course_name }}', slug: '{{ course_name | slugify }}', shortDescription: 'Formation data science complète. Python, ML, IA. Projets réels, certification reconnue.', longDescription: `# 📊 DEVENEZ DATA SCIENTIST\n\n## Programme Complet\n\n- 🐍 Python pour Data Science\n- 📈 Statistics & Probability\n- 🤖 Machine Learning\n- 🧠 Deep Learning\n- 📊 Data Visualization\n\n## {{ exercises_count }}+ Exercices Interactifs\n\nApprentissage hands-on avec datasets réels\n\n## 💰 {{ price }}€\n\n---\n\n**Lancez votre carrière data !** 🚀`, price: 299.00, currency: 'EUR', images: [{ url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720&fit=crop', alt: 'Data Science', isPrimary: true, sortOrder: 1 }], colors: { primary: '#05192D', secondary: '#03EF62', accent: '#FFFFFF', background: '#FFFFFF', text: '#05192D' }, seo: { metaTitle: 'Formation Data Science | Python, ML, IA | DataCamp Style', metaDescription: 'Cours data science complet. Python, machine learning, IA. {{ exercises_count }}+ exercices. Certifi', keywords: ['data science', 'python', 'machine learning', 'datacamp', 'ai'] }, course: { level: 'beginner-to-advanced', duration: 6, durationUnit: 'months', totalHours: 240, format: ['interactive', 'video', 'projects'], certificate: true, pricing: [{ id: 'full', name: 'Bootcamp Complet', price: 299, description: 'Accès lifetime + cert', isPopular: true }] } },
};

export default dataScienceTemplate;

