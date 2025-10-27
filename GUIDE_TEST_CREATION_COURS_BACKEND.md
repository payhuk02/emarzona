# 🧪 GUIDE DE TEST - CRÉATION DE COURS (BACKEND INTÉGRÉ)

**Date** : 27 octobre 2025  
**Phase** : Phase 2 - Intégration Backend  
**Version** : 1.0

---

## ✅ CE QUI A ÉTÉ IMPLÉMENTÉ

### 1. Hook de Création Complète
**Fichier** : `src/hooks/courses/useCreateFullCourse.ts`

✅ **Fonctionnalités** :
- Création du produit (table `products`)
- Création du cours (table `courses`)
- Création des sections (table `course_sections`)
- Création des leçons (table `course_lessons`)
- Gestion des erreurs avec rollback automatique
- Calcul automatique des statistiques (durée totale, nombre de leçons)
- Toast de succès/erreur
- Redirection automatique après succès

### 2. Wizard Amélioré
**Fichier** : `src/components/courses/create/CreateCourseWizard.tsx`

✅ **Modifications** :
- Intégration du hook `useCreateFullCourse`
- Récupération automatique du store de l'utilisateur
- Bouton de publication avec état de chargement
- Validation avant publication
- Gestion des erreurs

---

## 🧪 COMMENT TESTER

### ÉTAPE 1 : Démarrer l'application

```bash
npm run dev
```

### ÉTAPE 2 : Se connecter
1. Aller sur http://localhost:5173
2. Se connecter avec un compte qui a une boutique
3. Aller dans **Dashboard → Produits**

### ÉTAPE 3 : Créer un nouveau cours
1. Cliquer sur **"Nouveau produit"**
2. Sélectionner **"Cours en ligne"**
3. Le wizard de création de cours s'affiche

### ÉTAPE 4 : Remplir les informations

#### **Étape 1 - Informations de base**
- **Titre** : "Formation React Avancée"
- **Slug** : "formation-react-avancee"
- **Description courte** : "Maîtrisez React de A à Z"
- **Description** : "Une formation complète pour devenir expert React..."
- **Niveau** : "Intermédiaire"
- **Langue** : "Français"
- **Catégorie** : "Programmation"
- Cliquer sur **"Suivant"**

#### **Étape 2 - Curriculum**
1. Cliquer sur **"Ajouter une section"**
   - **Titre** : "Introduction à React"
   - **Description** : "Les bases de React"
