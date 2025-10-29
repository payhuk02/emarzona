import { Template } from '@/types/templates-v2';

/**
 * PHYSICAL TEMPLATE #14: OFFICE SUPPLIES
 * Inspired by: Staples
 * Design: Professional, organized, efficiency-focused
 * Perfect for: Office products, stationery, business supplies
 * Tier: Free
 */
export const officeSuppliesTemplate: Template = {
  id: 'physical-office-supplies-staples',
  name: 'Office Supplies & Stationery',
  description: 'Template professionnel pour fournitures de bureau - Style Staples organisé et efficace',
  category: 'physical',
  subCategory: 'office',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    authorUrl: 'https://payhuk.com/templates',
    tags: [
      'office', 'supplies', 'stationery', 'business', 'professional',
      'staples', 'organized', 'productivity', 'workspace', 'desk',
      'pens', 'paper', 'corporate', 'efficiency'
    ],
    difficulty: 'beginner',
    estimatedSetupTime: 2,
    requiredFields: ['name', 'price', 'quantity', 'images'],
    optionalFields: ['bulk_pricing', 'office_category', 'eco_friendly'],
    isPopular: true,
    isFeatured: false,
    usageCount: 2134,
    rating: 4.7,
    reviewCount: 298,
    lastUpdated: '2025-01-15',
    tier: 'free',
    designStyle: 'professional',
    industry: 'office-business',
    language: 'fr',
    previewImages: [
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1280&h=720',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1280&h=720',
    ],
  },

  data: {
    // === INFORMATIONS DE BASE ===
    productName: '{{ product_name }}',
    slug: '{{ product_name | slugify }}',
    shortDescription: 'Fourniture de bureau professionnelle haute qualité pour augmenter votre productivité.',
    longDescription: `# ✒️ VOTRE BUREAU, VOTRE SUCCÈS

## {{ product_name }} - Excellence Professionnelle

Équipez votre espace de travail avec des fournitures de **qualité professionnelle** qui augmentent votre productivité et organisent votre quotidien.

## 💼 POURQUOI CHOISIR CE PRODUIT ?

✅ **Qualité Premium** - Matériaux durables et fiables  
✅ **Design Professionnel** - Aspect soigné pour votre bureau  
✅ **Grande Durabilité** - Usage intensif professionnel  
✅ **Bon Rapport Qualité-Prix** - Prix compétitif, qualité supérieure  
✅ **Livraison Rapide** - En stock, expédition sous 24h  

## 🏢 IDÉAL POUR

- 💼 **Bureaux d'entreprise** - Équipez vos équipes
- 🏠 **Télétravail** - Home office professionnel
- 🎓 **Étudiants** - Fournitures académiques
- 🏭 **PME/TPE** - Solutions complètes
- 👨‍💼 **Indépendants** - Outils essentiels

## 📋 CARACTÉRISTIQUES DÉTAILLÉES

### Spécifications Techniques
| Caractéristique | Valeur |
|----------------|--------|
| **Dimensions** | {{ length }}×{{ width }}×{{ height }}cm |
| **Poids** | {{ weight }}g |
| **Matériau** | {{ material }} |
| **Couleur** | {{ color }} |
| **Quantité** | {{ quantity_per_pack }} pièces |
| **Usage** | Professionnel intensif |

### Points Forts
- 🖊️ **Ergonomie étudiée** pour confort prolongé
- 📐 **Précision** pour travaux exigeants
- 🔒 **Fiabilité** testée en environnement professionnel
- ♻️ **Éco-responsable** quand possible
- 🎨 **Design moderne** qui valorise votre bureau

## 💰 ÉCONOMIES EN VOLUME

Achetez en gros et économisez !

| Quantité | Prix unitaire | Économie |
|----------|--------------|----------|
| 1-9 unités | {{ price }}€ | - |
| 10-49 unités | {{ price_bulk_10 }}€ | -10% |
| 50-99 unités | {{ price_bulk_50 }}€ | -15% |
| 100+ unités | {{ price_bulk_100 }}€ | -20% |

**Contact commercial:** Pour commandes > 500 unités, contactez notre service B2B pour devis personnalisé.

## 📦 OPTIONS DE LIVRAISON

### Livraison Standard
- 📮 **Gratuite dès 40€** d'achat
- 🚚 **2-3 jours ouvrés** partout en France
- 📍 **Suivi en temps réel** de votre colis

### Livraison Express
- ⚡ **Sous 24h** (+9.99€)
- 🕐 **Commande avant 14h** = expédition jour même
- 🎯 **Garantie ponctualité** ou frais remboursés

### Livraison Professionnelle
- 🏢 **Livraison en entreprise** avec RDV
- 📋 **Facturation dédiée** pour comptabilité
- 🤝 **Compte professionnel** avec avantages

## 🏆 QUALITÉ CERTIFIÉE

Nos produits respectent les standards les plus exigeants :
- ✅ **ISO 9001** - Management de la qualité
- ✅ **CE** - Normes européennes
- ✅ **FSC** - Bois responsable (si applicable)
- ✅ **Blauer Engel** - Éco-label (si applicable)

## ♻️ ENGAGEMENT ÉCOLOGIQUE

Nous prenons notre responsabilité environnementale au sérieux :

__if__ {{ eco_friendly }}
🌱 **Produit éco-responsable:**
- Matériaux recyclés à {{ recycled_percentage }}%
- Emballage 100% recyclable sans plastique
- Production à faibles émissions CO2
- Certification écologique {{ eco_certification }}
__endif__

**Objectif 2025:** 80% de notre gamme éco-responsable

## 👔 SOLUTIONS ENTREPRISES

### Service B2B Dédié
- 🤝 **Account Manager** personnalisé
- 💳 **Paiement à 30/60 jours** pour entreprises
- 📊 **Reporting d'achats** mensuel
- 🎁 **Programme fidélité** avec avantages
- 📞 **Hotline prioritaire** 7j/7

### Services Inclus
- ✅ Devis personnalisé sous 24h
- ✅ Livraison programmée récurrente
- ✅ Gestion de stock externalisée
- ✅ Facturation centralisée
- ✅ Retours simplifiés

## 📞 SUPPORT CLIENT

**Besoin d'aide pour choisir ?**

- 📧 **Email:** support@payhuk.com (réponse < 2h)
- 📞 **Téléphone:** 01 23 45 67 89 (Lun-Ven 9h-18h)
- 💬 **Chat:** En direct sur le site
- 📱 **WhatsApp Business:** +33 6 XX XX XX XX

## ⭐ CE QUE DISENT NOS CLIENTS

> "Qualité au rendez-vous, livraison ultra-rapide. Je commande régulièrement pour mon entreprise." - **Jean-Marc, Directeur Administratif**

> "Rapport qualité-prix imbattable. Les prix dégressifs sont très avantageux pour nous." - **Sophie, Responsable Achats**

> "Service client excellent, toujours à l'écoute. Je recommande vivement !" - **Thomas, Auto-entrepreneur**

## 🛡️ GARANTIE & RETOURS

- **Garantie:** Satisfait ou remboursé 30 jours
- **Défauts:** Remplacement immédiat sous 48h
- **Retours:** Gratuits pour professionnels
- **SAV:** Dédié et réactif

## 🎯 PRODUITS COMPLÉMENTAIRES

Complétez votre commande avec :
- {{ complementary_product_1 }} ({{ price_1 }}€)
- {{ complementary_product_2 }} ({{ price_2 }}€)
- {{ complementary_product_3 }} ({{ price_3 }}€)

**Pack Complet Bureau:** -15% en achetant les 3 !

## 📊 UTILISÉ PAR

Plus de **10,000 entreprises** nous font confiance :
- Startups innovantes
- PME en croissance
- Grandes entreprises
- Administrations publiques
- Écoles et universités

---

**"THAT WAS EASY"** - Commandez en 2 clics ! 🔴

Livraison rapide, qualité garantie, prix compétitifs. Tout ce dont vous avez besoin pour un bureau performant ! 💼`,
    
    price: 9.99,
    compareAtPrice: 14.99,
    currency: 'EUR',
    
    sku: 'OFFICE-{{ category }}-{{ item_code }}',
    barcode: '{{ generate_barcode }}',
    trackInventory: true,
    inventoryQuantity: 500,
    allowBackorder: true,
    
    weight: 0.2,
    weightUnit: 'kg',
    
    // === VISUELS & MÉDIAS ===
    images: [
      {
        url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Vue principale du produit',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Utilisation en environnement professionnel',
        isPrimary: false,
        sortOrder: 2,
      },
      {
        url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Détails et finitions',
        isPrimary: false,
        sortOrder: 3,
      },
    ],
    
    videoUrl: '',
    video360Url: '',
    arEnabled: false,
    
    // === COULEURS & DESIGN ===
    colors: {
      primary: '#CC0000',      // Staples Red
      secondary: '#003DA5',    // Staples Blue
      accent: '#FFB81C',       // Yellow
      background: '#F8F8F8',
      text: '#333333',
      success: '#28A745',
      warning: '#FFC107',
      error: '#DC3545',
    },
    
    typography: {
      fontFamily: 'Arial, Helvetica, sans-serif',
      headingFont: 'Arial, sans-serif',
      bodyFont: 'Arial, sans-serif',
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
    
    // === SEO & META ===
    seo: {
      metaTitle: '{{ product_name }} - Fournitures Bureau Pro | Livraison 24h | Payhuk',
      metaDescription: 'Achetez {{ product_name }} pour votre bureau. Qualité pro, prix compétitifs, livraison rapide. Remises en volume. Commande en ligne facile.',
      keywords: [
        'fournitures bureau',
        'office supplies',
        'staples style',
        'professionnel',
        'stationery',
        'business supplies',
        'bureau entreprise',
        'remise volume',
      ],
      ogImage: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=630&fit=crop',
      twitterCard: 'summary_large_image',
    },
    
    // === FAQ ===
    faq: [
      {
        question: 'Proposez-vous des remises pour les entreprises ?',
        answer: 'Oui ! Remises dégressives dès 10 unités. Pour les grandes quantités (500+), contactez notre service B2B pour un devis personnalisé avec conditions avantageuses.',
      },
      {
        question: 'Puis-je payer en plusieurs fois ?',
        answer: 'Oui. Paiement en 3× sans frais avec Klarna. Pour les entreprises, nous proposons des paiements à 30/60 jours après validation de votre compte professionnel.',
      },
      {
        question: 'Livrez-vous en entreprise ?',
        answer: 'Absolument ! Livraison en entreprise avec prise de rendez-vous possible. Service dédié aux professionnels avec suivi renforcé et facturation adaptée.',
      },
      {
        question: 'Quelle est la garantie ?',
        answer: 'Satisfait ou remboursé 30 jours. Si le produit ne convient pas ou présente un défaut, retour gratuit et remplacement ou remboursement immédiat.',
      },
      {
        question: 'Avez-vous un catalogue complet ?',
        answer: 'Oui ! Plus de 15,000 références disponibles. Téléchargez notre catalogue PDF ou contactez-nous pour un catalogue personnalisé selon vos besoins.',
      },
      {
        question: 'Produit disponible en stock ?',
        answer: 'Oui, {{ inventoryQuantity }} unités en stock. Expédition sous 24h pour toute commande avant 14h. Livraison 2-3 jours ouvrés.',
      },
    ],
    
    // === CHAMPS PERSONNALISÉS ===
    customFields: [
      {
        key: 'office_category',
        label: 'Catégorie bureau',
        value: 'Fournitures écriture',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'quantity_per_pack',
        label: 'Quantité par pack',
        value: '12',
        type: 'number',
        isPublic: true,
      },
      {
        key: 'professional_grade',
        label: 'Qualité professionnelle',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'bulk_pricing_available',
        label: 'Prix dégressifs',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'eco_friendly',
        label: 'Éco-responsable',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'recyclable',
        label: 'Recyclable',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
    ],
    
    // === SPÉCIFIQUE PRODUIT PHYSIQUE ===
    physical: {
      dimensions: {
        length: 15,
        width: 5,
        height: 2,
        unit: 'cm',
      },
      
      packageDimensions: {
        length: 20,
        width: 10,
        height: 5,
        weight: 0.3,
        unit: 'cm',
      },
      
      shippingClass: 'small-light',
      requiresShipping: true,
      isFreeShipping: false,
      shippingPrice: 3.99,
      
      isFragile: false,
      requiresAssembly: false,
      assemblyDifficulty: 'none',
      assemblyTime: 0,
      
      materials: [
        'Plastique ABS',
        'Encre haute qualité',
        'Métal inoxydable',
        'Caoutchouc grip',
      ],
      
      colors: ['Noir', 'Bleu', 'Rouge'],
      sizes: ['Standard'],
      
      warranty: {
        duration: 30,
        unit: 'days',
        type: 'satisfaction',
        coverage: 'Satisfait ou remboursé',
      },
      
      countryOfOrigin: 'Allemagne',
      manufacturer: 'Office Pro International GmbH',
      
      certifications: ['ISO 9001', 'CE', 'FSC', 'Blauer Engel'],
      ecoFriendly: true,
      recycable: true,
      
      careInstructions: [
        'Conserver dans un endroit sec',
        'Éviter l\'exposition directe au soleil',
        'Nettoyer avec un chiffon doux',
        'Ne pas exposer à des températures extrêmes',
      ],
      
      inventory: {
        trackInventory: true,
        quantity: 500,
        lowStockThreshold: 100,
        allowBackorder: true,
        backorderMessage: 'Réapprovisionnement sous 3-5 jours',
        maxOrderQuantity: 100,
      },
      
      preOrder: {
        isPreOrder: false,
        releaseDate: '',
        preOrderMessage: '',
      },
      
      variants: [
        {
          id: 'var-black-12',
          name: 'Noir - Pack de 12',
          sku: 'OFFICE-BLK-12',
          price: 9.99,
          compareAtPrice: 14.99,
          color: 'Noir',
          size: 'Pack 12',
          inventory: 250,
          image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600',
        },
        {
          id: 'var-blue-50',
          name: 'Bleu - Pack de 50',
          sku: 'OFFICE-BLU-50',
          price: 39.99,
          compareAtPrice: 59.99,
          color: 'Bleu',
          size: 'Pack 50',
          inventory: 150,
          image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600',
        },
        {
          id: 'var-assorted-100',
          name: 'Assortis - Pack de 100',
          sku: 'OFFICE-AST-100',
          price: 69.99,
          compareAtPrice: 99.99,
          color: 'Assortis',
          size: 'Pack 100',
          inventory: 100,
          image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600',
        },
      ],
    },
  },
};

export default officeSuppliesTemplate;

