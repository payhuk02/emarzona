/**
 * Templates Pré-configurés - Produits Digitaux
 * 10 templates professionnels pour produits digitaux
 */

import { Template } from '@/types/templates';

export const DIGITAL_TEMPLATES: Template[] = [
  // 1. E-BOOK / PDF
  {
    metadata: {
      id: 'digital-ebook-001',
      name: 'E-book Professionnel',
      description: 'Template complet pour vendre des e-books, guides PDF, ou livres numériques',
      category: 'ebook',
      productType: 'digital',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/digital/ebook-thumb.jpg',
      preview_images: [
        '/templates/digital/ebook-preview-1.jpg',
        '/templates/digital/ebook-preview-2.jpg',
      ],
      tags: ['ebook', 'pdf', 'livre', 'guide', 'formation'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: 'Guide Complet : [Votre Sujet]',
        description_template: `# Description de votre E-book

## À propos de ce livre numérique

Ce guide complet vous accompagne pas à pas pour maîtriser [votre sujet].

## Ce que vous allez apprendre

- Point clé 1
- Point clé 2
- Point clé 3

## Format et accès

- Format PDF haute qualité
- Téléchargement immédiat
- Accès illimité
- Compatible tous appareils`,
        short_description_template: 'Guide complet pour maîtriser [votre sujet] - Format PDF - Téléchargement immédiat',
        category: 'Formation',
        pricing_model: 'one_time',
        price: 5000,
        currency: 'XOF',
        features: [
          'Format PDF haute qualité',
          'Téléchargement immédiat après achat',
          'Accès illimité à vie',
          'Compatible PC, tablette, smartphone',
          'Mises à jour gratuites',
        ],
        specifications: [
          { label: 'Format', value: 'PDF' },
          { label: 'Pages', value: '150-200' },
          { label: 'Langue', value: 'Français' },
          { label: 'Taille fichier', value: '~10 MB' },
        ],
      },
      visuals: {
        image_placeholders: [
          'Couverture de votre e-book',
          'Aperçu d\'une page',
          'Table des matières',
        ],
        gallery_placeholders: [
          'Page exemple 1',
          'Page exemple 2',
          'Page exemple 3',
        ],
      },
      seo: {
        meta_title_template: 'E-book [Sujet] - Guide Complet en PDF',
        meta_description_template: 'Téléchargez notre guide complet sur [sujet]. Format PDF, accès immédiat, compatible tous appareils. Prix: [prix] FCFA',
        meta_keywords: ['ebook', 'pdf', 'guide', 'formation', 'téléchargement'],
        og_settings: {
          title: 'E-book [Sujet] - Guide Professionnel',
          description: 'Guide complet en PDF - Téléchargement immédiat',
        },
      },
      faqs: [
        {
          question: 'Quel format est utilisé ?',
          answer: 'L\'e-book est au format PDF, compatible avec tous les appareils (PC, Mac, tablettes, smartphones).',
        },
        {
          question: 'Quand puis-je accéder à mon e-book ?',
          answer: 'Vous recevrez un lien de téléchargement immédiatement après le paiement. L\'accès est illimité.',
        },
        {
          question: 'Puis-je imprimer le PDF ?',
          answer: 'Oui, vous pouvez imprimer le PDF pour votre usage personnel.',
        },
        {
          question: 'Y a-t-il des mises à jour ?',
          answer: 'Oui, toutes les mises à jour sont gratuites et vous serez notifié par email.',
        },
      ],
      digital: {
        file_types: ['pdf'],
        license_type: 'single',
        download_limit: null, // Illimité
        drm_enabled: false,
      },
      affiliate: {
        enabled: true,
        commission_rate: 30,
        commission_type: 'percentage',
      },
      tracking: {
        pixels_enabled: true,
        analytics_enabled: true,
        events: ['view_item', 'add_to_cart', 'purchase', 'download'],
      },
    },
  },

  // 2. LOGICIEL / APPLICATION
  {
    metadata: {
      id: 'digital-software-001',
      name: 'Logiciel / Application',
      description: 'Template pour logiciels, applications desktop ou plugins',
      category: 'software',
      productType: 'digital',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/digital/software-thumb.jpg',
      preview_images: [],
      tags: ['logiciel', 'application', 'software', 'programme'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: '[Nom du Logiciel] - Version Pro',
        description_template: `# Logiciel Professionnel

## Fonctionnalités principales

- Fonctionnalité 1
- Fonctionnalité 2
- Fonctionnalité 3

## Configuration requise

- Système d'exploitation : Windows 10/11, macOS 10.15+
- Processeur : Intel Core i3 ou équivalent
- RAM : 4 GB minimum
- Espace disque : 500 MB

## Licence et support

- Licence à vie
- Mises à jour gratuites pendant 1 an
- Support technique par email`,
        short_description_template: 'Logiciel professionnel [fonction] - Licence à vie - Support inclus',
        category: 'Logiciels',
        pricing_model: 'one_time',
        price: 25000,
        currency: 'XOF',
        features: [
          'Licence à vie',
          'Installation sur 2 appareils',
          'Mises à jour gratuites (1 an)',
          'Support technique par email',
          'Documentation complète',
        ],
        specifications: [
          { label: 'Version', value: '2.0.1' },
          { label: 'Plateformes', value: 'Windows, macOS' },
          { label: 'Langue', value: 'Français, Anglais' },
          { label: 'Taille', value: '250 MB' },
        ],
      },
      seo: {
        meta_title_template: '[Logiciel] - Version Pro | Licence à Vie',
        meta_description_template: 'Téléchargez [logiciel], solution professionnelle pour [fonction]. Licence à vie, support inclus. Prix: [prix] FCFA',
        meta_keywords: ['logiciel', 'software', 'application', 'pro', 'licence'],
      },
      faqs: [
        {
          question: 'Sur combien d\'appareils puis-je installer le logiciel ?',
          answer: 'La licence permet l\'installation sur 2 appareils simultanément.',
        },
        {
          question: 'Les mises à jour sont-elles gratuites ?',
          answer: 'Oui, toutes les mises à jour sont gratuites pendant 1 an, puis 30% de réduction sur le renouvellement.',
        },
        {
          question: 'Y a-t-il un support technique ?',
          answer: 'Oui, support par email sous 24h en français et anglais.',
        },
      ],
      digital: {
        file_types: ['exe', 'dmg', 'zip'],
        license_type: 'multi', // 2 appareils
        download_limit: null,
        drm_enabled: true,
      },
      affiliate: {
        enabled: true,
        commission_rate: 25,
        commission_type: 'percentage',
      },
    },
  },

  // 3. MUSIQUE / AUDIO
  {
    metadata: {
      id: 'digital-music-001',
      name: 'Pack Audio / Musique',
      description: 'Template pour vendre de la musique, beats, samples ou effets sonores',
      category: 'music',
      productType: 'digital',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/digital/music-thumb.jpg',
      preview_images: [],
      tags: ['musique', 'audio', 'beat', 'sample', 'son'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: 'Pack Audio : [Nom du Pack]',
        description_template: `# Pack Audio Professionnel

## Contenu du pack

- [X] pistes audio haute qualité
- Format WAV + MP3
- BPM : [tempo]
- Durée totale : [minutes]

## Licence d'utilisation

✅ Usage commercial autorisé
✅ Projets YouTube, podcasts
✅ Films et vidéos
✅ Jeux vidéo

❌ Revente du pack interdit
❌ Distribution gratuite interdite

## Formats inclus

- WAV (24-bit, 48kHz)
- MP3 (320kbps)
- Stems séparés (option)`,
        short_description_template: 'Pack de [X] pistes audio professionnelles - Usage commercial autorisé - Formats WAV + MP3',
        category: 'Audio & Musique',
        pricing_model: 'one_time',
        price: 10000,
        currency: 'XOF',
        features: [
          'Fichiers audio haute qualité',
          'Licence commerciale incluse',
          'Formats multiples (WAV, MP3)',
          'Téléchargement immédiat',
          'Utilisation illimitée',
        ],
        specifications: [
          { label: 'Nombre de pistes', value: '10' },
          { label: 'Format', value: 'WAV + MP3' },
          { label: 'Qualité', value: '24-bit, 48kHz' },
          { label: 'Taille totale', value: '~500 MB' },
        ],
      },
      seo: {
        meta_title_template: '[Pack Audio] - Licence Commerciale | Haute Qualité',
        meta_description_template: 'Pack de [X] pistes audio professionnelles. Licence commerciale, formats WAV + MP3. Usage YouTube, podcasts, vidéos. Prix: [prix] FCFA',
        meta_keywords: ['audio', 'musique', 'beat', 'sample', 'commercial', 'wav'],
      },
      faqs: [
        {
          question: 'Puis-je utiliser ces pistes pour YouTube ?',
          answer: 'Oui, la licence commerciale vous permet d\'utiliser ces pistes pour YouTube, podcasts, et toute création de contenu.',
        },
        {
          question: 'Quels formats sont inclus ?',
          answer: 'Vous recevez les fichiers en WAV (24-bit, 48kHz) et MP3 (320kbps) pour une compatibilité maximale.',
        },
        {
          question: 'Puis-je revendre ces pistes ?',
          answer: 'Non, la revente directe des fichiers audio est interdite. Vous pouvez les utiliser dans vos créations originales.',
        },
      ],
      digital: {
        file_types: ['wav', 'mp3', 'zip'],
        license_type: 'single',
        download_limit: null,
        drm_enabled: false,
      },
      affiliate: {
        enabled: true,
        commission_rate: 35,
        commission_type: 'percentage',
      },
    },
  },

  // 4. DESIGN / TEMPLATES
  {
    metadata: {
      id: 'digital-design-001',
      name: 'Templates Design',
      description: 'Template pour vendre des templates graphiques, mockups, ou designs',
      category: 'design',
      productType: 'digital',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/digital/design-thumb.jpg',
      preview_images: [],
      tags: ['design', 'template', 'graphique', 'mockup', 'psd'],
      premium: true,
      price: 2000,
    },
    data: {
      basicInfo: {
        name_template: 'Pack Templates : [Type de Design]',
        description_template: `# Pack Templates Professionnels

## Ce que vous recevez

- [X] templates haute qualité
- Fichiers sources modifiables
- Polices incluses
- Guide d'utilisation

## Formats disponibles

✅ Adobe Photoshop (.PSD)
✅ Adobe Illustrator (.AI)
✅ Figma (lien)
✅ PNG haute résolution

## Licence étendue

- Usage personnel et commercial
- Projets clients illimités
- Modifications autorisées
- Pas de crédits requis`,
        short_description_template: 'Pack de [X] templates professionnels - Fichiers sources PSD, AI, Figma - Licence commerciale',
        category: 'Design & Graphisme',
        pricing_model: 'one_time',
        price: 15000,
        currency: 'XOF',
        features: [
          'Fichiers sources modifiables',
          'Licence commerciale étendue',
          'Formats multiples (PSD, AI, Figma)',
          'Polices incluses',
          'Documentation complète',
        ],
      },
      seo: {
        meta_title_template: '[Templates Design] - Fichiers Sources PSD, AI, Figma',
        meta_description_template: 'Pack professionnel de [X] templates design. Fichiers sources, licence commerciale, formats multiples. Prix: [prix] FCFA',
        meta_keywords: ['template', 'design', 'psd', 'illustrator', 'figma', 'commercial'],
      },
      digital: {
        file_types: ['psd', 'ai', 'fig', 'png', 'zip'],
        license_type: 'single',
        download_limit: null,
        drm_enabled: false,
      },
      affiliate: {
        enabled: true,
        commission_rate: 40,
        commission_type: 'percentage',
      },
    },
  },

  // 5. PHOTOS / IMAGES
  {
    metadata: {
      id: 'digital-photo-001',
      name: 'Pack Photos HD',
      description: 'Template pour vendre des photos stock, images haute résolution',
      category: 'photo',
      productType: 'digital',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/digital/photo-thumb.jpg',
      preview_images: [],
      tags: ['photo', 'image', 'stock', 'hd', 'commercial'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: 'Pack Photos : [Thème]',
        description_template: `# Collection Photos Professionnelles

## Contenu du pack

- [X] photos haute résolution
- Résolution : 6000 x 4000 px minimum
- Format RAW + JPEG
- Retouches professionnelles

## Licence commerciale

✅ Sites web et blogs
✅ Réseaux sociaux
✅ Publicité et marketing
✅ Impressions (posters, brochures)
✅ Projets clients

## Usage interdit

❌ Revente des photos
❌ Redistribution gratuite`,
        short_description_template: 'Collection de [X] photos HD professionnelles - Licence commerciale - Format RAW + JPEG',
        category: 'Photographie',
        pricing_model: 'one_time',
        price: 8000,
        currency: 'XOF',
        features: [
          'Photos haute résolution (6000x4000px+)',
          'Formats RAW + JPEG',
          'Licence commerciale étendue',
          'Retouches professionnelles',
          'Téléchargement immédiat',
        ],
        specifications: [
          { label: 'Nombre de photos', value: '50' },
          { label: 'Résolution', value: '6000 x 4000 px' },
          { label: 'Format', value: 'RAW + JPEG' },
          { label: 'Taille totale', value: '~2 GB' },
        ],
      },
      seo: {
        meta_title_template: '[Pack Photos] - Haute Résolution | Licence Commerciale',
        meta_description_template: 'Collection de [X] photos HD professionnelles sur [thème]. Licence commerciale, formats RAW + JPEG. Prix: [prix] FCFA',
        meta_keywords: ['photo', 'stock', 'hd', 'commercial', 'raw', 'jpeg'],
      },
      faqs: [
        {
          question: 'Quelle est la résolution des photos ?',
          answer: 'Toutes les photos font au minimum 6000 x 4000 pixels, parfait pour l\'impression et le web.',
        },
        {
          question: 'Puis-je utiliser ces photos pour mes clients ?',
          answer: 'Oui, la licence commerciale étendue vous permet d\'utiliser ces photos dans tous vos projets clients.',
        },
      ],
      digital: {
        file_types: ['raw', 'jpg', 'zip'],
        license_type: 'single',
        download_limit: null,
        drm_enabled: false,
      },
      affiliate: {
        enabled: true,
        commission_rate: 30,
        commission_type: 'percentage',
      },
    },
  },
];

