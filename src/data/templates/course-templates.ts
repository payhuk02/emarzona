/**
 * Templates Pré-configurés - Cours en Ligne
 * 5 templates professionnels pour cours en ligne
 */

import { Template } from '@/types/templates';

export const COURSE_TEMPLATES: Template[] = [
  // 1. FORMATION TECHNIQUE
  {
    metadata: {
      id: 'course-technical-001',
      name: 'Formation Technique',
      description: 'Template pour formations techniques avec projets pratiques',
      category: 'technical',
      productType: 'course',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/course/technical-thumb.jpg',
      preview_images: [],
      tags: ['technique', 'programmation', 'développement', 'code'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: 'Formation [Technologie/Compétence]',
        description_template: `# Formation Technique Complète

## À propos de cette formation

Maîtrisez [technologie] de A à Z avec des projets réels et un accompagnement personnalisé.

## Ce que vous apprendrez

- Concept 1
- Concept 2
- Concept 3
- Projet final complet

## Programme détaillé

### Module 1 : Les Bases
- Introduction
- Environnement de développement
- Premier projet

### Module 2 : Concepts Avancés
- Feature 1
- Feature 2
- Best practices

### Module 3 : Projet Réel
- Conception
- Développement
- Déploiement

## Ressources incluses

✅ Code source complet
✅ Exercices pratiques
✅ Projet final
✅ Certificat de réussite`,
        short_description_template: 'Formation complète [technologie] - Projets réels - Certificat inclus - [durée]h de contenu',
        category: 'Développement & Programmation',
        pricing_model: 'one_time',
        price: 50000,
        currency: 'XOF',
        features: [
          '[X]h de vidéos HD',
          '[Y] projets pratiques',
          'Code source téléchargeable',
          'Accès à vie',
          'Certificat de réussite',
        ],
      },
      course: {
        level: 'intermediate',
        language: 'fr',
        duration_hours: 40,
        certificate_enabled: true,
        curriculum_structure: {
          sections_count: 8,
          lessons_per_section: 5,
          total_videos: 40,
          total_quizzes: 8,
        },
        learning_objectives: [
          'Maîtriser les fondamentaux de [technologie]',
          'Créer des projets complets et fonctionnels',
          'Appliquer les meilleures pratiques',
          'Déployer vos applications',
        ],
        prerequisites: [
          'Connaissances de base en programmation',
          'Ordinateur avec connexion internet',
          'Motivation et envie d\'apprendre',
        ],
        target_audience: [
          'Développeurs débutants/intermédiaires',
          'Étudiants en informatique',
          'Reconversion professionnelle',
        ],
      },
      affiliate: {
        enabled: true,
        commission_rate: 30,
        commission_type: 'percentage',
      },
      tracking: {
        pixels_enabled: true,
        analytics_enabled: true,
        events: ['course_view', 'enroll', 'lesson_complete', 'certificate_earned'],
      },
    },
  },

  // 2. COURS ACADÉMIQUE
  {
    metadata: {
      id: 'course-academic-001',
      name: 'Cours Académique',
      description: 'Template pour cours académiques avec examens et devoirs',
      category: 'academic',
      productType: 'course',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/course/academic-thumb.jpg',
      preview_images: [],
      tags: ['académique', 'université', 'examen', 'diplôme'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: 'Cours : [Matière/Sujet]',
        description_template: `# Cours Académique Complet

## Description du cours

[Description détaillée du contenu académique]

## Objectifs pédagogiques

À la fin de ce cours, vous serez capable de :
- Objectif 1
- Objectif 2
- Objectif 3

## Structure du cours

### Chapitre 1
- Leçon 1.1
- Leçon 1.2
- Quiz chapitre 1

### Chapitre 2
- Leçon 2.1
- Leçon 2.2
- Devoir chapitre 2

## Évaluation

- Quiz (40%)
- Devoirs (30%)
- Examen final (30%)
- Note minimale : 60%`,
        category: 'Éducation',
        pricing_model: 'one_time',
        price: 30000,
        currency: 'XOF',
      },
      course: {
        level: 'all',
        language: 'fr',
        duration_hours: 30,
        certificate_enabled: true,
        curriculum_structure: {
          sections_count: 10,
          lessons_per_section: 4,
          total_videos: 40,
          total_quizzes: 10,
        },
        learning_objectives: [
          'Comprendre les concepts fondamentaux',
          'Appliquer les théories dans des cas pratiques',
          'Réussir les évaluations',
        ],
        prerequisites: [
          'Niveau lycée ou équivalent',
          'Motivation pour l\'apprentissage',
        ],
        target_audience: [
          'Étudiants universitaires',
          'Préparation examens',
          'Formation continue',
        ],
      },
    },
  },

  // 3. COURS VIDÉO
  {
    metadata: {
      id: 'course-video-001',
      name: 'Cours Vidéo Premium',
      description: 'Template pour cours 100% vidéo avec workbook',
      category: 'video',
      productType: 'course',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/course/video-thumb.jpg',
      preview_images: [],
      tags: ['vidéo', 'formation', 'en ligne', 'elearning'],
      premium: true,
      price: 5000,
    },
    data: {
      basicInfo: {
        name_template: '[Sujet] - Formation Vidéo Complète',
        description_template: `# Formation Vidéo Premium

## Format de la formation

- [X]h de vidéos HD
- Accès illimité à vie
- Téléchargement des vidéos
- Sous-titres français

## Contenu

### Introduction
- Présentation du formateur
- Objectifs de la formation
- Outils nécessaires

### Modules principaux
- Module 1 : [titre]
- Module 2 : [titre]
- Module 3 : [titre]

### Bonus
- Workbook PDF (50 pages)
- Templates téléchargeables
- Ressources complémentaires

## Accès et Support

✅ Accès immédiat
✅ Mises à jour gratuites
✅ Support par email
✅ Communauté privée`,
        category: 'Formation en Ligne',
        pricing_model: 'one_time',
        price: 40000,
        currency: 'XOF',
      },
      course: {
        level: 'beginner',
        language: 'fr',
        duration_hours: 25,
        certificate_enabled: true,
        curriculum_structure: {
          sections_count: 6,
          lessons_per_section: 6,
          total_videos: 36,
          total_quizzes: 6,
        },
      },
    },
  },

  // 4. MASTERCLASS
  {
    metadata: {
      id: 'course-masterclass-001',
      name: 'Masterclass Expert',
      description: 'Template pour masterclass d\'expert avec cas d\'études',
      category: 'masterclass',
      productType: 'course',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/course/masterclass-thumb.jpg',
      preview_images: [],
      tags: ['masterclass', 'expert', 'avancé', 'pro'],
      premium: true,
      price: 10000,
    },
    data: {
      basicInfo: {
        name_template: 'Masterclass : [Sujet] avec [Expert]',
        description_template: `# Masterclass Exclusive

## À propos de l'expert

[Nom] est [qualification/expérience]

## Programme

### Session 1 : Fondations
- Expérience de l'expert
- Erreurs à éviter
- Stratégies gagnantes

### Session 2 : Cas d'études
- Cas réel 1
- Cas réel 2
- Analyse approfondie

### Session 3 : Q&A Live
- Questions/Réponses en direct
- Conseils personnalisés

## Ce qui est inclus

🎯 [X]h de contenu exclusif
🎯 Cas d'études réels
🎯 Session Q&A live
🎯 Accès communauté VIP`,
        category: 'Masterclass',
        pricing_model: 'one_time',
        price: 75000,
        currency: 'XOF',
      },
      course: {
        level: 'advanced',
        language: 'fr',
        duration_hours: 15,
        certificate_enabled: true,
        curriculum_structure: {
          sections_count: 4,
          lessons_per_section: 4,
          total_videos: 16,
          total_quizzes: 0,
        },
      },
    },
  },

  // 5. BOOTCAMP
  {
    metadata: {
      id: 'course-bootcamp-001',
      name: 'Bootcamp Intensif',
      description: 'Template pour bootcamp avec mentor et certification pro',
      category: 'bootcamp',
      productType: 'course',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/course/bootcamp-thumb.jpg',
      preview_images: [],
      tags: ['bootcamp', 'intensif', 'mentor', 'certification'],
      premium: true,
      price: 15000,
    },
    data: {
      basicInfo: {
        name_template: 'Bootcamp [Domaine] - [Durée] semaines',
        description_template: `# Bootcamp Intensif

## Format Bootcamp

- Durée : [X] semaines
- [Y]h de formation intensive
- Accompagnement mentor dédié
- Projets réels

## Planning type

### Semaine 1-2 : Fondamentaux
- Cours théoriques
- Exercices pratiques
- Projet guidé

### Semaine 3-4 : Avancé
- Concepts avancés
- Projet personnel
- Code reviews

### Semaine 5-6 : Projet Final
- Conception
- Développement
- Présentation

## Garanties

✅ Mentor dédié
✅ Sessions live hebdomadaires
✅ Correction projets
✅ Certification professionnelle
✅ Aide placement emploi`,
        category: 'Bootcamp',
        pricing_model: 'one_time',
        price: 150000,
        currency: 'XOF',
      },
      course: {
        level: 'intermediate',
        language: 'fr',
        duration_hours: 120,
        certificate_enabled: true,
        curriculum_structure: {
          sections_count: 12,
          lessons_per_section: 8,
          total_videos: 96,
          total_quizzes: 12,
        },
      },
    },
  },
];

