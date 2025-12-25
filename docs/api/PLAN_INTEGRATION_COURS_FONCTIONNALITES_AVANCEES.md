# 🔗 PLAN D'INTÉGRATION - COURS & FONCTIONNALITÉS AVANCÉES

## 📊 ANALYSE DES FONCTIONNALITÉS EXISTANTES

### Fonctionnalités avancées disponibles pour produits digitaux, physiques et services

| Fonctionnalité | Tables/Colonnes | Statut Cours |
|----------------|-----------------|--------------|
| **1. Affiliation** | `product_affiliate_settings` | ❌ À intégrer |
| **2. Analytics** | `product_analytics`, `product_views`, `product_clicks` | ❌ À intégrer |
| **3. SEO** | `meta_title`, `meta_description`, `og_image` | ❌ À intégrer |
| **4. FAQs** | `faqs` (JSONB) | ❌ À intégrer |
| **5. Custom Fields** | `custom_fields` (JSONB) | ❌ À intégrer |
| **6. Promotions** | `promotional_price`, `sale_start_date`, `sale_end_date` | ✅ Déjà disponible |
| **7. Pixels Tracking** | `google_analytics_id`, `facebook_pixel_id`, etc. | ❌ À intégrer |
| **8. Reviews** | `reviews` table | ✅ Compatible (produit-based) |
| **9. Advanced Pricing** | `pricing_model`, `automatic_discount_enabled` | ❌ À adapter |

---

## 🎯 OBJECTIFS D'INTÉGRATION

### Phase 1 : Affiliation pour Cours ✨
**Permettre aux instructeurs de monétiser via affiliation**

**Bénéfices:**
- Les cours peuvent avoir des affiliés
- Taux de commission personnalisables par cours
- Tracking des ventes affiliées
- Commissions automatiques

**Implémentation:**
- ✅ La table `product_affiliate_settings` référence `product_id`
- ✅ Les cours ayant un `product_id`, ils sont automatiquement compatibles
- ⚠️ Besoin d'ajouter l'UI pour activer/configurer l'affiliation

---

### Phase 2 : Analytics pour Cours 📊
**Tracker la performance des cours**

**Métriques spécifiques aux cours:**
- Vues de la page cours
- Clics sur "S'inscrire"
- Taux de conversion (vues → inscriptions)
- Taux de complétion (inscriptions → certificat)
- Temps moyen par leçon
- Taux d'abandon par section
- Quiz success rate
- Certificats générés

**Implémentation:**
- ✅ Table `product_analytics` déjà compatible via `product_id`
- ✅ Tables spécifiques cours (`course_lesson_progress`, `quiz_attempts`) existent
- ⚠️ Besoin de créer des hooks d'analytics
- ⚠️ Besoin d'un dashboard analytics spécifique cours

---

### Phase 3 : SEO pour Cours 🔍
**Optimiser les cours pour les moteurs de recherche**

**Champs SEO à exploiter:**
- `meta_title` - Titre optimisé
- `meta_description` - Description pour Google
- `meta_keywords` - Mots-clés (déjà dans products)
- `og_image` - Image Open Graph
- `og_title` - Titre social media
- `og_description` - Description social media

**Nouveaux champs spécifiques cours:**
- Schema.org Course markup
- Instructor info pour rich snippets
- Course duration/lessons pour snippets
- Average rating pour stars

**Implémentation:**
- ✅ Colonnes SEO existent dans `products`
- ⚠️ Besoin d'ajouter UI dans wizard création cours
- ⚠️ Besoin de composant SEO preview
- ⚠️ Besoin de générer schema.org JSON-LD

---

### Phase 4 : FAQs pour Cours ❓
**Répondre aux questions fréquentes**

**FAQs typiques pour cours:**
- "Combien de temps ai-je accès au cours ?"
- "Y a-t-il des prérequis ?"
- "Est-ce que je reçois un certificat ?"
- "Puis-je télécharger les vidéos ?"
- "Comment contacter l'instructeur ?"

**Implémentation:**
- ✅ Colonne `faqs` (JSONB) existe dans `products`
- ⚠️ Besoin d'ajouter UI FAQ dans wizard
- ⚠️ Besoin d'afficher FAQs sur page détail cours

---

### Phase 5 : Custom Fields pour Cours 🎨
**Champs personnalisés par instructeur**

**Exemples de custom fields pour cours:**
- "Logiciels requis" (liste)
- "Niveau d'expertise requis" (slider)
- "Matériel nécessaire" (texte)
- "Projets pratiques inclus" (nombre)
- "Support 1-à-1" (booléen)

**Implémentation:**
- ✅ Colonne `custom_fields` (JSONB) existe
- ⚠️ Besoin d'UI pour créer/gérer custom fields
- ⚠️ Besoin d'affichage dynamique sur page cours

---

### Phase 6 : Pixels Tracking pour Cours 📍
**Tracking publicitaire et remarketing**

**Pixels supportés:**
- Google Analytics
- Facebook Pixel
- Google Tag Manager
- TikTok Pixel
- Pinterest Pixel
- LinkedIn Insight Tag

