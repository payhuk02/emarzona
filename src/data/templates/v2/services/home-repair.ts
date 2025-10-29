import { Template } from '@/types/templates-v2';

/**
 * SERVICES TEMPLATE #4: HOME REPAIR
 * Inspired by: TaskRabbit
 * Design: Practical, reliable, on-demand
 * Perfect for: Handyman services, repairs, installations, maintenance
 * Tier: Free
 */
export const homeRepairTemplate: Template = {
  id: 'service-home-repair-taskrabbit',
  name: 'Home Repair & Handyman Services',
  description: 'Template professionnel pour services de réparation à domicile - Style TaskRabbit pratique',
  category: 'service',
  subCategory: 'home-services',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    authorUrl: 'https://payhuk.com/templates',
    tags: [
      'repair', 'handyman', 'home', 'maintenance', 'installation',
      'taskrabbit', 'plumbing', 'electrical', 'carpentry', 'fixing',
      'on-demand', 'professional', 'reliable', 'skilled'
    ],
    difficulty: 'beginner',
    estimatedSetupTime: 4,
    requiredFields: ['name', 'price', 'service_area', 'skills'],
    optionalFields: ['insurance', 'tools_included', 'emergency_service'],
    isPopular: true,
    isFeatured: false,
    usageCount: 2876,
    rating: 4.8,
    reviewCount: 534,
    lastUpdated: '2025-01-15',
    tier: 'free',
    designStyle: 'practical',
    industry: 'home-services',
    language: 'fr',
    previewImages: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1280&h=720',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1280&h=720',
    ],
  },

  data: {
    productName: '{{ service_name }}',
    slug: '{{ service_name | slugify }}',
    shortDescription: 'Service de réparation professionnel à domicile. Intervention rapide, travail de qualité, tarif transparent.',
    longDescription: `# 🔧 VOTRE EXPERT BRICOLAGE À DOMICILE

## {{ service_name }} - Réparations Professionnelles

Un **professionnel qualifié et assuré** pour tous vos travaux de réparation et d'entretien à domicile.

## ✅ POURQUOI NOUS CHOISIR ?

✅ **Professionnel Certifié** - {{ certifications }}  
✅ **Intervention Rapide** - Dispo sous 24-48h  
✅ **Tarif Transparent** - Devis gratuit avant intervention  
✅ **Assuré & Garanti** - Travaux garantis {{ warranty_period }}  
✅ **Outils Inclus** - Pas de matériel à fournir  

## 🛠️ NOS SERVICES

### Plomberie
- 💧 Fuite d'eau et réparations
- 🚿 Installation sanitaires
- 🔧 Débouchage canalisations
- 🚰 Robinetterie

### Électricité
- 💡 Installation luminaires
- 🔌 Prises et interrupteurs
- ⚡ Diagnostic pannes électriques
- 🏠 Mise aux normes

### Menuiserie
- 🚪 Pose portes et fenêtres
- 📦 Montage meubles
- 🔨 Réparations bois
- 🎨 Étagères sur mesure

### Peinture & Décoration
- 🎨 Peinture murs et plafonds
- 🖼️ Pose papier peint
- ✨ Finitions décoratives
- 🏠 Rafraîchissement pièces

### Maintenance
- 🔧 Entretien général
- 🏡 Petits travaux divers
- 🔍 Diagnostic problèmes
- 🛡️ Prévention pannes

## 💰 TARIFICATION

### Tarif Horaire
**{{ hourly_rate }}€/heure** (TTC)
- Déplacement inclus dans la zone
- Minimum 1h facturable
- Devis gratuit avant intervention

### Forfaits Courants
- 🔧 **Forfait Small:** 89€ (1-2h)
- 🛠️ **Forfait Medium:** 149€ (2-3h)
- 🏗️ **Forfait Large:** 249€ (demi-journée)

### Services d'Urgence
**+50€** - Intervention sous 2h (selon dispo)

## 📍 ZONE D'INTERVENTION

**{{ service_area }}**
- Déplacement gratuit dans la zone
- Hors zone: +{{ extra_zone_fee }}€

## ⏰ DISPONIBILITÉS

- 📅 **Lundi-Vendredi:** 8h-19h
- 📅 **Samedi:** 9h-18h
- 🆘 **Urgences:** 7j/7 (supplément)

## 🎯 COMMENT ÇA MARCHE ?

1. **Décrivez** votre besoin en ligne
2. **Recevez** un devis gratuit sous 2h
3. **Réservez** le créneau qui vous convient
4. **Accueillez** le professionnel chez vous
5. **Payez** une fois le travail terminé et approuvé

## 🛡️ GARANTIES

- ✅ **Travaux garantis** {{ warranty_period }}
- ✅ **Assurance responsabilité civile** professionnelle
- ✅ **Satisfaction client** ou on revient gratuitement
- ✅ **Matériel de qualité** professionnelle

## ⭐ AVIS CLIENTS

> "Intervention rapide et travail impeccable. Je recommande !" - **Jean, Paris**

> "Professionnel sérieux, à l'heure, et prix correct." - **Marie, Lyon**

> "Problème résolu en 1h. Super service !" - **Thomas, Marseille**

## 📞 RÉSERVATION

**Besoin d'un coup de main ?**

📱 **Réservez en ligne** - Disponibilités en temps réel  
📞 **Appelez-nous:** {{ phone_number }}  
📧 **Email:** {{ email }}  

---

**Intervention rapide, travail soigné, tarif transparent !** 🔧`,
    
    price: 45.00,
    compareAtPrice: 65.00,
    currency: 'EUR',
    
    sku: 'REPAIR-{{ specialty }}-{{ region }}',
    
    images: [
      {
        url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1280&h=720&fit=crop',
        alt: '{{ service_name }} - Professionnel au travail',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1280&h=720&fit=crop',
        alt: '{{ service_name }} - Outils et équipement',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    
    videoUrl: '',
    
    colors: {
      primary: '#1E88E5',
      secondary: '#FFC107',
      accent: '#43A047',
      background: '#FAFAFA',
      text: '#212121',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
    },
    
    typography: {
      fontFamily: 'Roboto, sans-serif',
      headingFont: 'Roboto, sans-serif',
      bodyFont: 'Roboto, sans-serif',
      fontSize: {
        base: '16px',
        heading: '28px',
        small: '14px',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 700,
      },
    },
    
    seo: {
      metaTitle: '{{ service_name }} - Bricoleur Professionnel à Domicile | Intervention Rapide',
      metaDescription: 'Service de réparation à domicile. Professionnel certifié, intervention rapide, tarif transparent. Plomberie, électricité, menuiserie. Devis gratuit.',
      keywords: [
        'bricoleur',
        'handyman',
        'taskrabbit',
        'réparation domicile',
        'plombier',
        'électricien',
        'menuisier',
        'dépannage',
      ],
      ogImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=630&fit=crop',
      twitterCard: 'summary_large_image',
    },
    
    faq: [
      {
        question: 'Proposez-vous un devis gratuit ?',
        answer: 'Oui, toujours ! Décrivez votre besoin en ligne et recevez un devis gratuit sous 2h. Aucun engagement.',
      },
      {
        question: 'Êtes-vous assuré ?',
        answer: 'Oui, nous avons une assurance responsabilité civile professionnelle complète pour tous nos services.',
      },
      {
        question: 'Fournissez-vous le matériel ?',
        answer: 'Oui, nous apportons tous les outils nécessaires. Pour les fournitures spécifiques (robinet, luminaire, etc.), nous pouvons les acheter pour vous ou vous les fournissez.',
      },
      {
        question: 'Pouvez-vous intervenir en urgence ?',
        answer: 'Oui, service d\'urgence disponible 7j/7 avec supplément de 50€. Intervention sous 2h selon disponibilités.',
      },
      {
        question: 'Quelle est votre garantie ?',
        answer: 'Tous nos travaux sont garantis {{ warranty_period }}. Si un problème survient, nous revenons gratuitement.',
      },
    ],
    
    customFields: [
      {
        key: 'certifications',
        label: 'Certifications',
        value: 'Qualibat, RGE',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'warranty_period',
        label: 'Garantie',
        value: '6 mois',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'service_area',
        label: 'Zone intervention',
        value: 'Paris et 20km alentours',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'emergency_available',
        label: 'Urgences disponibles',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
    ],
    
    service: {
      duration: 120,
      durationUnit: 'minutes',
      sessionType: 'on-site',
      format: ['in-person'],
      
      availability: {
        timezone: 'Europe/Paris',
        schedule: [
          { day: 'monday', slots: ['08:00-19:00'] },
          { day: 'tuesday', slots: ['08:00-19:00'] },
          { day: 'wednesday', slots: ['08:00-19:00'] },
          { day: 'thursday', slots: ['08:00-19:00'] },
          { day: 'friday', slots: ['08:00-19:00'] },
          { day: 'saturday', slots: ['09:00-18:00'] },
        ],
      },
      
      bookingRules: {
        minAdvanceBooking: 4,
        maxAdvanceBooking: 30,
        cancellationPolicy: '24h',
        rescheduleAllowed: true,
        rescheduleDeadline: 24,
      },
      
      packages: [
        {
          id: 'pkg-small',
          name: 'Forfait Small',
          sessions: 1,
          duration: 1.5,
          durationUnit: 'hours',
          price: 89,
          description: 'Petits travaux (1-2h)',
        },
        {
          id: 'pkg-medium',
          name: 'Forfait Medium',
          sessions: 1,
          duration: 3,
          durationUnit: 'hours',
          price: 149,
          description: 'Travaux moyens (2-3h)',
          isPopular: true,
        },
        {
          id: 'pkg-large',
          name: 'Forfait Large',
          sessions: 1,
          duration: 4,
          durationUnit: 'hours',
          price: 249,
          description: 'Gros travaux (demi-journée)',
        },
      ],
      
      location: {
        type: 'on-site',
        address: '',
        city: '{{ city }}',
        country: 'France',
        serviceArea: '{{ service_area }}',
      },
      
      provider: {
        name: '{{ provider_name }}',
        title: 'Artisan Professionnel',
        credentials: ['{{ certifications }}', '{{ years_experience }}+ ans d\'expérience'],
        specializations: ['Plomberie', 'Électricité', 'Menuiserie', 'Peinture'],
        languages: ['Français'],
      },
    },
  },
};

export default homeRepairTemplate;

