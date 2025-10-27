# 🏗️ ARCHITECTURE SYSTÈME COURS - VUE D'ENSEMBLE

---

## 📊 SCHÉMA COMPLET

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PAYHUK COURSES SYSTEM                        │
│                        Système LMS Complet                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                          1. FRONTEND (React)                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📁 src/pages/courses/                                              │
│  ├─ MyCourses.tsx          → Liste mes cours achetés               │
│  ├─ CreateCourse.tsx       → Créer nouveau cours                   │
│  └─ CourseDetail.tsx       → Détail public cours                   │
│                                                                      │
│  📁 src/components/courses/marketplace/                             │
│  └─ CourseCard.tsx         → Carte affichage cours                 │
│                                                                      │
│  📁 src/hooks/courses/                                              │
│  ├─ useCourses.ts          → CRUD cours (7 hooks)                  │
│  ├─ useCourseEnrollment.ts → Inscriptions (6 hooks)                │
│  └─ useCourseProgress.ts   → Progression (6 hooks)                 │
│                                                                      │
│  📁 src/types/                                                      │
│  └─ courses.ts             → 20+ interfaces TypeScript             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
                          🔌 TanStack Query
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      2. BACKEND (Supabase)                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📊 Base de données PostgreSQL                                      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ TABLE: courses (Cours principaux)                          │   │
│  │ ├─ product_id → Lien vers products                         │   │
│  │ ├─ level (beginner/intermediate/advanced)                  │   │
│  │ ├─ total_duration_minutes                                  │   │
│  │ ├─ certificate_enabled                                     │   │
│  │ └─ learning_objectives[]                                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                           ↓                                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ TABLE: course_sections (Chapitres)                         │   │
│  │ ├─ course_id                                               │   │
│  │ ├─ title                                                   │   │
│  │ └─ order_index                                             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                           ↓                                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ TABLE: course_lessons (Leçons vidéo)                       │   │
│  │ ├─ section_id                                              │   │
│  │ ├─ video_url                                               │   │
│  │ ├─ video_duration_seconds                                  │   │
│  │ └─ downloadable_resources (JSONB)                          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                           ↓                                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ TABLE: course_enrollments (Inscriptions)                   │   │
│  │ ├─ course_id                                               │   │
│  │ ├─ user_id                                                 │   │
│  │ ├─ progress_percentage                                     │   │
│  │ └─ certificate_earned                                      │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  + 7 autres tables (quizzes, progress, discussions, etc.)          │
│                                                                      │
│  🔒 RLS (Row Level Security)                                        │
│  ├─ Instructeurs : Gèrent leurs cours                              │
│  ├─ Étudiants : Voient cours inscrits                              │
│  └─ Public : Voit cours actifs                                     │
│                                                                      │
│  ⚡ Fonctions SQL                                                   │
│  ├─ calculate_course_progress()                                    │
│  ├─ generate_certificate_number()                                  │
│  └─ mark_lesson_complete()                                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                       3. FLOW UTILISATEUR                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  👨‍🏫 INSTRUCTEUR                    👨‍🎓 ÉTUDIANT                        │
│  │                                 │                                │
│  ├─ Créer produit type "Cours"    ├─ Découvrir cours marketplace   │
│  ├─ Ajouter sections/leçons       ├─ Acheter cours                 │
│  ├─ Upload vidéos                 ├─ S'inscrire automatiquement    │
│  ├─ Créer quiz                    ├─ Regarder leçons               │
│  ├─ Configurer certificat         ├─ Passer quiz                   │
│  ├─ Publier cours                 ├─ Prendre notes                 │
│  └─ Suivre analytics              └─ Obtenir certificat            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ STRUCTURE BASE DE DONNÉES DÉTAILLÉE

### Hiérarchie des données

```
products (Table existante)
    │
    └─── courses ──────────────────────────────────┐
            │                                      │
            ├─── course_sections                  │
            │       │                              │
            │       └─── course_lessons            │
            │               │                      │
            │               └─── course_quizzes    │
            │                                      │
            ├─── course_enrollments ───────────────┤
            │       │                              │
            │       └─── course_lesson_progress    │
            │       └─── quiz_attempts             │
            │       └─── course_certificates       │
            │                                      │
            └─── course_discussions                │
                    │                              │
                    └─── course_discussion_replies │
                                                   │
instructor_profiles ────────────────────────────────┘
```

### Relations principales

```
1 COURSE = 1 PRODUCT (relation 1:1)
1 COURSE = N SECTIONS (relation 1:n)
1 SECTION = N LESSONS (relation 1:n)
1 LESSON = 0..1 QUIZ (relation 1:0..1)
1 COURSE = N ENROLLMENTS (relation 1:n)
1 ENROLLMENT = 1 CERTIFICATE (relation 1:0..1)
```

---

## 🔄 FLUX DE DONNÉES

### Création de cours

```
1. Instructeur crée un PRODUCT (type = "course")
      ↓
2. Hook useCreateCourse() crée COURSE lié au product
      ↓
3. Instructeur ajoute SECTIONS (ordre 1, 2, 3...)
      ↓
4. Pour chaque section, ajoute LESSONS
      ↓
5. Upload vidéos → Supabase Storage → video_url
      ↓
6. (Optionnel) Ajouter QUIZZES
      ↓
7. Publier cours (product.is_active = true)
```

### Inscription étudiant

