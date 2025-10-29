import { Template } from '@/types/templates-v2';

/**
 * SERVICES TEMPLATE #2: PERSONAL COACHING
 * Inspired by: BetterUp
 * Design: Professional, transformation-focused, empowering
 * Perfect for: Life coaching, career coaching, executive coaching
 * Tier: Free
 */
export const personalCoachingTemplate: Template = {
  id: 'service-personal-coaching-betterup',
  name: 'Personal Coaching Services',
  description: 'Template professionnel pour services de coaching personnel - Style BetterUp transformationnel',
  category: 'service',
  subCategory: 'coaching',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    authorUrl: 'https://payhuk.com/templates',
    tags: [
      'coaching', 'personal', 'transformation', 'career', 'life',
      'betterup', 'professional', 'development', 'growth', 'mindset',
      'goals', 'leadership', 'empowerment', 'success'
    ],
    difficulty: 'intermediate',
    estimatedSetupTime: 5,
    requiredFields: ['name', 'price', 'duration', 'session_format'],
    optionalFields: ['certifications', 'specializations', 'success_rate'],
    isPopular: true,
    isFeatured: true,
    usageCount: 3521,
    rating: 4.9,
    reviewCount: 687,
    lastUpdated: '2025-01-15',
    tier: 'free',
    designStyle: 'professional',
    industry: 'coaching-development',
    language: 'fr',
    previewImages: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1280&h=720',
      'https://images.unsplash.com/photo-1552581234-26160f608093?w=1280&h=720',
    ],
  },

  data: {
    // === INFORMATIONS DE BASE ===
    productName: '{{ service_name }}',
    slug: '{{ service_name | slugify }}',
    shortDescription: 'Coaching personnel professionnel pour atteindre vos objectifs et transformer votre vie.',
    longDescription: `# 🚀 TRANSFORMEZ VOTRE VIE AUJOURD'HUI

## {{ service_name }} - Votre Partenaire de Transformation

Un coaching **sur-mesure et basé sur la science** pour débloquer votre potentiel, atteindre vos objectifs et créer la vie que vous méritez.

## 💎 POURQUOI CHOISIR CE COACHING ?

✅ **Approche Scientifique** - Méthodes validées par la recherche  
✅ **Coach Certifié** - {{ certification }} et {{ years_experience }}+ ans d'expérience  
✅ **Résultats Mesurables** - {{ success_rate }}% de satisfaction clients  
✅ **Soutien Continu** - Suivi entre les sessions  
✅ **Confidentialité Totale** - Espace 100% sécurisé et privé  

## 🎯 POUR QUI ?

Ce coaching s'adresse à vous si :

- 💼 Vous cherchez une **évolution de carrière**
- 🎓 Vous voulez développer votre **leadership**
- 🔄 Vous êtes en **transition professionnelle**
- 🚀 Vous visez une **promotion ou reconversion**
- 💪 Vous voulez améliorer votre **confiance en soi**
- ⚖️ Vous recherchez un meilleur **équilibre vie pro/perso**
- 🎨 Vous désirez clarifier votre **vision et vos objectifs**

## 🌟 CE QUE VOUS ALLEZ ACCOMPLIR

### Phase 1: Clarté & Vision (Semaines 1-2)
- 🎯 Définir vos objectifs clairs et mesurables
- 🔍 Identifier vos valeurs et motivations profondes
- 📊 Évaluer votre situation actuelle (audit complet)
- 🗺️ Créer votre feuille de route personnalisée

### Phase 2: Action & Momentum (Semaines 3-6)
- 💪 Développer des stratégies concrètes
- 🔥 Surmonter les obstacles et blocages
- 📈 Créer de nouvelles habitudes puissantes
- 🎯 Atteindre vos premiers quick wins

### Phase 3: Transformation & Durabilité (Semaines 7-12)
- ⚡ Consolider vos nouvelles compétences
- 🌱 Ancrer les changements durablement
- 🎖️ Célébrer vos victoires et progrès
- 🚀 Préparer la suite de votre évolution

## 📋 DÉROULEMENT D'UNE SESSION

### Format Standard (60 min)
1. **Check-in** (5 min) - Point sur la semaine écoulée
2. **Focus du jour** (10 min) - Définir l'objectif de la session
3. **Exploration** (30 min) - Travail en profondeur
4. **Plan d'action** (10 min) - Actions concrètes à mettre en place
5. **Récapitulatif** (5 min) - Synthèse et engagement

### Entre les Sessions
- 📱 **App mobile** - Suivi de vos progrès
- 📧 **Check-ins email** - Soutien hebdomadaire
- 📚 **Ressources** - Articles, exercices, vidéos
- 💬 **Messagerie sécurisée** - Questions et support

## 👤 VOTRE COACH

### {{ coach_name }}
**{{ coach_title }}** | **{{ certification }}**

{{ coach_bio }}

**Expérience:**
- 🎓 {{ years_experience }}+ ans en coaching professionnel
- 👥 {{ total_clients }}+ clients accompagnés
- ⭐ {{ success_rate }}% de taux de satisfaction
- 🏆 {{ achievements }}

**Spécialisations:**
__for__ specialization in specializations
- {{ specialization }}
__endfor__

**Philosophie:**
_"{{ coach_philosophy }}"_

## 📦 FORMULES DISPONIBLES

### 🌱 Formule Découverte
**{{ price_discovery }}€** - 3 sessions
- 3 sessions de 60 minutes
- Évaluation initiale complète
- Plan d'action personnalisé
- Accès app mobile 1 mois
- Support email

**Idéal pour:** Tester le coaching

---

### 🚀 Formule Transformation
**{{ price_transformation }}€** - 3 mois
- 12 sessions de 60 minutes
- Évaluation 360° approfondie
- Plan de développement sur mesure
- Accès app mobile 3 mois
- Support continu entre sessions
- Ressources exclusives
- Bilan final avec roadmap

**Idéal pour:** Changement durable

**🔥 LA PLUS POPULAIRE**

---

### 💎 Formule Excellence
**{{ price_excellence }}€** - 6 mois
- 24 sessions de 60 minutes
- Tout de la formule Transformation
- Sessions supplémentaires d'urgence
- Accès app mobile 6 mois
- Priorité sur le calendrier
- Séances de groupe mensuelles
- Certification de complétion

**Idéal pour:** Transformation profonde

## 📊 RÉSULTATS CLIENTS

Nos clients témoignent de transformations mesurables :

- **92%** ont atteint leurs objectifs principaux
- **87%** ont obtenu une promotion ou changement positif
- **95%** recommandent le coaching à leur entourage
- **4.9/5** note moyenne de satisfaction

### Témoignages

> "Grâce à {{ coach_name }}, j'ai obtenu la promotion que je visais depuis 2 ans. Les outils qu'il m'a donnés changent ma vie chaque jour !" - **Sophie L., Directrice Marketing**

> "J'ai enfin trouvé ma voie et lancé mon entreprise. Le ROI de ce coaching est incalculable." - **Marc D., Entrepreneur**

> "Une expérience transformatrice. J'ai retrouvé confiance en moi et clarté sur mes objectifs." - **Julie T., Manager**

## 🛠️ OUTILS & MÉTHODES

Notre approche combine les meilleures pratiques :

- 🧠 **Psychologie Positive** - Science du bien-être
- 🎯 **Programmation Neuro-Linguistique (PNL)** - Communication efficace
- 📊 **Objectifs SMART** - Cadre structuré
- 🔄 **Growth Mindset** - Mentalité de croissance
- 🧘 **Mindfulness** - Pleine conscience
- 📈 **Accountability Systems** - Systèmes de responsabilisation

## 💻 MODALITÉS

### Format des Sessions
- 🎥 **Vidéo** (Zoom, Teams, Google Meet)
- 📞 **Téléphone** (si préféré)
- 🏢 **Présentiel** (Paris uniquement, +50€/session)

### Horaires
- 📅 **Flexibles** - Disponibilités larges
- 🕐 **Matin, après-midi ou soir** - À votre convenance
- 🌍 **Fuseaux horaires** - S'adapte si international

### Réservation
- 📆 **Plateforme en ligne** - Réservez 24/7
- ⚡ **Confirmation immédiate** - Email de confirmation
- 🔄 **Reprogrammation facile** - Jusqu'à 24h avant
- 📲 **Rappels automatiques** - SMS et email

## 🎁 BONUS INCLUS

Avec toute formule, vous recevez :

- 📘 **Workbook personnalisé** - Exercices et réflexions
- 🎧 **Méditations guidées** - Audios exclusifs
- 📊 **Outils d'évaluation** - Tests psychométriques
- 📚 **Bibliothèque de ressources** - Articles, vidéos, podcasts
- 🌐 **Accès communauté** - Groupe privé alumni

## 🛡️ GARANTIES

### Confidentialité Absolue
- 🔒 Toutes nos conversations sont strictement confidentielles
- 📋 Respect du code de déontologie ICF
- 🔐 Données cryptées et sécurisées

### Satisfaction Garantie
- ✅ Si la première session ne vous convient pas, remboursement intégral
- 🔄 Changement de coach possible à tout moment
- 💯 Engagement qualité ou remboursé

## 📞 COMMENT DÉMARRER ?

### Étape 1: Consultation Gratuite (30 min)
Discutons de vos objectifs et voyons si nous sommes bien alignés.

**Réservez maintenant** → [Calendrier en ligne]

### Étape 2: Évaluation Initiale
Questionnaire approfondi pour mieux vous connaître.

### Étape 3: Première Session
On démarre votre transformation !

---

**Prêt à passer à l'action ?** 🚀

La meilleure décision que vous prendrez cette année commence maintenant.

**📅 Réservez votre consultation gratuite**  
**📞 Appelez-nous:** +33 1 23 45 67 89  
**📧 Email:** coaching@payhuk.com  

---

_"Le futur appartient à ceux qui croient en la beauté de leurs rêves." - Eleanor Roosevelt_`,
    
    price: 2400.00,
    compareAtPrice: 3600.00,
    currency: 'EUR',
    
    sku: 'COACH-{{ specialization }}-{{ package_type }}',
    barcode: '',
    trackInventory: false,
    inventoryQuantity: 0,
    allowBackorder: false,
    
    // === VISUELS & MÉDIAS ===
    images: [
      {
        url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1280&h=720&fit=crop',
        alt: '{{ service_name }} - Session de coaching professionnelle',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=1280&h=720&fit=crop',
        alt: '{{ service_name }} - Coach et client en discussion',
        isPrimary: false,
        sortOrder: 2,
      },
      {
        url: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1280&h=720&fit=crop',
        alt: '{{ service_name }} - Résultats et transformation',
        isPrimary: false,
        sortOrder: 3,
      },
    ],
    
    videoUrl: 'https://www.youtube.com/watch?v=coaching-intro',
    video360Url: '',
    arEnabled: false,
    
    // === COULEURS & DESIGN ===
    colors: {
      primary: '#0066FF',      // BetterUp Blue
      secondary: '#00D4AA',    // Teal accent
      accent: '#FF6B6B',       // Warm red
      background: '#F8F9FA',
      text: '#1A202C',
      success: '#48BB78',
      warning: '#ED8936',
      error: '#F56565',
    },
    
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFont: 'Inter, sans-serif',
      bodyFont: 'Inter, sans-serif',
      fontSize: {
        base: '16px',
        heading: '32px',
        small: '14px',
      },
      fontWeight: {
        normal: 400,
        medium: 600,
        bold: 700,
      },
    },
    
    // === SEO & META ===
    seo: {
      metaTitle: '{{ service_name }} - Coaching Personnel Professionnel | Transformez Votre Vie',
      metaDescription: 'Coaching personnel certifié par {{ coach_name }}. {{ success_rate }}% de satisfaction. Approche scientifique, résultats mesurables. Consultation gratuite.',
      keywords: [
        'coaching personnel',
        'life coaching',
        'career coaching',
        'betterup style',
        'transformation',
        'développement personnel',
        'coach certifié',
        'objectifs de vie',
      ],
      ogImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&h=630&fit=crop',
      twitterCard: 'summary_large_image',
    },
    
    // === FAQ ===
    faq: [
      {
        question: 'Quelle est la différence avec de la thérapie ?',
        answer: 'Le coaching se concentre sur vos objectifs futurs et votre développement, pas sur le traitement de troubles mentaux. Le coach vous aide à passer à l\'action, le thérapeute traite des problèmes psychologiques passés.',
      },
      {
        question: 'Combien de temps dure un coaching ?',
        answer: 'Cela dépend de vos objectifs. Un coaching court (3 mois) suffit pour des objectifs précis. Pour une transformation profonde, 6-12 mois est recommandé. Nous adaptons la durée à vos besoins.',
      },
      {
        question: 'À quelle fréquence ont lieu les sessions ?',
        answer: 'Généralement 1 session par semaine ou toutes les 2 semaines selon votre formule. Un rythme régulier est clé pour maintenir le momentum et ancrer les changements.',
      },
      {
        question: 'Que se passe-t-il si je dois annuler une session ?',
        answer: 'Vous pouvez reprogrammer jusqu'à 24h avant sans frais. En cas d\'annulation tardive, la session est due mais peut être reportée selon disponibilités.',
      },
      {
        question: 'Le coaching est-il confidentiel ?',
        answer: 'Absolument. Tout ce qui est partagé en session reste strictement confidentiel. Nous respectons le code de déontologie ICF (International Coach Federation).',
      },
      {
        question: 'Comment savoir si le coaching est fait pour moi ?',
        answer: 'Réservez une consultation gratuite de 30 min ! Nous discuterons de vos objectifs et verrons ensemble si le coaching peut vous aider. Sans engagement.',
      },
    ],
    
    // === CHAMPS PERSONNALISÉS ===
    customFields: [
      {
        key: 'coach_certification',
        label: 'Certifications coach',
        value: 'ICF ACC, PCC',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'years_experience',
        label: 'Années d\'expérience',
        value: '10',
        type: 'number',
        isPublic: true,
      },
      {
        key: 'success_rate',
        label: 'Taux de satisfaction',
        value: '92',
        type: 'number',
        isPublic: true,
      },
      {
        key: 'session_duration',
        label: 'Durée session',
        value: '60',
        type: 'number',
        isPublic: true,
      },
      {
        key: 'session_format',
        label: 'Format',
        value: 'Visio, Téléphone, Présentiel',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'specializations',
        label: 'Spécialisations',
        value: 'Carrière, Leadership, Transition',
        type: 'text',
        isPublic: true,
      },
    ],
    
    // === SPÉCIFIQUE SERVICE ===
    service: {
      duration: 60,
      durationUnit: 'minutes',
      
      sessionType: 'one-on-one',
      format: ['video', 'phone', 'in-person'],
      
      availability: {
        timezone: 'Europe/Paris',
        schedule: [
          { day: 'monday', slots: ['09:00-12:00', '14:00-18:00'] },
          { day: 'tuesday', slots: ['09:00-12:00', '14:00-18:00'] },
          { day: 'wednesday', slots: ['09:00-12:00', '14:00-18:00'] },
          { day: 'thursday', slots: ['09:00-12:00', '14:00-18:00'] },
          { day: 'friday', slots: ['09:00-12:00', '14:00-16:00'] },
        ],
      },
      
      bookingRules: {
        minAdvanceBooking: 24,
        maxAdvanceBooking: 90,
        cancellationPolicy: '24h',
        rescheduleAllowed: true,
        rescheduleDeadline: 24,
      },
      
      packages: [
        {
          id: 'pkg-discovery',
          name: 'Découverte',
          sessions: 3,
          duration: 1,
          durationUnit: 'month',
          price: 600,
          compareAtPrice: 900,
          description: '3 sessions pour découvrir le coaching',
        },
        {
          id: 'pkg-transformation',
          name: 'Transformation',
          sessions: 12,
          duration: 3,
          durationUnit: 'months',
          price: 2400,
          compareAtPrice: 3600,
          description: '12 sessions pour une transformation durable',
          isPopular: true,
        },
        {
          id: 'pkg-excellence',
          name: 'Excellence',
          sessions: 24,
          duration: 6,
          durationUnit: 'months',
          price: 4200,
          compareAtPrice: 6000,
          description: '24 sessions pour une transformation profonde',
        },
      ],
      
      location: {
        type: 'remote',
        address: '',
        city: '',
        country: 'France',
        virtualPlatforms: ['Zoom', 'Google Meet', 'Microsoft Teams'],
      },
      
      provider: {
        name: '{{ coach_name }}',
        title: 'Coach Professionnel Certifié',
        bio: 'Expert en développement personnel et professionnel',
        credentials: ['ICF ACC', 'PCC', '{{ additional_certifications }}'],
        experience: '{{ years_experience }}+ ans',
        languages: ['Français', 'Anglais'],
      },
    },
  },
};

export default personalCoachingTemplate;