2. Cliquer sur **"Ajouter une leçon"**
   - **Titre** : "Qu'est-ce que React ?"
   - **Description** : "Introduction aux concepts de React"
   - **Type de vidéo** : YouTube
   - **URL de la vidéo** : `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - **Durée** : 600 (10 minutes)
   - Cocher **"Leçon gratuite (aperçu)"**
3. Ajouter une 2ème leçon :
   - **Titre** : "Installation et configuration"
   - **Durée** : 900 (15 minutes)
4. Ajouter une 2ème section :
   - **Titre** : "Composants React"
   - **Description** : "Apprendre à créer des composants"
5. Ajouter des leçons à la 2ème section
6. Cliquer sur **"Suivant"**

#### **Étape 3 - Configuration**
- **Prix** : 25000
- **Devise** : XOF
- **Prix promotionnel** : 15000
- **Certificat activé** : ✅ (activé)
- **Score minimal** : 80%
- **Objectifs d'apprentissage** :
  - "Maîtriser les hooks React"
  - "Créer des applications performantes"
  - "Gérer l'état avec Redux"
- **Prérequis** :
  - "Connaissances en JavaScript"
  - "HTML/CSS de base"
- **Public cible** :
  - "Développeurs juniors"
  - "Étudiants en informatique"
- Cliquer sur **"Suivant"**

#### **Étape 4 - Révision**
1. Vérifier toutes les informations
2. Lire l'avertissement
3. Cliquer sur **"Publier le cours"**

---

## 🔍 VÉRIFICATIONS À FAIRE

### 1. Pendant la création
✅ Le bouton affiche **"Publication en cours..."** avec une icône de chargement  
✅ Le bouton est désactivé pendant le processus  
✅ Aucune erreur dans la console  

### 2. Après la création
✅ Un toast de succès s'affiche :
   - Titre : "🎉 Cours créé avec succès !"
   - Description : "Votre cours 'Formation React Avancée' a été publié avec 2 sections et 3 leçons."
   
✅ Redirection automatique vers `/dashboard/products`  
✅ Le cours apparaît dans la liste des produits  

### 3. Dans Supabase
Ouvrir le tableau de bord Supabase et vérifier :

#### Table `products`
```sql
SELECT * FROM products WHERE product_type = 'course' ORDER BY created_at DESC LIMIT 1;
```
✅ Une ligne existe avec :
- `name` = "Formation React Avancée"
- `slug` = "formation-react-avancee"
- `product_type` = "course"
- `price` = 25000
- `promotional_price` = 15000
- `is_active` = true

#### Table `courses`
```sql
SELECT * FROM courses ORDER BY created_at DESC LIMIT 1;
```
✅ Une ligne existe avec :
- `product_id` = (l'ID du produit créé)
- `level` = "Intermédiaire"
- `language` = "Français"
- `total_lessons` = 3
- `learning_objectives` contient les 3 objectifs
- `certificate_enabled` = true

#### Table `course_sections`
```sql
SELECT * FROM course_sections WHERE course_id = 'XXX' ORDER BY order_index;
```
✅ 2 lignes existent :
- Section 1 : "Introduction à React"
- Section 2 : "Composants React"

#### Table `course_lessons`
```sql
SELECT * FROM course_lessons WHERE course_id = 'XXX' ORDER BY section_id, order_index;
```
✅ 3 leçons (ou plus) existent avec :
- `title`, `description`, `video_url`, `video_duration_seconds`
- `is_preview` = true pour la première leçon

---

## ❌ TESTS D'ERREUR

### Test 1 : Sans boutique
1. Se connecter avec un compte sans boutique
2. Essayer de créer un cours
3. ✅ Un toast d'erreur doit s'afficher : "Vous devez avoir une boutique pour créer un cours"

### Test 2 : Champs requis manquants
1. Laisser des champs vides à l'étape 1
2. Cliquer sur "Suivant"
3. ✅ Les erreurs doivent s'afficher sous les champs

### Test 3 : Curriculum vide
1. Aller à l'étape 2
2. Ne pas ajouter de section
3. Cliquer sur "Suivant"
4. ✅ Un toast d'erreur doit s'afficher : "Ajoutez au moins une section avec une leçon"

### Test 4 : Erreur réseau
1. Ouvrir les DevTools
2. Aller dans Network → Offline
3. Essayer de publier le cours
4. ✅ Un toast d'erreur doit s'afficher avec le message d'erreur

---

## 🐛 RÉSOLUTION DES PROBLÈMES

### Erreur : "Utilisateur non connecté"
**Solution** : Se reconnecter et réessayer

### Erreur : "Vous devez avoir une boutique"
**Solution** : Créer une boutique d'abord dans les paramètres

### Erreur : "Erreur lors de la création du produit"
**Solution** : Vérifier la console pour plus de détails et les logs Supabase

### Le cours n'apparaît pas dans la liste
**Solution** : Rafraîchir la page ou vider le cache

---

## 📊 CONSOLE LOGS

Pendant la création, vous devriez voir dans la console :

```
📦 Création du produit...
✅ Produit créé: 12345678-1234-1234-1234-123456789abc
🎓 Création du cours...
✅ Cours créé: 87654321-4321-4321-4321-cba987654321
📚 Création des sections...
✅ Section créée: xxx-xxx-xxx - Introduction à React
✅ Section créée: yyy-yyy-yyy - Composants React
📹 Création des leçons...
✅ Leçon créée: Qu'est-ce que React ?
✅ Leçon créée: Installation et configuration
✅ Leçon créée: [autres leçons]
🎉 COURS CRÉÉ AVEC SUCCÈS !
📊 Résumé: 2 sections, 3 leçons
```

---

## 🎯 CRITÈRES DE SUCCÈS

✅ **Création complète** : Produit + Cours + Sections + Leçons créés  
✅ **Statistiques** : `total_lessons` et `total_duration_minutes` calculés correctement  
✅ **Rollback** : En cas d'erreur, les données partielles sont supprimées  
✅ **UX** : Toast de succès + Redirection automatique  
✅ **Performance** : Création en moins de 5 secondes  
✅ **Logs** : Console logs clairs et informatifs  

---

## 🔄 PROCHAINES ÉTAPES

1. ✅ **Phase 2 terminée** : Backend intégré
2. ⏳ **Phase 3** : Upload de vidéos réelles (Supabase Storage)
3. ⏳ **Phase 4** : Page de détail du cours (frontend)
4. ⏳ **Phase 5** : Système d'inscription et de progression
5. ⏳ **Phase 6** : Quiz et certificats

---

**Statut** : ✅ **PHASE 2 COMPLÈTE - BACKEND INTÉGRÉ**

Vous pouvez maintenant créer des cours complets qui sont sauvegardés dans Supabase ! 🎉

