# 🧪 GUIDE DE TEST - PHASE 4 : PAGE DE DÉTAIL DU COURS

**Date** : 27 octobre 2025  
**Phase** : Phase 4 - Test de la page de détail  
**Objectif** : Vérifier que tout fonctionne parfaitement

---

## 📋 PRÉREQUIS

Avant de commencer les tests, assurez-vous que :

1. ✅ La migration SQL est exécutée (`20251027_courses_system_complete.sql`)
2. ✅ Le bucket `videos` est créé dans Supabase Storage
3. ✅ Les 4 RLS policies sont configurées
4. ✅ L'application tourne sur http://localhost:8082/

---

## 🎯 TEST COMPLET - SCÉNARIO RÉEL

### ÉTAPE 1 : Créer un cours de test

1. **Se connecter** à l'application
2. **Aller** sur `/dashboard/products/new`
3. **Sélectionner** "Cours en ligne"
4. **Remplir** le formulaire :

```
📝 INFORMATIONS DE BASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Titre : Formation React Complète
Slug : formation-react-complete
Description courte : Apprenez React de A à Z
Description complète : Un cours complet...
Niveau : Intermédiaire
Langue : Français
Catégorie : Programmation

📚 CURRICULUM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Section 1 : Introduction
  └─ Leçon 1 : Qu'est-ce que React ?
       Type : YouTube
       URL : https://www.youtube.com/watch?v=dQw4w9WgXcQ
       Durée : 300
       ✅ Aperçu gratuit
  
  └─ Leçon 2 : Installation de React
       Type : YouTube
       URL : https://www.youtube.com/watch?v=dQw4w9WgXcQ
       Durée : 480
       🔒 Pas d'aperçu

Section 2 : Les Bases
  └─ Leçon 3 : Les Composants
       Type : Google Drive
       URL : https://drive.google.com/file/d/[ID]/view
       Durée : 600
       🔒 Pas d'aperçu

💰 CONFIGURATION AVANCÉE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prix : 15000
Prix promo : 9900
Monnaie : XOF
✅ Activer certificat

Objectifs d'apprentissage :
  • Maîtriser React
  • Créer des applications modernes
  • Comprendre les hooks

Prérequis :
  • Connaissances en JavaScript
  • HTML et CSS de base

Public cible :
  • Développeurs débutants
  • Étudiants en informatique
```

4. **Cliquer** "Publier le cours"
5. ✅ Attendre confirmation

---

### ÉTAPE 2 : Accéder à la page de détail

1. **Copier** le slug : `formation-react-complete`
2. **Aller** sur : `http://localhost:8082/courses/formation-react-complete`
3. ✅ La page doit se charger

---

### ÉTAPE 3 : Vérifier le Hero Section

```
┌─────────────────────────────────────────────────┐
│  🎨 HERO SECTION - Gradient Orange              │
│                                                  │
│  [x] Badge catégorie affiché                    │
│  [x] Titre du cours visible                     │
│  [x] Description courte affichée                │
│  [x] Stats (⭐ notes, 👥 étudiants, etc.)       │
│  [x] Informations instructeur                   │
└─────────────────────────────────────────────────┘
```

**Checklist Hero** :
- [ ] Badge "Programmation" visible
- [ ] Titre "Formation React Complète" affiché
- [ ] Description courte lisible
- [ ] ⭐ Note et nombre d'avis
- [ ] 👥 Nombre d'étudiants (0 si nouveau)
- [ ] ⏱️ Durée totale en minutes
- [ ] 📚 Nombre total de leçons (3)
- [ ] 🌐 Langue (Français)
- [ ] 👤 Nom du store/instructeur

---

### ÉTAPE 4 : Vérifier le Lecteur Vidéo

```
┌─────────────────────────────────────────────────┐
│  📹 LECTEUR VIDÉO                               │
│                                                  │
│  [x] Vidéo preview chargée (Leçon 1)            │
│  [x] Ratio 16:9 maintenu                        │
│  [x] Contrôles visibles                         │
│  [x] Titre de la leçon affiché                  │
│  [x] Alert "Aperçu gratuit" visible             │
└─────────────────────────────────────────────────┘
```

**Actions à tester** :
1. **Cliquer** sur Play
   - [ ] La vidéo démarre
   - [ ] Contrôles fonctionnent (pause, volume, fullscreen)

2. **Vérifier** l'alert sous la vidéo
   - [ ] Message "Ceci est un aperçu gratuit. Inscrivez-vous..."

---

### ÉTAPE 5 : Vérifier la Description

```
┌─────────────────────────────────────────────────┐
│  📄 À PROPOS DE CE COURS                        │
│                                                  │
│  [x] Description complète affichée              │
│  [x] Formatage correct (whitespace-pre-line)    │
└─────────────────────────────────────────────────┘
```

---

### ÉTAPE 6 : Vérifier les Objectifs d'Apprentissage

