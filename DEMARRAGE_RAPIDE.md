# ⚡ DÉMARRAGE RAPIDE - FONCTIONNALITÉ COURS

---

## 🎯 EN 3 ÉTAPES SIMPLES

---

### ÉTAPE 1️⃣ : TESTER L'INTERFACE (2 minutes) ✅

```bash
npm run dev
```

Puis ouvrir : **http://localhost:5173/dashboard/products/new**

**✅ Résultat attendu** :

Vous devez voir **4 cartes** de types de produits :

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ 📱 Digital  │  │ 🎓 COURS ⭐ │  │ 📦 Physique │  │ 🔧 Service  │
│   (Bleu)    │  │  (Orange)   │  │   (Vert)    │  │  (Violet)   │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
                      ↑
                    NOUVEAU !
```

**Cliquez sur "Cours en ligne"** → La carte devient orange avec ✓

---

### ÉTAPE 2️⃣ : EXÉCUTER LA MIGRATION (5 minutes) ⚠️

#### A. Aller sur Supabase Dashboard

🔗 https://supabase.com/dashboard/project/**hbdnzajbyjakdhuavrvb**

#### B. Cliquer sur "SQL Editor" (menu gauche)

#### C. Copier-coller ce fichier

```
supabase/migrations/20251027_courses_system_complete.sql
```

Dans le SQL Editor

#### D. Cliquer sur "Run" (bouton vert)

#### E. Vérifier dans "Table Editor"

Vous devez voir ces **11 nouvelles tables** :

```
✅ courses
✅ course_sections
✅ course_lessons
✅ course_quizzes
✅ course_enrollments
✅ course_lesson_progress
✅ quiz_attempts
✅ course_discussions
✅ course_discussion_replies
✅ course_certificates
✅ instructor_profiles
```

---

### ÉTAPE 3️⃣ : ME CONFIRMER ✉️

Envoyez-moi simplement :

```
✅ UI testée - Type "Cours" visible
✅ Migration exécutée - 11 tables créées
✅ Aucune erreur
```

**OU** en cas de problème :

```
🔴 Erreur rencontrée : [copier l'erreur ici]
```

---

## 🎉 C'EST TOUT !

Une fois ces 3 étapes validées, on passe à la suite :
- ✅ Formulaire création cours
- ✅ Upload vidéos
- ✅ Gestion curriculum

---

## 🆘 AIDE RAPIDE

### ❓ Le type "Cours" n'apparaît pas ?

```bash
# Vider le cache
Ctrl + Shift + R (navigateur)

# Redémarrer
npm run dev
```

### ❓ Erreur migration SQL ?

**Erreur "already exists"** :
→ Tables déjà créées, c'est OK !

**Autre erreur** :
→ Copier l'erreur complète et me l'envoyer

### ❓ L'app ne démarre pas ?

```bash
# Réinstaller dépendances
npm install

# Vérifier erreurs
npm run build
```

---

## 📊 CE QUI A ÉTÉ FAIT AUJOURD'HUI

```
✅ 11 tables base de données
✅ 19 hooks React
✅ 20+ types TypeScript
✅ Type "Cours" dans l'UI
✅ 3 routes configurées
✅ Composant CourseCard
✅ 2,500+ lignes documentation
```

**Total** : ~4,660 lignes de code professionnel

---

## 🚀 PROCHAINE SESSION

Une fois que vous avez validé les 3 étapes :

**Je créerai** :
1. Formulaire complet création cours
2. Upload vidéos (avec progress bar)
3. Curriculum builder (drag & drop)
4. Preview cours

**Durée estimée** : 1 journée de dev

---

**Questions ?** → Demandez-moi dans le chat ! 💬

