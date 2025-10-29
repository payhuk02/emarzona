import { Template } from '@/types/templates-v2';

/**
 * SERVICES TEMPLATE #5: EVENT PLANNING
 * Inspired by: Eventbrite
 * Design: Organized, vibrant, celebration-focused
 * Perfect for: Event planning, party planning, corporate events
 * Tier: Free
 */
export const eventPlanningTemplate: Template = {
  id: 'service-event-planning-eventbrite',
  name: 'Event Planning Services',
  description: 'Template professionnel pour organisation d\'événements - Style Eventbrite festif',
  category: 'service',
  subCategory: 'events',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    tags: ['event', 'planning', 'party', 'wedding', 'corporate', 'eventbrite', 'celebration', 'organization'],
    difficulty: 'intermediate',
    estimatedSetupTime: 5,
    tier: 'free',
    designStyle: 'vibrant',
    industry: 'events',
    language: 'fr',
    isPopular: true,
    usageCount: 2134,
    rating: 4.8,
    reviewCount: 387,
    lastUpdated: '2025-01-15',
    previewImages: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1280&h=720'],
  },

  data: {
    productName: '{{ service_name }}',
    slug: '{{ service_name | slugify }}',
    shortDescription: 'Organisation professionnelle d\'événements sur-mesure. De l\'idée à la réalisation, nous créons des moments inoubliables.',
    longDescription: `# 🎉 CRÉONS ENSEMBLE VOTRE ÉVÉNEMENT DE RÊVE

## {{ service_name }} - Événements Inoubliables

Organisation **complète et sur-mesure** de tous vos événements privés et professionnels.

## ✨ NOS SERVICES

### Événements Privés
- 💍 **Mariages** - Jour parfait garanti
- 🎂 **Anniversaires** - Célébrations mémorables  
- 🎓 **Cérémonies** - Moments solennels
- 🏠 **Réceptions** - Événements intimes

### Événements Corporate
- 🏢 **Séminaires** - Formation & team building
- 🎤 **Conférences** - Organisation A-Z
- 🍾 **Soirées d'entreprise** - Networking & fun
- 🚀 **Lancements produits** - Impact maximal

## 📦 FORMULES

### 🌟 Formule Coordination
**À partir de {{ price_coordination }}€**
- Coordination jour-J uniquement
- Gestion planning & timing
- Contact prestataires
- Présence 8h sur place

### 💎 Formule Complète
**À partir de {{ price_complete }}€**
- Conception complète
- Sélection prestataires
- Suivi total du projet
- Coordination jour-J
- **LA PLUS POPULAIRE**

### 👑 Formule Premium
**Sur devis**
- Tout de la Formule Complète
- Design & décoration exclusive
- Prestataires haut de gamme
- Assistance illimitée
- Forfait ultra-personnalisé

## 🎯 NOTRE PROCESSUS

1. **Consultation gratuite** - Définir votre vision
2. **Devis personnalisé** - Transparent et détaillé
3. **Planification** - Organisation minutieuse
4. **Exécution** - Jour-J sans stress
5. **Bilan** - Débriefing post-événement

## ⭐ POURQUOI NOUS ?

✅ **{{ years_experience }}+ ans d'expérience**  
✅ **{{ events_organized }}+ événements réalisés**  
✅ **Réseau de {{ partners_count }}+ prestataires**  
✅ **Satisfaction {{ satisfaction_rate }}%**  
✅ **Budget respecté garanti**  

## 📞 CONSULTATION GRATUITE

Discutons de votre projet sans engagement !

📧 **Email:** {{ email }}  
📞 **Téléphone:** {{ phone }}  

---

**Votre événement mérite le meilleur !** 🎊`,
    
    price: 1500.00,
    currency: 'EUR',
    sku: 'EVENT-{{ event_type }}-{{ package }}',
    
    images: [{
      url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1280&h=720&fit=crop',
      alt: '{{ service_name }} - Événement professionnel',
      isPrimary: true,
      sortOrder: 1,
    }],
    
    colors: {
      primary: '#F05537',
      secondary: '#39364E',
      accent: '#FFC859',
      background: '#FFFFFF',
      text: '#39364E',
    },
    
    seo: {
      metaTitle: '{{ service_name }} - Organisation Événements Pro | Mariages, Corporate',
      metaDescription: 'Organisation professionnelle d\'événements. Mariages, anniversaires, séminaires. {{ years_experience }}+ ans expérience. Consultation gratuite.',
      keywords: ['event planning', 'organisation événement', 'mariage', 'eventbrite', 'corporate events'],
    },
    
    service: {
      duration: 480,
      durationUnit: 'minutes',
      sessionType: 'consulting',
      format: ['in-person', 'hybrid'],
      packages: [
        { id: 'coordination', name: 'Coordination', price: 1500, sessions: 1, description: 'Jour-J uniquement' },
        { id: 'complete', name: 'Complète', price: 3500, sessions: 1, description: 'Organisation complète', isPopular: true },
        { id: 'premium', name: 'Premium', price: 0, sessions: 1, description: 'Sur devis personnalisé' },
      ],
    },
  },
};

export default eventPlanningTemplate;

