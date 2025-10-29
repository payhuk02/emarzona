/**
 * Templates Pré-configurés - Services
 * 5 templates professionnels pour services
 */

import { Template } from '@/types/templates';

export const SERVICE_TEMPLATES: Template[] = [
  // 1. CONSULTING / COACHING
  {
    metadata: {
      id: 'service-consulting-001',
      name: 'Séance de Coaching',
      description: 'Template pour coaching individuel ou collectif avec réservation en ligne',
      category: 'consulting',
      productType: 'service',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/service/consulting-thumb.jpg',
      preview_images: [],
      tags: ['coaching', 'consulting', 'conseil', 'formation'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: 'Séance de Coaching - [Domaine]',
        description_template: `# Séance de Coaching Professionnel

## Déroulement de la séance

- Durée : 1 heure
- Format : Visioconférence ou présentiel
- Support : Workbook personnalisé
- Suivi : 7 jours par email

## Ce que vous recevrez

✅ Analyse personnalisée de votre situation
✅ Plan d'action concret
✅ Outils et ressources
✅ Suivi post-séance

## Pour qui ?

- [Public cible 1]
- [Public cible 2]
- [Public cible 3]`,
        short_description_template: 'Séance de coaching [domaine] - 1h en visio ou présentiel - Plan d\'action personnalisé',
        category: 'Coaching & Consulting',
        pricing_model: 'one_time',
        price: 25000,
        currency: 'XOF',
        features: [
          'Séance 1h personnalisée',
          'Plan d\'action concret',
          'Support de formation',
          'Suivi 7 jours',
        ],
      },
      service: {
        duration: 60,
        duration_unit: 'minutes',
        booking_type: 'appointment',
        max_attendees: 1,
        location_type: 'both',
        cancellation_policy: 'Annulation gratuite jusqu\'à 24h avant la séance',
      },
      affiliate: {
        enabled: true,
        commission_rate: 20,
        commission_type: 'percentage',
      },
    },
  },

  // 2. RÉPARATION / MAINTENANCE
  {
    metadata: {
      id: 'service-repair-001',
      name: 'Service de Réparation',
      description: 'Template pour services de réparation avec devis et garantie',
      category: 'repair',
      productType: 'service',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/service/repair-thumb.jpg',
      preview_images: [],
      tags: ['réparation', 'maintenance', 'technique', 'intervention'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: 'Réparation [Type d\'appareil]',
        description_template: `# Service de Réparation Professionnel

## Prestations

- Diagnostic gratuit
- Devis détaillé
- Réparation par technicien certifié
- Garantie 3 mois

## Inclus dans le service

✅ Déplacement (zone urbaine)
✅ Diagnostic complet
✅ Main d'œuvre
✅ Nettoyage de l'appareil
✅ Garantie pièces et main d'œuvre

## Délais

- Intervention sous 48h
- Réparation en 2-5 jours
- Pièces d'origine ou équivalent`,
        short_description_template: 'Réparation [appareil] par technicien certifié - Diagnostic gratuit - Garantie 3 mois',
        category: 'Réparation & Maintenance',
        pricing_model: 'one_time',
        price: 15000,
        currency: 'XOF',
      },
      service: {
        duration: 2,
        duration_unit: 'hours',
        booking_type: 'appointment',
        max_attendees: 1,
        location_type: 'physical',
        cancellation_policy: 'Frais d\'annulation 5000 FCFA si annulation < 24h',
      },
    },
  },

  // 3. ÉVÉNEMENTIEL
  {
    metadata: {
      id: 'service-event-001',
      name: 'Organisation Événement',
      description: 'Template pour organisation d\'événements avec packages personnalisés',
      category: 'event',
      productType: 'service',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/service/event-thumb.jpg',
      preview_images: [],
      tags: ['événement', 'mariage', 'fête', 'organisation'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: 'Organisation [Type d\'événement]',
        description_template: `# Organisation d'Événement Professionnel

## Nos services

- Planification complète
- Coordination le jour J
- Gestion des prestataires
- Décoration personnalisée

## Formules

### Formule Essentielle
- Planification pré-événement
- Coordination jour J (6h)
- 1 responsable événement

### Formule Premium
- Planification complète
- Coordination jour J (12h)
- 2 responsables + assistants
- Décoration incluse`,
        category: 'Événementiel',
        pricing_model: 'one_time',
        price: 150000,
        currency: 'XOF',
      },
      service: {
        duration: 1,
        duration_unit: 'days',
        booking_type: 'flexible',
        max_attendees: 100,
        location_type: 'physical',
      },
    },
  },

  // 4. BIEN-ÊTRE / SPA
  {
    metadata: {
      id: 'service-wellness-001',
      name: 'Soin Bien-être',
      description: 'Template pour soins spa, massage, beauté',
      category: 'wellness',
      productType: 'service',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/service/wellness-thumb.jpg',
      preview_images: [],
      tags: ['spa', 'massage', 'bien-être', 'relaxation'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: '[Type de soin] - [Durée]',
        description_template: `# Soin Bien-être & Relaxation

## Le soin

Un moment de pure détente pour votre corps et votre esprit.

## Déroulement

1. Accueil et consultation
2. Préparation (douche, vestiaire)
3. Soin personnalisé
4. Temps de relaxation
5. Boisson détox offerte

## Bienfaits

✨ Relaxation profonde
✨ Détente musculaire
✨ Amélioration circulation
✨ Bien-être mental`,
        category: 'Bien-être & Spa',
        pricing_model: 'one_time',
        price: 20000,
        currency: 'XOF',
      },
      service: {
        duration: 60,
        duration_unit: 'minutes',
        booking_type: 'appointment',
        max_attendees: 1,
        location_type: 'physical',
      },
    },
  },

  // 5. FORMATION / WORKSHOP
  {
    metadata: {
      id: 'service-training-001',
      name: 'Workshop Formation',
      description: 'Template pour ateliers et formations en groupe',
      category: 'training',
      productType: 'service',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/service/training-thumb.jpg',
      preview_images: [],
      tags: ['formation', 'workshop', 'atelier', 'apprentissage'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: 'Workshop - [Sujet]',
        description_template: `# Workshop Pratique

## Programme

### Matin (9h-12h30)
- Partie théorique
- Exemples concrets
- Pause-café

### Après-midi (14h-17h)
- Pratique guidée
- Projet personnel
- Questions/Réponses

## Ce que vous repartez avec

✅ Support de formation PDF
✅ Fichiers pratiques
✅ Certificat de participation
✅ Accès groupe privé`,
        category: 'Formation',
        pricing_model: 'one_time',
        price: 35000,
        currency: 'XOF',
      },
      service: {
        duration: 8,
        duration_unit: 'hours',
        booking_type: 'appointment',
        max_attendees: 15,
        location_type: 'both',
      },
    },
  },
];