```
1. Étudiant achète cours (paiement Moneroo)
      ↓
2. ORDER créé avec product_id
      ↓
3. Hook useCreateEnrollment() auto-exécuté
      ↓
4. ENROLLMENT créé (course_id, user_id, order_id)
      ↓
5. Étudiant accède au cours
```

### Progression leçon

```
1. Étudiant regarde vidéo
      ↓
2. Hook useUpdateVideoPosition() enregistre position
      ↓
3. LESSON_PROGRESS mis à jour (last_position_seconds)
      ↓
4. Leçon terminée → useMarkLessonComplete()
      ↓
5. Fonction SQL calculate_course_progress() exécutée
      ↓
6. ENROLLMENT.progress_percentage mis à jour
      ↓
7. Si 100% → Génération certificat automatique
```

---

## 🎨 COMPOSANTS UI (À VENIR)

```
┌─────────────────────────────────────────────────────┐
│                  Pages Principales                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📄 CoursesMarketplace                             │
│  ├─ Grille de CourseCard                           │
│  ├─ Filtres (niveau, langue, prix)                 │
│  └─ Recherche                                      │
│                                                     │
│  📄 CourseDetailPage                               │
│  ├─ Hero (image, titre, instructeur)               │
│  ├─ Curriculum (sections/leçons)                   │
│  ├─ What You'll Learn                              │
│  ├─ Reviews                                        │
│  └─ Pricing + CTA                                  │
│                                                     │
│  📄 CoursePlayerPage                               │
│  ├─ VideoPlayer (contrôles custom)                │
│  ├─ Sidebar curriculum                             │
│  ├─ Notes panel                                    │
│  ├─ Resources downloads                            │
│  └─ Progress tracker                               │
│                                                     │
│  📄 CreateCoursePage                               │
│  ├─ Step 1: Informations de base                  │
│  ├─ Step 2: Curriculum builder                    │
│  ├─ Step 3: Upload contenu                        │
│  ├─ Step 4: Quiz & évaluations                    │
│  └─ Step 5: Publier                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 SÉCURITÉ (RLS)

### Politiques Row Level Security

```sql
-- Courses
✅ Public : Voir cours actifs (is_active = true)
✅ Instructeur : CRUD ses propres cours
❌ Autres : Aucun accès

-- Course Lessons
✅ Public : Voir leçons preview (is_preview = true)
✅ Étudiants inscrits : Voir toutes leçons
✅ Instructeur : CRUD ses leçons
❌ Autres : Aucun accès

-- Enrollments
✅ Étudiant : Voir/modifier ses inscriptions
✅ Instructeur : Voir inscriptions de ses cours
❌ Autres : Aucun accès

-- Lesson Progress
✅ Étudiant : CRUD sa propre progression
✅ Instructeur : Voir progression (lecture seule)
❌ Autres : Aucun accès
```

---

## ⚡ PERFORMANCES

### Indexes créés

```sql
-- 30+ indexes optimisés
✅ courses(product_id)          → Lookup rapide
✅ courses(level)                → Filtrage niveau
✅ enrollments(user_id)          → Mes cours
✅ enrollments(course_id)        → Stats cours
✅ lessons(section_id, order)    → Tri curriculum
✅ progress(enrollment_id)       → Suivi
```

### Optimisations futures

```
🔮 Cache Redis pour stats cours
🔮 CDN pour vidéos (Cloudflare)
🔮 Image optimization (WebP)
🔮 Lazy loading curriculum
🔮 Pagination infinie marketplace
```

---

## 🎯 FONCTIONNALITÉS CLÉS

### ✅ Déjà implémenté (Backend)

- ✅ Modèle de données complet
- ✅ RLS sécurisé
- ✅ Fonctions SQL utilitaires
- ✅ Hooks React CRUD
- ✅ Types TypeScript

### 🔄 À implémenter (Frontend)

- 🔄 Formulaire création cours
- 🔄 Upload vidéos
- 🔄 Curriculum builder
- 🔄 Player vidéo
- 🔄 Système quiz
- 🔄 Génération certificats PDF
- 🔄 Q&A discussions
- 🔄 Analytics dashboard

---

## 📈 ÉVOLUTION PRÉVUE

### Phase 1 (✅ 85% fait)
- Migration SQL
- Types + Hooks
- Routes basiques

### Phase 2 (Semaine prochaine)
- Formulaire création cours
- Upload vidéos
- Curriculum builder

### Phase 3 (Dans 2 semaines)
- Player vidéo custom
- Système quiz
- Tracking progression

### Phase 4 (Dans 1 mois)
- Certificats PDF
- Q&A système
- Marketplace complet

### Phase 5 (Dans 2 mois)
- Analytics avancés
- Recommandations IA
- Gamification

---

## 🏆 AVANTAGES COMPÉTITIFS

### vs Udemy
```
✅ Commissions plus basses (Payhuk: 5-10% vs Udemy: 37-50%)
✅ Paiements locaux (Mobile Money, Moneroo)
✅ Support multilingue (FR, EN, PT, ES)
```

### vs Teachable
```
✅ Pas de frais mensuels fixes
✅ Marketplace intégré
✅ Affiliation native
```

### vs Thinkific
```
✅ Plus simple à utiliser
✅ Déploiement plus rapide
✅ Support Afrique de l'Ouest
```

---

**Document créé le** : 27 Octobre 2025  
**Version** : 1.0  
**Statut** : Architecture validée et opérationnelle