```
┌─────────────────────────────────────────────────┐
│  🎯 CE QUE VOUS ALLEZ APPRENDRE                 │
│                                                  │
│  [x] Icône Target visible                       │
│  [x] Liste à 2 colonnes (desktop)               │
│  [x] Chaque objectif a une ✅ CheckCircle2      │
│  [x] 3 objectifs affichés                       │
└─────────────────────────────────────────────────┘
```

**Vérifier** :
- [ ] ✅ Maîtriser React
- [ ] ✅ Créer des applications modernes
- [ ] ✅ Comprendre les hooks

---

### ÉTAPE 7 : Vérifier les Prérequis

```
┌─────────────────────────────────────────────────┐
│  💡 PRÉREQUIS                                   │
│                                                  │
│  [x] Icône Lightbulb visible                    │
│  [x] Liste avec bullet points orange            │
│  [x] 2 prérequis affichés                       │
└─────────────────────────────────────────────────┘
```

**Vérifier** :
- [ ] • Connaissances en JavaScript
- [ ] • HTML et CSS de base

---

### ÉTAPE 8 : Vérifier le Curriculum (CRITIQUE !)

```
┌─────────────────────────────────────────────────┐
│  📚 CONTENU DU COURS                            │
│                                                  │
│  [x] Titre avec icône FileText                  │
│  [x] Stats (0/3 leçons, durée totale)           │
│  [x] Sections collapsibles                      │
└─────────────────────────────────────────────────┘
```

#### Test Section 1 : Introduction
1. **Vérifier** la section
   - [ ] Badge "Section 1"
   - [ ] Titre "Introduction"
   - [ ] "2 leçons"
   - [ ] Icône chevron (▼ ou ▲)

2. **Vérifier** Leçon 1 (Preview)
   - [ ] Icône ▶️ PlayCircle (orange)
   - [ ] Titre "1. Qu'est-ce que React ?"
   - [ ] Badge "Aperçu gratuit"
   - [ ] Durée "5:00"
   - [ ] Hover effect

3. **Cliquer** sur Leçon 1
   - [ ] Vidéo change dans le lecteur
   - [ ] Badge "En cours" apparaît
   - [ ] Background orange clair

4. **Vérifier** Leçon 2 (Verrouillée si non inscrit)
   - [ ] Icône 🔒 Lock (grise)
   - [ ] Titre "2. Installation de React"
   - [ ] PAS de badge "Aperçu gratuit"
   - [ ] Durée "8:00"
   - [ ] Opacity réduite (opacity-60)
   - [ ] Pas cliquable (cursor normal)

#### Test Section 2 : Les Bases
1. **Cliquer** pour déplier
   - [ ] Section s'ouvre/ferme

2. **Vérifier** Leçon 3 (Google Drive)
   - [ ] Icône 🔒 Lock
   - [ ] Titre "3. Les Composants"
   - [ ] Durée "10:00"

---

### ÉTAPE 9 : Vérifier la Sidebar (Sticky)

```
┌─────────────────────────────────────────────────┐
│  💳 SIDEBAR - INSCRIPTION                       │
│                                                  │
│  [x] Prix affiché                               │
│  [x] Prix promo si applicable                   │
│  [x] Bouton CTA                                 │
│  [x] Liste des inclusions                       │
│  [x] Niveau et langue                           │
└─────────────────────────────────────────────────┘
```

#### Prix et Promotion
- [ ] Prix barré : 15,000 XOF
- [ ] Prix promo (gros) : 9,900 XOF
- [ ] Badge "Promotion !"

#### Bouton CTA (Non inscrit)
- [ ] Texte : "🛒 S'inscrire maintenant"
- [ ] Couleur : bg-orange-600
- [ ] Taille : lg

**Test** : Cliquer sur le bouton
- [ ] Toast apparaît
- [ ] Message : "Inscription au cours"
- [ ] Description : "Fonctionnalité en cours de développement..."

#### Ce cours inclut
- [ ] ▶️ 3 leçons vidéo
- [ ] ⏱️ 0h 23m de contenu
- [ ] 🏆 Certificat de completion
- [ ] 📈 Accès à vie

#### Niveau & Langue
- [ ] Badge "intermédiaire"
- [ ] Badge "français"

---

### ÉTAPE 10 : Tests de Navigation

#### Test 1 : Changer de leçon
1. **Cliquer** sur "Leçon 1" (preview)
   - [ ] Vidéo YouTube chargée
   - [ ] Badge "En cours" sur Leçon 1

2. **Re-cliquer** sur "Leçon 1"
   - [ ] Rien ne change (déjà active)

3. **Essayer** de cliquer sur "Leçon 2" (verrouillée)
   - [ ] Rien ne se passe (pas cliquable)

---

### ÉTAPE 11 : Tests Responsive (Mobile)

1. **Ouvrir** DevTools (F12)
2. **Activer** le mode responsive
3. **Sélectionner** "iPhone 12 Pro"

**Vérifier** :
- [ ] Hero responsive (stack vertical)
- [ ] Lecteur vidéo 16:9 maintenu
- [ ] Sidebar en dessous du contenu principal
- [ ] Curriculum lisible
- [ ] Boutons accessibles
- [ ] Pas de scroll horizontal

