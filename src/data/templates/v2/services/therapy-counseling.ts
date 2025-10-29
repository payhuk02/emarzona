import { Template } from '@/types/templates-v2';

/**
 * SERVICES TEMPLATE #3: THERAPY & COUNSELING
 * Inspired by: BetterHelp
 * Design: Supportive, safe, professional
 * Perfect for: Mental health services, therapy, counseling
 * Tier: Free
 */
export const therapyCounselingTemplate: Template = {
  id: 'service-therapy-counseling-betterhelp',
  name: 'Therapy & Counseling Services',
  description: 'Template professionnel pour services de thérapie et conseil - Style BetterHelp bienveillant',
  category: 'service',
  subCategory: 'therapy',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    authorUrl: 'https://payhuk.com/templates',
    tags: [
      'therapy', 'counseling', 'mental-health', 'psychology', 'wellness',
      'betterhelp', 'support', 'healing', 'professional', 'confidential',
      'anxiety', 'depression', 'stress', 'relationships'
    ],
    difficulty: 'intermediate',
    estimatedSetupTime: 6,
    requiredFields: ['name', 'price', 'duration', 'therapist_credentials'],
    optionalFields: ['specializations', 'insurance_accepted', 'emergency_support'],
    isPopular: true,
    isFeatured: true,
    usageCount: 4287,
    rating: 4.9,
    reviewCount: 891,
    lastUpdated: '2025-01-15',
    tier: 'free',
    designStyle: 'calm',
    industry: 'mental-health',
    language: 'fr',
    previewImages: [
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1280&h=720',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1280&h=720',
    ],
  },

  data: {
    productName: '{{ service_name }}',
    slug: '{{ service_name | slugify }}',
    shortDescription: 'Thérapie professionnelle confidentielle en ligne avec thérapeute certifié. Espace sûr pour votre bien-être mental.',
    longDescription: `# 🌱 PRENEZ SOIN DE VOTRE SANTÉ MENTALE

## {{ service_name }} - Un Espace Sûr Pour Vous

Une thérapie **professionnelle, confidentielle et accessible** avec des thérapeutes certifiés pour vous accompagner vers le bien-être.

## 💚 POURQUOI CHOISIR NOTRE THÉRAPIE ?

✅ **Thérapeutes Certifiés** - {{ therapist_credentials }}  
✅ **100% Confidentiel** - Vos données sont protégées  
✅ **Flexible & Accessible** - En ligne, à votre rythme  
✅ **Matching Personnalisé** - Le bon thérapeute pour vous  
✅ **Support Continu** - Messagerie entre sessions  

## 🎯 NOUS AIDONS AVEC

### Santé Mentale
- 😰 **Anxiété & Stress** - Gérer l'inquiétude quotidienne
- 😔 **Dépression** - Retrouver joie et motivation
- 😱 **Traumatisme** - Guérir des blessures passées
- 😴 **Troubles du sommeil** - Retrouver un sommeil réparateur

### Relations
- 💔 **Thérapie de couple** - Renforcer votre relation
- 👨‍👩‍👧 **Thérapie familiale** - Améliorer la communication
- 💑 **Relations toxiques** - Se libérer et guérir
- 😞 **Rupture & deuil** - Traverser la perte

### Développement Personnel
- 💪 **Confiance en soi** - S'affirmer davantage
- 🎯 **Transitions de vie** - Naviguer le changement
- ⚖️ **Équilibre vie pro/perso** - Trouver l'harmonie
- 🌱 **Croissance personnelle** - Devenir votre meilleure version

## 🔒 CONFIDENTIALITÉ TOTALE

Votre vie privée est notre priorité :

- 🔐 **Cryptage end-to-end** - Communications sécurisées
- 📋 **Conformité RGPD** - Protection des données
- 🤐 **Secret professionnel** - Strictement respecté
- 🛡️ **Serveurs sécurisés** - En France, certifiés

## 👨‍⚕️ NOS THÉRAPEUTES

### Qualifications Requises
- 🎓 **Diplôme** Master en Psychologie Clinique minimum
- 📜 **Licence** Inscription à l'Ordre des Psychologues
- 📊 **Expérience** 5+ ans de pratique clinique
- 🔄 **Formation continue** Supervision régulière

### Spécialisations Disponibles
__for__ specialization in therapist_specializations
- {{ specialization }}
__endfor__

### Approches Thérapeutiques
- 🧠 **TCC** (Thérapie Cognitivo-Comportementale)
- 💭 **Psychodynamique** (Analyse approfondie)
- 🌟 **Humaniste** (Approche centrée sur la personne)
- 🎯 **Solution-focused** (Orientée solutions)
- 🧘 **Mindfulness** (Pleine conscience)
- 🗣️ **EMDR** (Traitement trauma)

## 📱 COMMENT ÇA MARCHE ?

### Étape 1: Questionnaire (5 min)
Partagez vos besoins et préférences de manière confidentielle.

### Étape 2: Matching Intelligent
Notre algorithme vous associe au thérapeute le plus adapté.

### Étape 3: Première Session
Rencontrez votre thérapeute et établissez vos objectifs.

### Étape 4: Suivi Régulier
Sessions hebdomadaires + messagerie illimitée.

## 💬 FORMATS DE THÉRAPIE

### Sessions Vidéo (Recommandé)
- 🎥 Face-à-face virtuel sécurisé
- 👁️ Communication non-verbale
- 🏠 Confort de votre domicile

### Messagerie Texte
- 📱 Écrivez quand vous voulez
- 💭 Réponse sous 24h maximum
- 📝 Gardez une trace écrite

### Sessions Téléphone
- 📞 Plus personnel que le texte
- 🚶 Promenez-vous pendant la séance
- 🔊 Concentrez-vous sur la voix

### Chat en Direct
- 💬 Discussion en temps réel
- ⚡ Pour moments de crise
- 📲 Sur ordinateur ou mobile

## 📦 FORMULES D'ABONNEMENT

### 🌱 Formule Essentielle
**{{ price_essential }}€/mois**
- 1 session vidéo par semaine (45 min)
- Messagerie illimitée avec thérapeute
- Accès app mobile & desktop
- Changement de thérapeute gratuit
- Ressources & exercices

---

### 🌟 Formule Complète
**{{ price_complete }}€/mois**
- 1 session vidéo par semaine (60 min)
- Messagerie illimitée
- 1 session supplémentaire/mois incluse
- Accès prioritaire au calendrier
- Workshops de groupe mensuels
- Bibliothèque complète de ressources

**🔥 LA PLUS POPULAIRE**

---

### 💎 Formule Premium
**{{ price_premium }}€/mois**
- 2 sessions vidéo par semaine (60 min)
- Messagerie illimitée avec réponse < 3h
- Sessions d'urgence disponibles
- Thérapeute dédié 24/7
- Accès tous workshops
- Consultation psychiatre incluse (si besoin)

## 📊 RÉSULTATS CLINIQUES

Des résultats prouvés scientifiquement :

- **94%** des clients voient une amélioration
- **86%** rapportent une réduction significative des symptômes
- **4.9/5** satisfaction globale
- **92%** recommandent à leur entourage

### Témoignages Anonymes

> "Après 3 mois de thérapie, ma vie a changé. Je gère maintenant mon anxiété et je dors enfin bien." - **Client anonyme**

> "Mon thérapeute m'a aidé à surmonter ma dépression. Je ne pensais pas que c'était possible en ligne, mais ça fonctionne vraiment." - **Client anonyme**

> "La messagerie entre sessions a été un game-changer. Je peux exprimer mes pensées quand j'en ai besoin." - **Client anonyme**

## ⚕️ SOUTIEN EN CAS DE CRISE

**Si vous êtes en crise immédiate :**

- 🆘 **Urgences:** 15 ou 112
- 📞 **SOS Amitié:** 09 72 39 40 50 (24h/24)
- 💬 **Suicide Écoute:** 01 45 39 40 00 (24h/24)
- 📱 **Fil Santé Jeunes:** 0 800 235 236 (9h-23h)

Notre service n'est pas adapté aux urgences psychiatriques immédiates.

## 💰 PAIEMENT & REMBOURSEMENT

### Options de Paiement
- 💳 **Carte bancaire** - Prélèvement mensuel automatique
- 🏦 **Virement** - Paiement trimestriel ou annuel
- 💰 **Économisez** - Paiement annuel: -20%

### Remboursement Mutuelle
- ✅ **Certaines mutuelles** remboursent la psychothérapie
- 📋 **Facture conforme** fournie automatiquement
- 📞 **Support admin** pour vous aider avec votre mutuelle

### Tarif Solidaire
**Situation financière difficile ?**
- 💚 Programme d'aide disponible
- 📧 Contactez-nous en toute confidentialité
- 🤝 Solutions de paiement adaptées

## 🎁 INCLUS AVEC VOTRE ABONNEMENT

- 📚 **Bibliothèque de ressources** - Articles, vidéos, podcasts
- 🧘 **Méditations guidées** - Exercices de relaxation
- 📝 **Journal thérapeutique** - Suivez vos progrès
- 📊 **Tests psychométriques** - Évaluations validées
- 🎓 **Workshops en ligne** - Groupes thérapeutiques
- 👥 **Communauté de soutien** - Forum modéré

## ❓ QUESTIONS FRÉQUENTES

**La thérapie en ligne est-elle aussi efficace ?**
Oui ! Des études montrent que la thérapie en ligne est aussi efficace que en présentiel pour la plupart des problèmes.

**Combien de temps dure une thérapie ?**
Cela varie. Certains clients voient des améliorations en quelques semaines, d'autres bénéficient d'un suivi de plusieurs mois.

**Puis-je changer de thérapeute ?**
Absolument ! La relation thérapeutique est clé. Changement gratuit à tout moment.

**Mes données sont-elles sécurisées ?**
100%. Cryptage militaire, serveurs en France, conformité RGPD totale.

## 🚀 COMMENCEZ AUJOURD'HUI

### Essai Sans Risque
**Première semaine satisfait ou remboursé**

Si après votre première session vous n'êtes pas satisfait, remboursement intégral, aucune question posée.

---

**Prêt à prendre soin de vous ?** 💚

Votre bien-être mental mérite attention et soins professionnels.

**📝 Démarrez votre questionnaire gratuit**  
**💬 Chattez avec notre équipe**  
**📞 Appelez-nous:** 01 23 45 67 89  

---

_"Prendre soin de sa santé mentale, c'est un signe de force, pas de faiblesse."_`,
    
    price: 240.00,
    compareAtPrice: 320.00,
    currency: 'EUR',
    
    sku: 'THERAPY-{{ specialization }}-{{ subscription_type }}',
    
    images: [
      {
        url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1280&h=720&fit=crop',
        alt: '{{ service_name }} - Session de thérapie en ligne',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1280&h=720&fit=crop',
        alt: '{{ service_name }} - Espace thérapeutique sécurisé',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
    
    videoUrl: 'https://www.youtube.com/watch?v=therapy-how-it-works',
    
    colors: {
      primary: '#00796B',      // BetterHelp Teal
      secondary: '#4DB6AC',    // Light teal
      accent: '#FF6F61',       // Warm coral
      background: '#F1F8F6',
      text: '#263238',
      success: '#66BB6A',
      warning: '#FFA726',
      error: '#EF5350',
    },
    
    typography: {
      fontFamily: 'Lato, system-ui, sans-serif',
      headingFont: 'Lato, sans-serif',
      bodyFont: 'Lato, sans-serif',
      fontSize: {
        base: '16px',
        heading: '30px',
        small: '14px',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 700,
      },
    },
    
    seo: {
      metaTitle: '{{ service_name }} - Thérapie en Ligne Confidentielle | Thérapeutes Certifiés',
      metaDescription: 'Thérapie professionnelle en ligne 100% confidentielle. Thérapeutes certifiés, matching personnalisé, support continu. Première semaine satisfait ou remboursé.',
      keywords: [
        'thérapie en ligne',
        'psychologue',
        'betterhelp',
        'santé mentale',
        'counseling',
        'anxiété',
        'dépression',
        'confidentiel',
      ],
      ogImage: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=630&fit=crop',
      twitterCard: 'summary_large_image',
    },
    
    faq: [
      {
        question: 'Mes conversations sont-elles vraiment confidentielles ?',
        answer: 'Absolument. Toutes vos communications sont cryptées end-to-end et couvertes par le secret professionnel. Vos thérapeutes sont tenus au même niveau de confidentialité qu\'en cabinet.',
      },
      {
        question: 'Comment êtes-vous remboursé par la mutuelle ?',
        answer: 'Nous fournissons une facture conforme. De nombreuses mutuelles remboursent partiellement la psychothérapie. Contactez votre mutuelle avec notre facture pour connaître votre couverture.',
      },
      {
        question: 'Puis-je choisir mon thérapeute ?',
        answer: 'Notre algorithme vous matche avec le thérapeute le plus adapté selon vos besoins. Vous pouvez consulter leur profil et changer gratuitement si vous souhaitez essayer quelqu\'un d\'autre.',
      },
      {
        question: 'Que se passe-t-il si j\'ai une crise ?',
        answer: 'Pour les urgences immédiates, contactez le 15 ou le 112. Notre service n\'est pas adapté aux crises psychiatriques. Pour support non-urgent, utilisez notre messagerie ou planifiez une session d\'urgence (Formule Premium).',
      },
      {
        question: 'Puis-je annuler mon abonnement ?',
        answer: 'Oui, à tout moment, sans frais ni pénalité. Aucun engagement. Vous pouvez reprendre quand vous voulez.',
      },
      {
        question: 'Est-ce adapté aux adolescents ?',
        answer: 'Oui, pour les 13-17 ans avec consentement parental. Nous avons des thérapeutes spécialisés en thérapie pour adolescents.',
      },
    ],
    
    customFields: [
      {
        key: 'therapist_credentials',
        label: 'Diplômes thérapeute',
        value: 'Master Psychologie Clinique, Licence professionnelle',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'session_duration',
        label: 'Durée session',
        value: '45-60',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'confidentiality_level',
        label: 'Niveau confidentialité',
        value: 'Maximum - Cryptage end-to-end',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'crisis_support',
        label: 'Support crise',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'insurance_accepted',
        label: 'Mutuelle acceptée',
        value: 'Facture conforme fournie',
        type: 'text',
        isPublic: true,
      },
    ],
    
    service: {
      duration: 50,
      durationUnit: 'minutes',
      sessionType: 'one-on-one',
      format: ['video', 'phone', 'messaging', 'chat'],
      
      availability: {
        timezone: 'Europe/Paris',
        schedule: [
          { day: 'monday', slots: ['08:00-20:00'] },
          { day: 'tuesday', slots: ['08:00-20:00'] },
          { day: 'wednesday', slots: ['08:00-20:00'] },
          { day: 'thursday', slots: ['08:00-20:00'] },
          { day: 'friday', slots: ['08:00-20:00'] },
          { day: 'saturday', slots: ['09:00-17:00'] },
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
          id: 'pkg-essential',
          name: 'Essentielle',
          sessions: 4,
          duration: 1,
          durationUnit: 'month',
          price: 240,
          compareAtPrice: 320,
          description: '4 sessions par mois + messagerie illimitée',
        },
        {
          id: 'pkg-complete',
          name: 'Complète',
          sessions: 5,
          duration: 1,
          durationUnit: 'month',
          price: 320,
          compareAtPrice: 420,
          description: '5 sessions par mois + avantages',
          isPopular: true,
        },
        {
          id: 'pkg-premium',
          name: 'Premium',
          sessions: 8,
          duration: 1,
          durationUnit: 'month',
          price: 560,
          compareAtPrice: 720,
          description: '8 sessions par mois + support prioritaire',
        },
      ],
      
      location: {
        type: 'remote',
        virtualPlatforms: ['Plateforme sécurisée propriétaire', 'App mobile iOS & Android'],
      },
      
      provider: {
        name: '{{ therapist_name }}',
        title: 'Psychologue Clinicien(ne) Certifié(e)',
        credentials: ['Master Psychologie Clinique', 'Numéro ADELI', '{{ years_experience }}+ ans d\'expérience'],
        specializations: ['{{ specialization_1 }}', '{{ specialization_2 }}', '{{ specialization_3 }}'],
        languages: ['Français', 'Anglais'],
      },
    },
  },
};

export default therapyCounselingTemplate;

