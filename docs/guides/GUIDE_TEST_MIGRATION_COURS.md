# 🧪 GUIDE DE TEST - MIGRATION COURS PAYHUK

---

**Date** : 27 Octobre 2025  
**Objectif** : Tester la migration SQL des cours en local  
**Durée estimée** : 15-20 minutes

---

## ✅ CE QUI A ÉTÉ FAIT

### 1. Migration SQL ✅
- ✅ 11 tables créées (courses, course_sections, course_lessons, etc.)
- ✅ Tous les indexes optimisés
- ✅ RLS (Row Level Security) configuré
- ✅ 3 fonctions SQL utilitaires
- ✅ Triggers automatiques

### 2. Types TypeScript ✅
- ✅ Fichier `src/types/courses.ts` créé
- ✅ 20+ interfaces définies
- ✅ Tous les types exportés

### 3. Hooks React ✅
- ✅ `useCourses.ts` - CRUD cours
- ✅ `useCourseEnrollment.ts` - Inscriptions
- ✅ `useCourseProgress.ts` - Progression

### 4. UI Mise à jour ✅
- ✅ Type "Cours en ligne" ajouté dans ProductTypeSelector
- ✅ Icône GraduationCap + couleur orange
- ✅ Badge "Populaire"

---

## 🚀 TESTER LA MIGRATION

### Option 1 : Via Supabase Dashboard (Recommandé)

#### Étape 1 : Connexion au projet
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet : `your-project-id`

#### Étape 2 : Exécuter la migration
1. Cliquer sur **SQL Editor** dans le menu gauche
2. Créer une nouvelle query
3. Copier tout le contenu du fichier :
   ```
   supabase/migrations/20251027_courses_system_complete.sql
   ```
4. Coller dans l'éditeur
5. Cliquer sur **Run** (bouton vert en bas à droite)

#### Étape 3 : Vérifier les tables créées
1. Aller dans **Table Editor**
2. Vérifier que ces tables existent :
   - ✅ `courses`
   - ✅ `course_sections`
   - ✅ `course_lessons`
   - ✅ `course_quizzes`
   - ✅ `course_enrollments`
   - ✅ `course_lesson_progress`
   - ✅ `quiz_attempts`
   - ✅ `course_discussions`
   - ✅ `course_discussion_replies`
   - ✅ `course_certificates`
   - ✅ `instructor_profiles`

#### Étape 4 : Vérifier les fonctions SQL
1. Aller dans **Database** → **Functions**
2. Vérifier que ces fonctions existent :
   - ✅ `calculate_course_progress`
   - ✅ `generate_certificate_number`
   - ✅ `mark_lesson_complete`

---

### Option 2 : Via Supabase CLI (Pour développeurs)

#### Prérequis
```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase
```

#### Étape 1 : Lier le projet
```bash
cd payhula
supabase link --project-ref your-project-id
```

#### Étape 2 : Exécuter la migration
```bash
supabase db push
```

Ou exécuter manuellement :
```bash
supabase db execute --file supabase/migrations/20251027_courses_system_complete.sql
```

#### Étape 3 : Vérifier les tables
```bash
supabase db diff
```

---

## 🧪 TESTS DE VÉRIFICATION

### Test 1 : Créer un cours manuellement

1. Aller dans **Table Editor** → `courses`
2. Cliquer sur **Insert** → **Insert row**
3. Remplir :
   ```
   product_id: [Sélectionner un produit existant]
   level: beginner
   language: fr
   certificate_enabled: true
   ```
4. Cliquer sur **Save**

**Résultat attendu** : La ligne est créée avec succès

---

### Test 2 : Tester la fonction `generate_certificate_number`

1. Aller dans **SQL Editor**
2. Exécuter :
   ```sql
   SELECT public.generate_certificate_number();
   ```

**Résultat attendu** : Retourne quelque chose comme `CERT-2025-000001`

---

### Test 3 : Tester les RLS (Row Level Security)

1. Créer un compte utilisateur test
2. Essayer de lister les cours :
   ```sql
   SELECT * FROM public.courses;
   ```