---

### ÉTAPE 12 : Tests de Performance

1. **Ouvrir** Lighthouse (DevTools > Lighthouse)
2. **Générer** un rapport (Desktop)

**Objectifs** :
- [ ] Performance > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90

---

## 🐛 TESTS D'ERREURS

### Test Erreur 1 : Cours inexistant
1. **Aller** sur `/courses/cours-qui-nexiste-pas`
2. ✅ Alert error s'affiche
3. ✅ Message : "Cours non trouvé"
4. ✅ Bouton "Retour à la marketplace"

### Test Erreur 2 : Vidéo YouTube invalide
1. **Créer** une leçon avec URL invalide
2. ✅ Message d'erreur dans le lecteur
3. ✅ "URL YouTube invalide"

---

## ✅ CHECKLIST FINALE

### Affichage
- [ ] Hero section complète
- [ ] Lecteur vidéo fonctionnel
- [ ] Description lisible
- [ ] Objectifs affichés
- [ ] Prérequis affichés
- [ ] Curriculum interactif
- [ ] Sidebar sticky
- [ ] Responsive (mobile)

### Interactions
- [ ] Clic sur leçon preview → vidéo change
- [ ] Clic sur leçon verrouillée → rien
- [ ] Clic "S'inscrire" → toast
- [ ] Sections collapse/expand
- [ ] Navigation fluide

### Types de Vidéos
- [ ] YouTube fonctionne
- [ ] Vimeo fonctionne
- [ ] Google Drive fonctionne
- [ ] Upload direct fonctionne

### Erreurs
- [ ] Cours inexistant géré
- [ ] URL vidéo invalide gérée
- [ ] Skeleton loading affiché

---

## 📊 RÉSULTATS ATTENDUS

Si **TOUS** les tests passent :

```
╔═══════════════════════════════════════════════╗
║                                               ║
║      ✅  PHASE 4 : VALIDÉE !  ✅              ║
║                                               ║
║  Page de détail du cours 100% fonctionnelle   ║
║                                               ║
║  Prochaine étape : Phase 5                    ║
║  (Progression utilisateur)                    ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

---

## 🆘 EN CAS DE PROBLÈME

### Problème 1 : Page blanche
**Solution** :
1. Vérifier la console (F12)
2. Lire l'erreur
3. Vérifier que le slug du cours est correct
4. Vérifier que le produit existe dans `products`
5. Vérifier que le cours existe dans `courses`

### Problème 2 : Vidéo ne charge pas
**Solution** :
1. Vérifier le `video_type` de la leçon
2. Vérifier que `video_url` est valide
3. Tester l'URL dans un navigateur
4. Vérifier la console pour erreurs

### Problème 3 : Curriculum vide
**Solution** :
1. Vérifier que les sections sont créées
2. Vérifier que les leçons sont associées aux sections
3. Vérifier dans Supabase :
   - Table `course_sections`
   - Table `course_lessons`

### Problème 4 : Sidebar pas sticky
**Solution** :
1. Vérifier le CSS `sticky top-4`
2. Vérifier que le parent n'a pas `overflow: hidden`

---

## 📸 CAPTURES D'ÉCRAN ATTENDUES

### Vue Desktop
```
┌─────────────────────────────────────────────────┐
│  HERO (Gradient Orange)                         │
│  Titre + Stats + Instructeur                    │
└─────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────┐
│  📹 Lecteur Vidéo        │  💳 Sidebar          │
│  ▼                       │  ▼                   │
│  16:9                    │  Prix: 9,900 XOF     │
│  Contrôles               │  [S'inscrire]        │
├──────────────────────────┤  Inclusions          │
│  📄 Description          │  Niveau              │
├──────────────────────────┤  Langue              │
│  🎯 Objectifs            │                      │
├──────────────────────────┤                      │
│  💡 Prérequis            │                      │
├──────────────────────────┤                      │
│  📚 Curriculum           │                      │
│  ├─ Section 1            │                      │
│  │  ├─ Leçon 1 ▶️       │                      │
│  │  └─ Leçon 2 🔒       │                      │
│  └─ Section 2            │                      │
│     └─ Leçon 3 🔒       │                      │
└──────────────────────────┴──────────────────────┘
```

### Vue Mobile
```
┌─────────────────────┐
│  HERO               │
│  (Stack vertical)   │
├─────────────────────┤
│  📹 Lecteur         │
├─────────────────────┤
│  📄 Description     │
├─────────────────────┤
│  🎯 Objectifs       │
├─────────────────────┤
│  💡 Prérequis       │
├─────────────────────┤
│  📚 Curriculum      │
├─────────────────────┤
│  💳 Sidebar         │
│  (En dessous)       │
└─────────────────────┘
```

---

## 🎓 CONCLUSION

Ce guide vous permet de tester **100%** des fonctionnalités de la Phase 4.

**Temps estimé** : 15-20 minutes

**Bonne chance !** 🍀

---

**Auteur** : Intelli / payhuk02  
**Date** : 27 octobre 2025  
**Version** : 1.0

