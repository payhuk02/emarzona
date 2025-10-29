import { Template } from '@/types/templates-v2';

/**
 * PHYSICAL TEMPLATE #13: TOYS & GAMES
 * Inspired by: LEGO
 * Design: Playful, educational, colorful
 * Perfect for: Toys, games, educational products, children's items
 * Tier: Free
 */
export const toysGamesTemplate: Template = {
  id: 'physical-toys-games-lego',
  name: 'Toys & Games',
  description: 'Template professionnel pour jouets et jeux - Style LEGO ludique et éducatif',
  category: 'physical',
  subCategory: 'toys-games',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    authorUrl: 'https://payhuk.com/templates',
    tags: [
      'toys', 'games', 'children', 'kids', 'play', 'educational',
      'lego', 'fun', 'learning', 'creative', 'building',
      'playful', 'imagination', 'family', 'entertainment'
    ],
    difficulty: 'beginner',
    estimatedSetupTime: 3,
    requiredFields: ['name', 'price', 'age_range', 'images'],
    optionalFields: ['educational_value', 'safety_certifications', 'pieces_count'],
    isPopular: true,
    isFeatured: true,
    usageCount: 3876,
    rating: 4.9,
    reviewCount: 612,
    lastUpdated: '2025-01-15',
    tier: 'free',
    designStyle: 'playful',
    industry: 'toys-entertainment',
    language: 'fr',
    previewImages: [
      'https://images.unsplash.com/photo-1558877385-8f7d10b6d72e?w=1280&h=720',
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1280&h=720',
    ],
  },

  data: {
    // === INFORMATIONS DE BASE ===
    productName: '{{ product_name }}',
    slug: '{{ product_name | slugify }}',
    shortDescription: 'Jouet éducatif et amusant pour développer créativité et imagination. Sécurité certifiée, qualité premium.',
    longDescription: `# 🎮 L'IMAGINATION N'A PAS DE LIMITES !

## {{ product_name }} - Apprendre en S'Amusant

Offrez à votre enfant un jouet qui **stimule sa créativité, développe sa logique et garantit des heures de plaisir** en famille !

## 🌟 POURQUOI LES ENFANTS L'ADORENT

🎨 **Créativité Sans Limite** - Des milliers de combinaisons possibles  
🧠 **Développement Cognitif** - Stimule logique et résolution de problèmes  
👨‍👩‍👧‍👦 **Moments en Famille** - Plaisir partagé parents-enfants  
🏆 **Qualité LEGO** - Durabilité et sécurité garanties  
🎁 **Cadeau Parfait** - Sourires garantis à tous les coups !  

## 🎯 BÉNÉFICES ÉDUCATIFS

### 🧠 Développement Cognitif
- **Logique & Raisonnement**: Résolution de problèmes étape par étape
- **Concentration**: Développe l'attention et la patience
- **Mémoire**: Mémorisation des instructions et séquences

### 🎨 Créativité & Imagination
- **Expression Créative**: Création libre sans limite
- **Imagination**: Inventer des histoires et scénarios
- **Innovation**: Trouver de nouvelles façons de construire

### 🤝 Compétences Sociales
- **Collaboration**: Jouer et construire ensemble
- **Communication**: Partager des idées et stratégies
- **Confiance**: Fierté d'accomplir un projet

### ✋ Motricité Fine
- **Dextérité**: Manipulation précise des pièces
- **Coordination**: Œil-main synchronisé
- **Force**: Développement musculaire des mains

## 📦 CONTENU DE LA BOÎTE

- **{{ pieces_count }} pièces** de construction de haute qualité
- **Notice illustrée** claire et facile à suivre
- **Figurines** ({{ figures_count }} incluses)
- **Accessoires** et éléments décoratifs
- **Sac de rangement** réutilisable
- **Guide parental** avec idées de jeu

## 👶 ÂGE & SÉCURITÉ

**Âge recommandé:** {{ age_range }}

### 🛡️ Sécurité Certifiée
- ✅ **Normes CE** - Conforme aux normes européennes
- ✅ **Sans BPA** - Plastique 100% sûr pour les enfants
- ✅ **Peintures non toxiques** - Testées dermatologiquement
- ✅ **Pas de petites pièces dangereuses** (si age < 3 ans)
- ✅ **Coins arrondis** - Aucun risque de blessure
- ✅ **Tests rigoureux** - Contrôle qualité à chaque étape

### ⚠️ Avertissement
__if__ {{ age_range < 3 }}
**ATTENTION:** Ne convient pas aux enfants de moins de 36 mois. Risque d'étouffement dû aux petites pièces.
__endif__

## 🎮 MODES DE JEU

### 1️⃣ Mode Construction Guidée
Suivez les instructions pour construire le modèle principal. Parfait pour débuter et gagner en confiance.

**Temps de construction:** {{ build_time }} heures  
**Niveau:** Facile à Moyen

### 2️⃣ Mode Créatif Libre
Utilisez les pièces pour créer VOS propres inventions. L'imagination est la seule limite !

**Possibilités:** Infinies  
**Niveau:** Tous niveaux

### 3️⃣ Mode Jeu de Rôle
Inventez des histoires et aventures avec les figurines et accessoires inclus.

**Scénarios:** Illimités  
**Niveau:** Créatif

## 🌈 COMPATIBILITÉ

**Compatible avec:**
- Toutes les briques de construction standards
- Sets {{ product_line }} (vendus séparément)
- Collection {{ theme_name }}

**Extensible:** Combinez plusieurs sets pour créer des mondes encore plus grands !

## 🎓 VALEUR ÉDUCATIVE RECONNUE

> "Les jouets de construction comme {{ product_name }} sont essentiels au développement de l'enfant. Ils stimulent la créativité, la logique et la persévérance." - **Dr. Marie Dupont, Psychologue pour enfants**

**Approuvé par:**
- Parents Magazine ⭐⭐⭐⭐⭐
- Toy Awards 2024 🏆
- Educational Toy Association ✅

## 👨‍👩‍👧‍👦 AVIS DES PARENTS

> "Mon fils de 7 ans joue avec depuis 3 mois et ne s'en lasse pas ! Il invente de nouvelles créations chaque semaine. Excellent investissement !" - **Sophie, maman de Lucas**

> "Qualité exceptionnelle, pièces solides, instructions claires. Parfait pour occuper intelligemment les enfants." - **Thomas, papa de Chloé**

> "Cadeau d'anniversaire qui a fait l'unanimité ! Toute la famille construit ensemble le dimanche. Des moments précieux." - **Marie, grand-mère de 3 petits-enfants**

## 🎁 IDÉE CADEAU PARFAITE

Idéal pour toutes les occasions :
- 🎂 **Anniversaires** - Sourires garantis
- 🎄 **Noël** - Sous le sapin assuré
- 🎓 **Réussites scolaires** - Récompense ludique
- 🏖️ **Vacances** - Occupation intelligente
- ❤️ **Sans raison** - Juste pour faire plaisir !

## 📐 DIMENSIONS & SPECS

| Caractéristique | Valeur |
|----------------|--------|
| **Pièces** | {{ pieces_count }} pièces |
| **Dimensions modèle** | {{ length }}×{{ width }}×{{ height }}cm |
| **Poids** | {{ weight }}g |
| **Matériau** | ABS plastique premium |
| **Âge** | {{ age_range }} |
| **Difficulté** | {{ difficulty_level }} |

## 🌱 ENGAGEMENT ÉCO-RESPONSABLE

Nous nous engageons pour un avenir durable :
- ♻️ **Plastique ABS recyclable** - 100% réutilisable
- 🌿 **Production responsable** - Standards environnementaux stricts
- 📦 **Emballage recyclable** - Carton FSC sans plastique
- 🌍 **Compensation carbone** - Transport neutre en CO2
- 🎯 **Objectif 2030**: 100% matériaux durables

## 📦 LIVRAISON & EMBALLAGE

**Expédition:**
- 🚚 Livraison standard: 2-3 jours (Gratuite dès 40€)
- ⚡ Livraison express: Sous 24h (+7.99€)
- 🎁 Emballage cadeau disponible (+2.99€)
- 📦 Colis discret (pas de visuel produit sur l'emballage extérieur)

## 🛡️ GARANTIE & SAV

- **Garantie:** 2 ans contre défauts de fabrication
- **Pièces manquantes:** Remplacement gratuit sous 7 jours
- **Retour:** 30 jours satisfait ou remboursé
- **SAV:** Support dédié parents & enfants

## 🧩 EXTENSIONS DISPONIBLES

Complétez votre collection avec :
- {{ expansion_pack_1 }} (+{{ pack1_pieces }} pièces)
- {{ expansion_pack_2 }} (+{{ pack2_pieces }} pièces)
- {{ expansion_pack_3 }} (+{{ pack3_pieces }} pièces)

**Pack Bundle:** Économisez 15% en achetant 3 sets !

## 💡 CONSEILS PARENTS

**Pour maximiser le plaisir:**
1. Construisez ensemble la première fois
2. Laissez l'enfant prendre les devants ensuite
3. Encouragez la créativité libre
4. Créez un espace de jeu dédié
5. Organisez des challenges créatifs en famille

**Rangement:** Utilisez le sac fourni ou une boîte de rangement compartimentée

---

**"BUILD THE FUTURE, ONE BRICK AT A TIME"** 🧱

Commandez maintenant et offrez des heures de plaisir créatif ! 🎉`,
    
    price: 49.99,
    compareAtPrice: 79.99,
    currency: 'EUR',
    
    sku: 'TOY-{{ theme }}-{{ set_number }}',
    barcode: '{{ generate_barcode }}',
    trackInventory: true,
    inventoryQuantity: 200,
    allowBackorder: false,
    
    weight: 1.2,
    weightUnit: 'kg',
    
    // === VISUELS & MÉDIAS ===
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558877385-8f7d10b6d72e?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Vue principale du jouet monté',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Enfant jouant avec le produit',
        isPrimary: false,
        sortOrder: 2,
      },
      {
        url: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Détails des pièces et accessoires',
        isPrimary: false,
        sortOrder: 3,
      },
    ],
    
    videoUrl: 'https://www.youtube.com/watch?v=build-and-play-demo',
    video360Url: '',
    arEnabled: true,
    
    // === COULEURS & DESIGN ===
    colors: {
      primary: '#FFD700',      // LEGO Yellow
      secondary: '#E3000B',    // LEGO Red
      accent: '#0055BF',       // LEGO Blue
      background: '#FFFFFF',
      text: '#231F20',
      success: '#00A550',      // LEGO Green
      warning: '#FFA500',
      error: '#E3000B',
    },
    
    typography: {
      fontFamily: 'Futura, Comic Sans MS, cursive, sans-serif',
      headingFont: 'Futura, sans-serif',
      bodyFont: 'Helvetica, Arial, sans-serif',
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
      metaTitle: '{{ product_name }} - Jouet Éducatif {{ age_range }} | Payhuk Toys',
      metaDescription: 'Achetez {{ product_name }} pour {{ age_range }}. {{ pieces_count }} pièces, certifié CE, développe créativité et logique. Livraison rapide.',
      keywords: [
        'jouets',
        'toys',
        'lego style',
        'construction',
        'educational toys',
        '{{ age_range }}',
        'creative play',
        'building blocks',
      ],
      ogImage: 'https://images.unsplash.com/photo-1558877385-8f7d10b6d72e?w=1200&h=630&fit=crop',
      twitterCard: 'summary_large_image',
    },
    
    // === FAQ ===
    faq: [
      {
        question: 'À partir de quel âge est-ce adapté ?',
        answer: 'Ce jouet est recommandé pour les enfants de {{ age_range }}. Il est conçu pour être sûr et adapté au développement de cette tranche d\'âge.',
      },
      {
        question: 'Est-ce compatible avec les briques LEGO ?',
        answer: 'Oui ! Les pièces sont compatibles avec toutes les briques de construction standards, y compris LEGO et autres marques similaires.',
      },
      {
        question: 'Combien de temps faut-il pour construire ?',
        answer: 'En suivant les instructions, comptez environ {{ build_time }} heures. Cela varie selon l\'âge et l\'expérience de l\'enfant. Le mode créatif libre est illimité !',
      },
      {
        question: 'Les pièces sont-elles sûres pour les enfants ?',
        answer: 'Absolument ! Toutes nos pièces sont certifiées CE, sans BPA, avec peintures non toxiques. Tests de sécurité rigoureux à chaque étape de production.',
      },
      {
        question: 'Que faire s\'il manque des pièces ?',
        answer: 'Contactez-nous avec la photo du contenu et nous vous enverrons gratuitement les pièces manquantes sous 7 jours. Service de remplacement garanti.',
      },
      {
        question: 'Puis-je offrir ce jouet emballé cadeau ?',
        answer: 'Oui ! Emballage cadeau disponible pour +2.99€. Papier cadeau, ruban et carte inclus. Colis livré prêt à offrir sans aucun prix visible.',
      },
    ],
    
    // === CHAMPS PERSONNALISÉS ===
    customFields: [
      {
        key: 'age_range',
        label: 'Âge recommandé',
        value: '6-12 ans',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'pieces_count',
        label: 'Nombre de pièces',
        value: '354',
        type: 'number',
        isPublic: true,
      },
      {
        key: 'build_time',
        label: 'Temps de construction',
        value: '2-3',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'difficulty_level',
        label: 'Niveau de difficulté',
        value: 'Moyen',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'educational_value',
        label: 'Valeur éducative',
        value: 'Logique, Créativité, Motricité fine',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'choking_hazard',
        label: 'Risque étouffement',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'theme',
        label: 'Thème',
        value: 'Space Adventure',
        type: 'text',
        isPublic: true,
      },
    ],
    
    // === SPÉCIFIQUE PRODUIT PHYSIQUE ===
    physical: {
      dimensions: {
        length: 38,
        width: 26,
        height: 18,
        unit: 'cm',
      },
      
      packageDimensions: {
        length: 40,
        width: 30,
        height: 8,
        weight: 1.4,
        unit: 'cm',
      },
      
      shippingClass: 'standard',
      requiresShipping: true,
      isFreeShipping: false,
      shippingPrice: 5.99,
      
      isFragile: false,
      requiresAssembly: true,
      assemblyDifficulty: 'medium',
      assemblyTime: 150,
      
      materials: [
        'ABS plastique premium',
        'Peintures non toxiques',
        'Carton recyclé FSC',
        'Encres végétales',
      ],
      
      colors: ['Multicolore'],
      sizes: ['Standard'],
      
      warranty: {
        duration: 2,
        unit: 'years',
        type: 'manufacturer',
        coverage: 'Défauts de fabrication et pièces manquantes',
      },
      
      countryOfOrigin: 'Danemark',
      manufacturer: 'BrickToys International A/S',
      
      certifications: ['CE', 'EN71', 'ASTM', 'ISO 8124', 'CPSIA'],
      ecoFriendly: true,
      recycable: true,
      
      careInstructions: [
        'Nettoyer avec un chiffon humide et savon doux',
        'Ne pas immerger dans l\'eau',
        'Sécher immédiatement après nettoyage',
        'Ranger dans un endroit sec à l\'abri de la lumière',
        'Éviter les températures extrêmes',
      ],
      
      inventory: {
        trackInventory: true,
        quantity: 200,
        lowStockThreshold: 40,
        allowBackorder: false,
        backorderMessage: '',
        maxOrderQuantity: 5,
      },
      
      preOrder: {
        isPreOrder: false,
        releaseDate: '',
        preOrderMessage: '',
      },
      
      variants: [
        {
          id: 'var-standard',
          name: 'Set Standard - 354 pièces',
          sku: 'TOY-SPACE-354',
          price: 49.99,
          compareAtPrice: 79.99,
          color: 'Multicolore',
          size: 'Standard',
          inventory: 120,
          image: 'https://images.unsplash.com/photo-1558877385-8f7d10b6d72e?w=800&h=600',
        },
        {
          id: 'var-deluxe',
          name: 'Set Deluxe - 600 pièces',
          sku: 'TOY-SPACE-600',
          price: 79.99,
          compareAtPrice: 129.99,
          color: 'Multicolore',
          size: 'Deluxe',
          inventory: 60,
          image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&h=600',
        },
        {
          id: 'var-mega',
          name: 'Set Mega - 1000+ pièces',
          sku: 'TOY-SPACE-1000',
          price: 129.99,
          compareAtPrice: 199.99,
          color: 'Multicolore',
          size: 'Mega',
          inventory: 20,
          image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800&h=600',
        },
      ],
    },
  },
};

export default toysGamesTemplate;