**Résultat attendu** : Seuls les cours actifs et non-draft sont visibles

---

## 🎨 TESTER L'INTERFACE

### Test 1 : Vérifier le nouveau type "Cours"

1. Lancer l'application :
   ```bash
   npm run dev
   ```

2. Aller sur : `http://localhost:5173/dashboard/products/new`

3. Vérifier que **4 types de produits** sont affichés :
   - ✅ Produit Digital (bleu)
   - ✅ **Cours en ligne (orange)** ⭐ Nouveau !
   - ✅ Produit Physique (vert)
   - ✅ Service (violet)

4. Cliquer sur **"Cours en ligne"**

**Résultat attendu** :
- La carte se sélectionne (bordure orange)
- Badge "Populaire" visible
- Icône 🎓 GraduationCap
- Features : "Vidéos HD", "Quiz & Certificats", "Suivi progression"

---

## 🐛 ERREURS POSSIBLES & SOLUTIONS

### Erreur : "relation 'courses' already exists"
**Cause** : Tables déjà créées  
**Solution** :
```sql
-- Supprimer les tables existantes
DROP TABLE IF EXISTS public.course_discussion_replies CASCADE;
DROP TABLE IF EXISTS public.course_discussions CASCADE;
DROP TABLE IF EXISTS public.quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.course_lesson_progress CASCADE;
DROP TABLE IF EXISTS public.course_enrollments CASCADE;
DROP TABLE IF EXISTS public.course_quizzes CASCADE;
DROP TABLE IF EXISTS public.course_lessons CASCADE;
DROP TABLE IF EXISTS public.course_sections CASCADE;
DROP TABLE IF EXISTS public.course_certificates CASCADE;
DROP TABLE IF EXISTS public.instructor_profiles CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;

-- Puis réexécuter la migration
```

---

### Erreur : "function update_updated_at_column() does not exist"
**Cause** : Fonction manquante (doit exister dans une migration précédente)  
**Solution** : Créer la fonction :
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

---

### Erreur : "type pricing_model does not exist"
**Cause** : Enum manquant  
**Solution** : Vérifier que la migration `20251006103640_f55a08d2-0eb9-40bf-af68-8e2b744da8db.sql` a été exécutée

---

## 📊 VÉRIFICATIONS FINALES

### Checklist de vérification

- [ ] Toutes les 11 tables sont créées
- [ ] Les 3 fonctions SQL existent
- [ ] Les RLS policies sont actives
- [ ] Les indexes sont créés
- [ ] Le type "Cours en ligne" apparaît dans l'UI
- [ ] Aucune erreur dans la console
- [ ] Application démarre sans erreur (`npm run dev`)

---

## 🎯 PROCHAINES ÉTAPES

Une fois la migration testée et validée :

### Étape suivante : Créer composant CourseCard
```
src/components/courses/marketplace/CourseCard.tsx
```

### Puis : Ajouter les routes
```
src/App.tsx
- /dashboard/courses
- /dashboard/courses/new
- /courses/:slug
```

### Ensuite : Créer pages
```
src/pages/courses/
- CreateCourse.tsx
- MyCourses.tsx
- CourseDetail.tsx
```

---

## 📞 BESOIN D'AIDE ?

### Si la migration échoue :
1. Vérifier les logs dans Supabase Dashboard
2. Partager le message d'erreur complet
3. Vérifier que toutes les migrations précédentes sont exécutées

### Si l'UI ne se met pas à jour :
1. Vider le cache du navigateur (Ctrl + Shift + R)
2. Redémarrer le serveur dev
3. Vérifier la console pour les erreurs

---

## ✅ SUCCÈS !

Si tous les tests passent, félicitations ! 🎉

**Vous avez maintenant :**
- ✅ Base de données complète pour les cours
- ✅ Types TypeScript prêts
- ✅ Hooks React opérationnels
- ✅ UI mise à jour avec le nouveau type

**Prêt pour la Phase 2** : Créer l'interface de création de cours !

---

**Document créé le** : 27 Octobre 2025  
**Dernière mise à jour** : 27 Octobre 2025