**Events à tracker:**
- ViewContent (page cours)
- InitiateCheckout (clic S'inscrire)
- Purchase (inscription payée)
- CompleteRegistration (inscription gratuite)
- AddToWishlist (ajout favoris)
- ViewVideo (lecture vidéo)
- Lead (demande info)

**Implémentation:**
- ✅ Colonnes pixels existent dans `product_analytics`
- ⚠️ Besoin d'intégrer pixels dans CourseDetail
- ⚠️ Besoin de tracker events spécifiques cours

---

### Phase 7 : Advanced Pricing pour Cours 💰
**Modèles de tarification flexibles**

**Pricing models pour cours:**
- **One-time** : Paiement unique, accès à vie ✅ Actuel
- **Subscription** : Abonnement mensuel/annuel
- **Pay-what-you-want** : Prix libre
- **Free** : Gratuit avec upsells optionnels
- **Bundle** : Pack de cours
- **Tier** : Plusieurs niveaux (basic, pro, premium)

**Implémentation:**
- ✅ Enum `pricing_model` existe
- ⚠️ Adapter logic inscription pour subscription
- ⚠️ UI pour choisir pricing model
- ⚠️ Gestion renouvellement abonnement

---

### Phase 8 : Promotions Avancées pour Cours 🎁
**Remises et offres spéciales**

**Types de promotions:**
- Prix promotionnel temporaire ✅ Déjà disponible
- Early bird (réduction lancement)
- Flash sales
- Coupons de réduction
- Bundle discounts
- Referral discounts

**Implémentation:**
- ✅ `promotional_price`, `sale_start_date`, `sale_end_date` existent
- ⚠️ Système de coupons à créer
- ⚠️ UI gestion promotions
- ⚠️ Countdown timer sur page cours

---

## 🗺️ ROADMAP D'IMPLÉMENTATION

### Sprint 1 : SEO & FAQs (2-3h)
**Priorité : HAUTE** - Impact immédiat sur visibilité

1. ✅ Ajouter onglet SEO dans wizard création cours
2. ✅ Ajouter section FAQs dans wizard
3. ✅ Générer schema.org Course JSON-LD
4. ✅ Afficher FAQs sur CourseDetail
5. ✅ Composant SEO Preview

**Fichiers à modifier:**
- `src/components/courses/create/CreateCourseWizard.tsx`
- `src/components/courses/create/CourseSEOForm.tsx` (nouveau)
- `src/components/courses/create/CourseFAQForm.tsx` (nouveau)
- `src/pages/courses/CourseDetail.tsx`
- `src/components/seo/CourseSchema.tsx` (nouveau)

---

### Sprint 2 : Analytics (3-4h)
**Priorité : HAUTE** - Données cruciales pour instructeurs

1. ✅ Créer hooks analytics cours
2. ✅ Dashboard analytics instructeur
3. ✅ Tracker events spécifiques (video play, lesson complete, etc.)
4. ✅ Graphiques de progression
5. ✅ Métriques temps réel

**Fichiers à créer:**
- `src/hooks/courses/useCourseAnalytics.ts`
- `src/components/courses/analytics/CourseAnalyticsDashboard.tsx`
- `src/components/courses/analytics/LessonAnalytics.tsx`
- `src/components/courses/analytics/EnrollmentStats.tsx`

---

### Sprint 3 : Affiliation (4-5h)
**Priorité : MOYENNE** - Monétisation additionnelle

1. ✅ UI activation affiliation (wizard)
2. ✅ Configuration taux commission
3. ✅ Page affiliés du cours
4. ✅ Génération liens affiliés
5. ✅ Dashboard affilié

**Fichiers à modifier:**
- `src/components/courses/create/CourseAffiliateSettings.tsx` (nouveau)
- `src/pages/courses/CourseAffiliates.tsx` (nouveau)
- `src/hooks/courses/useCourseAffiliates.ts` (nouveau)

---

### Sprint 4 : Pixels & Tracking (2-3h)
**Priorité : MOYENNE** - Marketing et remarketing

1. ✅ Intégrer pixels dans CourseDetail
2. ✅ Tracker events standards
3. ✅ Events personnalisés cours
4. ✅ UI configuration pixels

**Fichiers à modifier:**
- `src/pages/courses/CourseDetail.tsx`
- `src/components/courses/create/CoursePixelsConfig.tsx` (nouveau)
- `src/lib/coursePixels.ts` (nouveau)

---

### Sprint 5 : Custom Fields (2h)
**Priorité : BASSE** - Nice to have

1. ✅ UI création custom fields
2. ✅ Affichage dynamique
3. ✅ Validation des champs

**Fichiers à créer:**
- `src/components/courses/create/CourseCustomFields.tsx`
- `src/components/courses/detail/CourseCustomFieldsDisplay.tsx`

---

### Sprint 6 : Advanced Pricing (3-4h)
**Priorité : BASSE** - Fonctionnalité future

1. ✅ UI sélection pricing model
2. ✅ Logic subscription
3. ✅ Gestion renouvellement
4. ✅ Coupons de réduction

**Fichiers à créer:**
- `src/components/courses/create/CoursePricingModels.tsx`
- `src/components/courses/subscriptions/SubscriptionManager.tsx`
- `src/hooks/courses/useSubscriptions.ts`

---

## 📋 CHECKLIST D'INTÉGRATION

### Base de données ✅
- [x] Tables cours créées
- [x] `product_id` lien avec products
- [x] Compatibilité avec `product_affiliate_settings`
- [x] Compatibilité avec `product_analytics`
- [x] Colonnes SEO disponibles

### Backend / Hooks ⏳
- [ ] Hook analytics cours
- [ ] Hook affiliation cours
- [ ] Hook pixels tracking
- [ ] Hook custom fields
- [ ] Hook subscriptions

### UI / Components ⏳
- [ ] Onglet SEO (wizard)
- [ ] Section FAQs (wizard)
- [ ] Config affiliation (wizard)
- [ ] Config pixels (wizard)
- [ ] Dashboard analytics
- [ ] Page affiliés cours

### Pages ⏳
- [ ] CourseDetail avec SEO optimisé
- [ ] CourseDetail avec FAQs
- [ ] CourseDetail avec pixels
- [ ] CourseAnalytics (nouveau)
- [ ] CourseAffiliates (nouveau)

---

## 🔄 COMPATIBILITÉ EXISTANTE

### ✅ Déjà compatible (sans modification)

| Fonctionnalité | Raison |
|----------------|--------|
| **Reviews** | Table `reviews` référence `product_id` |
| **Promotions** | Colonnes `promotional_price`, `sale_start_date` dans `products` |
| **Images** | Colonne `images` (JSONB) dans `products` |
| **Categories** | Colonne `category` dans `products` |
| **Ratings** | Colonnes `rating`, `reviews_count` dans `products` |

### ⚠️ Nécessite adaptation UI uniquement

| Fonctionnalité | Besoin |
|----------------|--------|
| **SEO** | Ajouter UI dans wizard + affichage |
| **FAQs** | Ajouter UI dans wizard + affichage |
| **Custom Fields** | Ajouter UI création + affichage |
| **Affiliation** | Ajouter UI configuration |
| **Analytics** | Créer dashboard + hooks |
| **Pixels** | Intégrer tracking events |

---

## 🎯 QUICK WINS (À faire en premier)

### 1️⃣ SEO (30 min)
- Exposer champs meta dans wizard
- Générer schema.org JSON-LD
- **Impact** : Visibilité Google immédiate

### 2️⃣ FAQs (30 min)
- UI ajout FAQs dans wizard
- Affichage accordion sur CourseDetail
- **Impact** : Meilleure conversion

### 3️⃣ Analytics basiques (1h)
- Tracker vues page cours
- Tracker clics inscription
- Afficher stats simples
- **Impact** : Données pour instructeurs

---

## 📊 PRIORISATION PAR IMPACT

| Priorité | Fonctionnalité | Temps | Impact Business |
|----------|----------------|-------|-----------------|
| 🔴 P0 | SEO | 2h | ⭐⭐⭐⭐⭐ Visibilité |
| 🔴 P0 | FAQs | 1h | ⭐⭐⭐⭐ Conversion |
| 🟠 P1 | Analytics | 3h | ⭐⭐⭐⭐ Décisions data |
| 🟠 P1 | Affiliation | 4h | ⭐⭐⭐⭐ Revenus |
| 🟡 P2 | Pixels | 2h | ⭐⭐⭐ Marketing |
| 🟢 P3 | Custom Fields | 2h | ⭐⭐ UX |
| 🟢 P3 | Advanced Pricing | 4h | ⭐⭐ Flexibilité |

---

## 🚀 DÉMARRAGE IMMÉDIAT

**Commençons par les 3 Quick Wins:**

1. **SEO** (30 min)
   - Créer `CourseSEOForm.tsx`
   - Intégrer dans wizard
   - Générer schema.org

2. **FAQs** (30 min)
   - Créer `CourseFAQForm.tsx`
   - Intégrer dans wizard
   - Afficher sur CourseDetail

3. **Analytics** (1h)
   - Créer hooks analytics
   - Tracker events basiques
   - Dashboard simple

**Total : 2 heures pour impact massif** 🎯

---

## 📝 NOTES TECHNIQUES

### Architecture
- ✅ Tous les cours ont un `product_id`
- ✅ Héritage automatique des fonctionnalités produits
- ✅ Tables analytics compatibles
- ✅ Tables affiliation compatibles

### Contraintes
- ⚠️ Les subscriptions nécessitent intégration paiement
- ⚠️ Les bundles nécessitent table de liaison
- ⚠️ Les coupons nécessitent table dédiée

### Opportunités
- 🎯 Marketplace de cours
- 🎯 Recommandations IA
- 🎯 Parcours d'apprentissage
- 🎯 Gamification (badges, points)

---

**PRÊT À DÉMARRER L'INTÉGRATION !** 🚀

Souhaitez-vous que je commence par les Quick Wins (SEO + FAQs + Analytics) ?

