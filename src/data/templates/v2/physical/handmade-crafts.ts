import { Template } from '@/types/templates-v2';

/**
 * PHYSICAL TEMPLATE #11: HANDMADE CRAFTS
 * Inspired by: Etsy
 * Design: Artisan, creative, authentic
 * Perfect for: Handmade items, crafts, art, personalized gifts
 * Tier: Free
 */
export const handmadeCraftsTemplate: Template = {
  id: 'physical-handmade-crafts-etsy',
  name: 'Handmade Crafts & Art',
  description: 'Template professionnel pour créations artisanales - Style Etsy authentique et créatif',
  category: 'physical',
  subCategory: 'handmade',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    authorUrl: 'https://payhuk.com/templates',
    tags: [
      'handmade', 'crafts', 'art', 'artisan', 'creative',
      'personalized', 'unique', 'custom', 'etsy', 'maker',
      'gifts', 'authentic', 'handcrafted', 'bespoke'
    ],
    difficulty: 'beginner',
    estimatedSetupTime: 4,
    requiredFields: ['name', 'price', 'images', 'materials'],
    optionalFields: ['customization', 'made_to_order', 'artist_story'],
    isPopular: true,
    isFeatured: true,
    usageCount: 4183,
    rating: 4.9,
    reviewCount: 678,
    lastUpdated: '2025-01-15',
    tier: 'free',
    designStyle: 'artisan',
    industry: 'crafts-art',
    language: 'fr',
    previewImages: [
      'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1280&h=720',
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1280&h=720',
    ],
  },

  data: {
    // === INFORMATIONS DE BASE ===
    productName: '{{ product_name }}',
    slug: '{{ product_name | slugify }}',
    shortDescription: 'Création artisanale unique, fait main avec amour et attention aux détails. Pièce originale de l\'artiste.',
    longDescription: `# ✨ Une Création Unique Fait Main

## {{ product_name }} - L'Art de la Fabrication Artisanale

Chaque pièce est **faite à la main avec amour** dans notre atelier, créant une œuvre unique qui raconte une histoire. Pas de production de masse, juste de l'artisanat authentique.

## 🎨 L'Histoire de Cette Création

{{ artist_story }}

Cette pièce est née d'une passion pour {{ craft_type }} et d'un désir de créer quelque chose de vraiment spécial. Chaque détail a été pensé et travaillé avec soin.

## 💎 Ce Qui Rend Cette Pièce Unique

✨ **100% Fait Main** - Chaque pièce est unique avec ses propres nuances  
🎨 **Matériaux Premium** - Sélectionnés avec soin pour leur qualité  
❤️ **Fait avec Amour** - Des heures de travail minutieux  
🌿 **Éco-Responsable** - Matériaux durables et processus respectueux  
🎁 **Emballage Cadeau** - Présenté dans un joli packaging (offert)  

## 🔍 Détails du Produit

### Matériaux Utilisés
__for__ material in materials
- **{{ material.name }}**: {{ material.description }}
__endfor__

### Dimensions
- **Largeur**: {{ width }}cm
- **Hauteur**: {{ height }}cm
- **Profondeur**: {{ depth }}cm
- **Poids**: {{ weight }}g

### Caractéristiques
- **Style**: {{ style }}
- **Couleurs**: {{ colors }}
- **Finition**: {{ finish }}
- **Technique**: {{ craft_technique }}

## 🎨 Processus de Création

1. **Design** - Esquisse et conception du concept unique
2. **Sélection** - Choix minutieux des matériaux premium
3. **Fabrication** - Plusieurs heures de travail artisanal
4. **Finitions** - Attention aux moindres détails
5. **Contrôle qualité** - Vérification minutieuse
6. **Emballage** - Préparé avec soin pour l'expédition

**Temps de création**: {{ creation_time }} heures par pièce

## 🎁 Personnalisation Disponible

Vous souhaitez rendre cette pièce encore plus spéciale ?

__if__ {{ customization_available }}
**Options de personnalisation:**
__for__ option in customization_options
- {{ option.name }}: {{ option.description }} ({{ option.price_extra }}€)
__endfor__

**Comment commander une version personnalisée:**
1. Ajoutez le produit au panier
2. Précisez vos souhaits dans les notes de commande
3. Je vous contacte sous 24h pour confirmer les détails
4. Création de votre pièce unique

**Délai supplémentaire**: {{ customization_delay }} jours
__endif__

## 📦 Emballage & Expédition

### Emballage Cadeau Inclus
Chaque création est soigneusement emballée dans :
- 🎀 Papier de soie délicat
- 📦 Boîte kraft recyclée
- 💌 Carte de remerciement manuscrite
- ♻️ Matériaux 100% recyclables

Parfait pour offrir directement !

### Expédition Sécurisée
- 📮 Envoi sous {{ shipping_delay }} jours ouvrés
- 📦 Emballage renforcé pour protéger votre pièce
- 📍 Suivi de colis inclus
- 🌍 Livraison France & International
- 💚 Compensé carbone

## 🌱 Engagement Éco-Responsable

En tant qu'artisan, je m'engage pour une création durable :
- ♻️ Matériaux recyclés ou recyclables quand possible
- 🌿 Fournisseurs locaux privilégiés
- 🌍 Emballage écologique sans plastique
- 💚 Processus à faible empreinte carbone
- 🌳 1 arbre planté pour 10 ventes

## 👤 À Propos de l'Artisan

{{ artist_bio }}

**Mon Atelier:**
Situé à {{ workshop_location }}, mon atelier est un espace de création où chaque pièce est fabriquée avec passion et expertise. J'ai appris mon métier {{ years_experience }} ans et je continue d'explorer de nouvelles techniques.

**Ma Philosophie:**
"{{ artist_quote }}"

## ⭐ Ce Que Disent Mes Clients

> "Absolument magnifique ! Le travail est d'une qualité exceptionnelle. On sent le soin apporté à chaque détail." - **Marie L.** ⭐⭐⭐⭐⭐

> "Bien plus beau en vrai que sur les photos ! Emballage adorable. Je recommande à 100%." - **Thomas D.** ⭐⭐⭐⭐⭐

> "Cadeau parfait ! Ma femme a adoré. L'artisan a même ajouté une petite attention. Merci !" - **Pierre M.** ⭐⭐⭐⭐⭐

## 💝 Idées Cadeaux

Cette création est parfaite pour :
- 🎂 Anniversaires
- 💍 Mariages et anniversaires de mariage
- 🏠 Pendaison de crémaillère
- 👶 Naissance
- 🎄 Fêtes de fin d'année
- 💝 Saint-Valentin
- 🌸 Fête des Mères/Pères
- ✨ Ou simplement pour se faire plaisir !

## 🛡️ Garantie & SAV

- **Garantie**: Satisfait ou remboursé 14 jours
- **SAV**: Contact direct avec l'artisan
- **Réparation**: Possible selon l'usure (devis sur demande)
- **Retouches**: Ajustements mineurs offerts sous 30 jours

## 📞 Contact Direct

Des questions sur cette pièce ? Besoin d'une personnalisation ?  
**Contactez-moi directement** - je réponds sous 24h !

- 📧 Email: {{ artist_email }}
- 💬 Message privé via la boutique
- 📱 Instagram: @{{ artist_instagram }}

---

**Note**: Chaque pièce étant faite main, de légères variations peuvent exister, faisant de votre achat une création véritablement unique !`,
    
    price: 45.00,
    compareAtPrice: 75.00,
    currency: 'EUR',
    
    sku: 'HM-{{ artist_initials }}-{{ item_number }}',
    barcode: '',
    trackInventory: true,
    inventoryQuantity: 5,
    allowBackorder: true,
    
    weight: 0.3,
    weightUnit: 'kg',
    
    // === VISUELS & MÉDIAS ===
    images: [
      {
        url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Vue principale de la création',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Détails et finitions',
        isPrimary: false,
        sortOrder: 2,
      },
      {
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Vue d\'ambiance',
        isPrimary: false,
        sortOrder: 3,
      },
      {
        url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Processus de création',
        isPrimary: false,
        sortOrder: 4,
      },
    ],
    
    videoUrl: 'https://www.youtube.com/watch?v=creation-process',
    video360Url: '',
    arEnabled: false,
    
    // === COULEURS & DESIGN ===
    colors: {
      primary: '#F56400',      // Etsy Orange
      secondary: '#2E2E2E',    // Dark grey
      accent: '#8B4513',       // Craft brown
      background: '#FFF8F0',   // Warm cream
      text: '#2E2E2E',
      success: '#A2845E',
      warning: '#E9A03F',
      error: '#D64045',
    },
    
    typography: {
      fontFamily: 'Libre Baskerville, Georgia, serif',
      headingFont: 'Libre Baskerville, serif',
      bodyFont: 'Open Sans, sans-serif',
      fontSize: {
        base: '16px',
        heading: '32px',
        small: '14px',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 700,
      },
    },
    
    // === SEO & META ===
    seo: {
      metaTitle: '{{ product_name }} - Création Artisanale Fait Main | Payhuk',
      metaDescription: 'Découvrez {{ product_name }}, création artisanale unique fait main. Matériaux premium, personnalisation possible, emballage cadeau offert.',
      keywords: [
        'handmade',
        'fait main',
        'artisanat',
        'etsy style',
        'creation unique',
        'cadeau personnalisé',
        'art',
        'craft',
      ],
      ogImage: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1200&h=630&fit=crop',
      twitterCard: 'summary_large_image',
    },
    
    // === FAQ ===
    faq: [
      {
        question: 'Chaque pièce est-elle vraiment unique ?',
        answer: 'Oui ! Étant faites à la main, chaque création a ses propres nuances et caractéristiques. Vous recevez une pièce véritablement unique, pas une copie en série.',
      },
      {
        question: 'Puis-je personnaliser cette création ?',
        answer: 'Absolument ! La plupart de mes créations peuvent être personnalisées. Contactez-moi avec vos souhaits et je vous ferai un devis sous 24h.',
      },
      {
        question: 'Combien de temps faut-il pour créer une pièce ?',
        answer: 'Chaque création demande {{ creation_time }} heures de travail. Si la pièce est en stock, expédition sous {{ shipping_delay }} jours. Sur commande, comptez {{ made_to_order_delay }} jours.',
      },
      {
        question: 'L\'emballage cadeau est-il inclus ?',
        answer: 'Oui ! Chaque commande est emballée avec soin dans un joli packaging écologique, prêt à offrir. Carte de remerciement manuscrite incluse.',
      },
      {
        question: 'Livrez-vous à l\'international ?',
        answer: 'Oui ! J\'expédie en France et dans le monde entier. Frais de port calculés au checkout. Tous les colis sont suivis et assurés.',
      },
      {
        question: 'Que faire si la pièce arrive endommagée ?',
        answer: 'Contactez-moi immédiatement avec des photos. Je vous envoie un remplacement en priorité ou vous rembourse intégralement. Votre satisfaction est ma priorité.',
      },
    ],
    
    // === CHAMPS PERSONNALISÉS ===
    customFields: [
      {
        key: 'craft_type',
        label: 'Type d\'artisanat',
        value: 'Céramique',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'craft_technique',
        label: 'Technique utilisée',
        value: 'Tournage et modelage main',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'creation_time',
        label: 'Temps de création',
        value: '4-6',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'made_to_order',
        label: 'Fabrication sur commande',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'customization_available',
        label: 'Personnalisation disponible',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'artist_name',
        label: 'Nom de l\'artisan',
        value: '{{ artist_full_name }}',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'workshop_location',
        label: 'Localisation atelier',
        value: 'Lyon, France',
        type: 'text',
        isPublic: true,
      },
    ],
    
    // === SPÉCIFIQUE PRODUIT PHYSIQUE ===
    physical: {
      dimensions: {
        length: 15,
        width: 15,
        height: 20,
        unit: 'cm',
      },
      
      packageDimensions: {
        length: 20,
        width: 20,
        height: 25,
        weight: 0.5,
        unit: 'cm',
      },
      
      shippingClass: 'small-parcel',
      requiresShipping: true,
      isFreeShipping: false,
      shippingPrice: 6.90,
      
      isFragile: true,
      requiresAssembly: false,
      assemblyDifficulty: 'none',
      assemblyTime: 0,
      
      materials: [
        'Céramique artisanale',
        'Émail écologique',
        'Argile naturelle',
        'Finition mate ou brillante',
      ],
      
      colors: ['Blanc cassé', 'Terre cuite', 'Bleu nuit', 'Vert sauge'],
      sizes: ['Unique'],
      
      warranty: {
        duration: 14,
        unit: 'days',
        type: 'satisfaction',
        coverage: 'Satisfait ou remboursé',
      },
      
      countryOfOrigin: 'France',
      manufacturer: 'Atelier {{ artist_name }}',
      
      certifications: ['Fait Main France', 'Entreprise du Patrimoine Vivant'],
      ecoFriendly: true,
      recycable: true,
      
      careInstructions: [
        'Nettoyer à la main avec de l\'eau tiède et savon doux',
        'Éviter le lave-vaisselle pour préserver la finition',
        'Ne pas exposer à des chocs thermiques brutaux',
        'Manipulation délicate recommandée',
        'Peut développer une patine naturelle avec le temps (normal)',
      ],
      
      inventory: {
        trackInventory: true,
        quantity: 5,
        lowStockThreshold: 2,
        allowBackorder: true,
        backorderMessage: 'Création sur commande - Délai {{ made_to_order_delay }} jours',
        maxOrderQuantity: 3,
      },
      
      preOrder: {
        isPreOrder: false,
        releaseDate: '',
        preOrderMessage: '',
      },
      
      variants: [
        {
          id: 'var-white',
          name: 'Blanc cassé - Mate',
          sku: 'HM-CERAMIC-WHITE',
          price: 45.00,
          compareAtPrice: 75.00,
          color: 'Blanc cassé',
          size: 'Unique',
          inventory: 2,
          image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&h=600',
        },
        {
          id: 'var-terracotta',
          name: 'Terre cuite - Naturel',
          sku: 'HM-CERAMIC-TERRA',
          price: 45.00,
          compareAtPrice: 75.00,
          color: 'Terre cuite',
          size: 'Unique',
          inventory: 1,
          image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&h=600',
        },
        {
          id: 'var-blue',
          name: 'Bleu nuit - Brillant',
          sku: 'HM-CERAMIC-BLUE',
          price: 48.00,
          compareAtPrice: 78.00,
          color: 'Bleu nuit',
          size: 'Unique',
          inventory: 2,
          image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&h=600',
        },
      ],
    },
  },
};

export default handmadeCraftsTemplate;

