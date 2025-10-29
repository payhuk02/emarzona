import { Template } from '@/types/templates-v2';

export const creativeAgencyTemplate: Template = {
  id: 'service-creative-agency-dribbble',
  name: 'Creative Agency Services (PREMIUM)',
  description: 'Template PREMIUM pour agence créative - Style Dribbble innovant',
  category: 'service',
  subCategory: 'creative',
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    tags: ['creative', 'agency', 'design', 'branding', 'dribbble', 'ui-ux', 'web', 'marketing'],
    tier: 'premium',
    designStyle: 'creative',
    industry: 'creative-agency',
    language: 'fr',
    isPopular: true,
    isFeatured: true,
    usageCount: 2134,
    rating: 5.0,
    reviewCount: 456,
    lastUpdated: '2025-01-15',
    previewImages: ['https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1280&h=720'],
  },
  data: {
    productName: '{{ service_name }}',
    slug: '{{ service_name | slugify }}',
    shortDescription: 'Agence créative primée. Design exceptionnel, stratégie innovante, résultats mesurables.',
    longDescription: `# 🎨 CRÉATIVITÉ QUI TRANSFORME

## {{ service_name }} - Agence Créative Primée

Design **stratégique et innovant** qui fait la différence. Portfolio primé, clients satisfaits.

## 🚀 NOS SERVICES

### Branding & Identité
- 🎯 Stratégie de marque complète
- 🎨 Logo & charte graphique
- 📦 Packaging design
- 📘 Brand guidelines

### Design Digital
- 💻 UI/UX Design
- 📱 App mobile design
- 🌐 Web design
- ✨ Motion design

### Marketing & Communication
- 📣 Campagnes créatives
- 📸 Direction artistique
- 🎬 Vidéo & contenu
- 📊 Social media design

### Développement
- ⚡ Sites web sur-mesure
- 🛒 E-commerce
- 📲 Applications mobiles
- 🔧 Plateforme SaaS

## 💎 NOTRE PROCESS

### 1. DÉCOUVERTE
Workshop stratégique pour comprendre votre vision et objectifs

### 2. STRATÉGIE
Élaboration concept créatif et plan d'action détaillé

### 3. CRÉATION
Design et développement avec itérations régulières

### 4. LANCEMENT
Mise en production et support post-lancement

### 5. CROISSANCE
Optimisation continue basée sur données

## 🏆 EXCELLENCE RECONNUE

✅ **{{ awards_count }}+ Prix Design** remportés  
✅ **{{ clients_count }}+ Clients** prestigieux  
✅ **{{ projects_count }}+ Projets** réalisés  
✅ **{{ rating }}/5** Satisfaction client  
✅ **{{ team_size }}+ Talents** créatifs  

## 📦 FORFAITS

### 🌟 Forfait Identité
**{{ price_identity }}€**
- Logo professionnel
- Charte graphique
- Business cards
- Assets digitaux
- Fichiers sources

### 🚀 Forfait Site Web
**{{ price_website }}€**
- Design sur-mesure
- Développement responsive
- SEO optimisé
- CMS intégré
- Formation incluse
- **BESTSELLER**

### 👑 Forfait Complet
**Sur devis**
- Branding complet
- Site web + app
- Campagne marketing
- Support continu
- Équipe dédiée

## 🎯 NOTRE DIFFÉRENCE

### Expertise
- 🎨 Designers seniors certifiés
- 💻 Développeurs full-stack experts
- 📊 Stratèges marketing data-driven
- 🎬 Créateurs de contenu primés

### Méthodologie
- 🔄 Agile & itérative
- 📊 Data-driven decisions
- 🎯 Centré utilisateur
- ⚡ Livraison rapide

### Résultats
- 📈 ROI moyen +340%
- ⚡ Délais respectés 98%
- 😊 Satisfaction 5/5
- 🔁 Clients récurrents 85%

## ⭐ CLIENTS & PROJETS

Portfolio disponible sur demande

> "Meilleure agence avec laquelle nous avons travaillé. Créativité, professionnalisme, résultats." - **CEO, Tech Startup**

> "Ont transformé notre image de marque. ROI exceptionnel." - **CMO, E-commerce**

## 📞 CONSULTATION STRATÉGIQUE

**1h gratuite** pour discuter de votre projet

📧 {{ email }}  
📞 {{ phone }}  
🌐 {{ website }}  
📱 Instagram: @{{ instagram }}  
🎨 Dribbble: {{ dribbble }}

**Portfolio complet disponible**

---

**Design qui inspire, stratégie qui performe** ✨`,
    price: 5000.00,
    currency: 'EUR',
    images: [{ url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1280&h=720&fit=crop', alt: 'Creative Agency', isPrimary: true, sortOrder: 1 }],
    colors: { primary: '#EA4C89', secondary: '#0D0C22', accent: '#F4F4F4', background: '#FAFAFA', text: '#0D0C22' },
    seo: { metaTitle: 'Agence Créative Primée | Design, Branding, Web | Portfolio International', metaDescription: 'Agence créative award-winning. UI/UX, branding, web design. {{ projects_count }}+ projets, clients prestigieux. Consultation gratuite.', keywords: ['agence créative', 'design', 'branding', 'dribbble', 'ui-ux', 'web design'] },
    service: { duration: 480, durationUnit: 'minutes', packages: [
      { id: 'identity', name: 'Identité', price: 5000, sessions: 1, description: 'Branding complet' },
      { id: 'website', name: 'Site Web', price: 8000, sessions: 1, description: 'Design + dev', isPopular: true },
      { id: 'complete', name: 'Complet', price: 0, sessions: 1, description: 'Sur devis projet' },
    ]},
  },
};

export default creativeAgencyTemplate;

