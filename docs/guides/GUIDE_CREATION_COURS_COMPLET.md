# 🎓 GUIDE COMPLET - CRÉER UN COURS SUR PAYHUK

---

**Date** : 27 Octobre 2025  
**Version** : 2.0 - Intégration complète  
**Statut** : ✅ Fonctionnel

---

## 🎯 FLUX DE CRÉATION DE COURS

### Le flux complet est maintenant :

```
1. /dashboard/products/new
   ↓
2. Sélectionner "Cours en ligne" 🎓
   ↓
3. Cliquer "Suivant"
   ↓
4. Wizard de création de cours (4 étapes)
   ├─ Étape 1: Informations de base
   ├─ Étape 2: Curriculum (sections/leçons)
   ├─ Étape 3: Configuration (prix, certificat)
   └─ Étape 4: Révision finale
   ↓
5. Publier le cours ✅
```

---

## 🚀 COMMENT CRÉER UN COURS (ÉTAPE PAR ÉTAPE)

### ÉTAPE 1 : Accéder à la création de produit

1. **Lancer l'application** :
   ```bash
   npm run dev
   ```

2. **Aller sur** : http://localhost:8081/dashboard/products/new

3. **Résultat attendu** :
   ```
   ┌────────────────────────────────────────────────┐
   │  ✨ Assistant de création de produit          │
   │  Étape 1 sur 4 - Créez votre produit          │
   ├────────────────────────────────────────────────┤
   │  Quel type de produit vendez-vous ?           │
   │                                                │
   │  [📱 Digital]  [🎓 Cours]  [📦 Physique]  [🔧] │
   │                   ↑                            │
   │               NOUVEAU !                        │
   └────────────────────────────────────────────────┘
   ```

---

### ÉTAPE 2 : Sélectionner le type "Cours en ligne"

1. **Cliquer sur la carte "Cours en ligne"** 🎓

2. **Vérifier** :
   - ✅ La carte devient orange/highlighted
   - ✅ Badge "Sélectionné" apparaît
   - ✅ Description : "Cours vidéo, masterclass, formations structurées"

3. **Cliquer sur "Suivant"**

---

### ÉTAPE 3 : Wizard de création de cours s'affiche

**Vous devriez voir** :

```
┌──────────────────────────────────────────────────┐
│  Créer un nouveau cours                  🎓      │
│  Suivez les étapes pour créer un cours           │
├──────────────────────────────────────────────────┤
│  Étape 1 sur 4                    25% complété   │
│  ████░░░░░░░░                                   │
│                                                  │
│  [1] ← Informations de base                     │
│  [2]   Curriculum                               │
│  [3]   Configuration                            │
│  [4]   Révision                                 │
│                                                  │
│  ┌─ Informations de base ──────────────┐        │
│  │ Titre: [                            ]│        │
│  │ Description: [                      ]│        │
│  │ Niveau: [Sélectionner ▼]           │        │
│  └─────────────────────────────────────┘        │
│                                                  │
│  [Sauvegarder brouillon]     [Suivant →]       │
└──────────────────────────────────────────────────┘
```

---

### ÉTAPE 4 : Remplir les informations de base

**Champs à remplir** :

1. **Titre du cours** (requis)
   - Exemple : "Maîtriser React et TypeScript en 2025"
   - ✅ Le slug se génère automatiquement

2. **Description courte** (requis)
   - Exemple : "Apprenez React.js et TypeScript de A à Z"
   - Max 200 caractères

3. **Description complète** (requis)
   - Exemple détaillé de ce que les étudiants apprendront
   - Max 2000 caractères

4. **Niveau** (requis)
   - Choix : Débutant / Intermédiaire / Avancé / Tous niveaux

5. **Langue** (requis)
   - Choix : 🇫🇷 Français / 🇬🇧 Anglais / 🇪🇸 Espagnol / 🇵🇹 Portugais

6. **Catégorie** (requis)
   - Choix : Développement Web, Design, Marketing, etc.

**Cliquer "Suivant"**

---

### ÉTAPE 5 : Créer le curriculum

**Actions** :

1. **Cliquer "Ajouter une section"**
   - Titre : "Introduction"
   - Description : (optionnel)
   - Cliquer "Enregistrer"

2. **Cliquer "Ajouter une leçon"** (dans la section)
   - Titre : "Bienvenue dans le cours"
   - URL vidéo : https://youtube.com/watch?v=abc123
   - Cliquer "Enregistrer"

3. **Répéter** pour créer plusieurs sections et leçons
   - Exemple : 3 sections avec 3-4 leçons chacune

4. **Vérifier les statistiques** :
   - Nombre de sections
   - Nombre total de leçons
   - Durée totale (calculée automatiquement)

**Cliquer "Suivant"**

---

### ÉTAPE 6 : Configuration avancée

**Remplir** :

1. **Prix** :
   - Prix : 25000
   - Devise : XOF
   - Prix promotionnel (optionnel) : 20000
   - ✅ La réduction s'affiche automatiquement (20%)

2. **Certificat** :
   - Toggle : Activé
   - Score minimum : 80%

3. **Objectifs d'apprentissage** :
   - Taper : "Créer une application React moderne"
   - Appuyer sur Enter ou cliquer +
   - Répéter pour 3-5 objectifs

4. **Prérequis** :
   - Exemple : "Connaissances de base en JavaScript"

5. **Public cible** :
   - Exemple : "Développeurs débutants"

**Cliquer "Suivant"**

---

### ÉTAPE 7 : Révision finale

**Vérifier** :

- ✅ Informations de base (titre, niveau, langue, catégorie)
- ✅ Curriculum (nombre de sections et leçons)
- ✅ Configuration (prix, certificat, objectifs)

**Si tout est correct** :

**Cliquer "Publier le cours"** ✅

---

## ✅ RÉSULTATS ATTENDUS

### Après publication :

1. ✅ Message de succès : "Cours créé !"
2. ✅ Redirection vers `/dashboard/courses` (ou `/dashboard/products`)
3. ✅ Le cours apparaît dans la liste des produits
4. ✅ Le cours est visible sur la marketplace (si publié)

---

## 🧪 CHECKLIST DE TEST

### Avant de tester :

- [ ] Application lancée (`npm run dev`)
- [ ] Connecté avec un compte utilisateur
- [ ] Boutique créée

### Tests à effectuer :

1. **Test 1 : Accès à la page**
   - [ ] Aller sur `/dashboard/products/new`
   - [ ] 4 types de produits visibles
   - [ ] Type "Cours en ligne" visible avec icône 🎓

2. **Test 2 : Sélection du type**
   - [ ] Cliquer sur "Cours en ligne"
   - [ ] Carte devient orange
   - [ ] Badge "Sélectionné" apparaît

3. **Test 3 : Passage au wizard de cours**
   - [ ] Cliquer "Suivant"
   - [ ] Wizard de création de cours s'affiche
   - [ ] 4 étapes visibles dans le stepper

4. **Test 4 : Informations de base**
   - [ ] Remplir tous les champs requis
   - [ ] Slug se génère automatiquement
   - [ ] Compteurs de caractères fonctionnent
   - [ ] Validation empêche de continuer si champs vides

5. **Test 5 : Curriculum**
   - [ ] Créer 2-3 sections
   - [ ] Ajouter 3-4 leçons par section
   - [ ] Édition inline fonctionne
   - [ ] Plier/déplier sections fonctionne
   - [ ] Statistiques mises à jour en temps réel

6. **Test 6 : Configuration**
   - [ ] Définir prix
   - [ ] Prix promotionnel calcule la réduction
   - [ ] Toggle certificat fonctionne
   - [ ] Ajouter objectifs/prérequis/public cible

7. **Test 7 : Révision**
   - [ ] Toutes les informations affichées correctement
   - [ ] Navigation "Précédent" conserve les données
   - [ ] Bouton "Publier le cours" visible

8. **Test 8 : Publication**
   - [ ] Cliquer "Publier le cours"
   - [ ] Message de succès
   - [ ] Redirection fonctionne

---

## 🐛 PROBLÈMES POSSIBLES & SOLUTIONS

### Problème 1 : Type "Cours" non visible

**Cause** : Cache navigateur  
**Solution** :
```
Ctrl + Shift + R (vider cache et recharger)
```

---

### Problème 2 : Wizard de cours ne s'affiche pas

**Cause** : Condition non remplie  
**Solution** :
1. Vérifier que "Cours en ligne" est bien sélectionné
2. Vérifier la console pour erreurs
3. Recharger la page

---

### Problème 3 : Erreur "Cannot read property..."

**Cause** : Import manquant  
**Solution** :
```bash
# Redémarrer le serveur
npm run dev
```

---

### Problème 4 : Validation ne passe pas

**Cause** : Champs requis vides  
**Solution** :
- Vérifier que TOUS les champs avec * sont remplis
- Vérifier les messages d'erreur en rouge

---

## 📊 DIFFÉRENCES AVEC ANCIEN SYSTÈME

### Avant (❌ Ne fonctionne plus) :

```
/dashboard/courses/new
```

### Maintenant (✅ Nouveau flux) :

```
/dashboard/products/new → Sélectionner "Cours" → Wizard
```

---

## 🎯 AVANTAGES DU NOUVEAU SYSTÈME

### Pour les instructeurs :

1. ✅ **Flux unifié** : Tous les produits au même endroit
2. ✅ **Wizard guidé** : Étapes claires
3. ✅ **Validation temps réel** : Moins d'erreurs
4. ✅ **Révision finale** : Vérifier avant publication
5. ✅ **Professionnel** : Interface moderne

### Pour la plateforme :

1. ✅ **Cohérence** : Même expérience pour tous types
2. ✅ **Maintenabilité** : Code modulaire
3. ✅ **Scalabilité** : Facile d'ajouter nouveaux types
4. ✅ **Analytics** : Tracking du funnel de création

---

## 🔄 PROCHAINES AMÉLIORATIONS

### Court terme (à venir) :

- 🔄 Upload vidéos réel (actuellement URL seulement)
- 🔄 Sauvegarde automatique (toutes les 30s)
- 🔄 Aperçu en temps réel
- 🔄 Templates de cours

### Moyen terme :

- 🔄 Drag & drop sections/leçons
- 🔄 Import depuis Google Drive
- 🔄 Génération thumbnails auto
- 🔄 IA pour suggestions

---

## 📚 RESSOURCES

### Documentation :

- `SUCCES_PHASE_2.md` - Guide complet Phase 2
- `PROGRESSION_PHASE_2.md` - Suivi détaillé
- `README_COURS.md` - Vue d'ensemble

### Code source :

- `src/components/products/ProductForm.tsx` - Formulaire principal
- `src/components/products/ProductCreationWizard.tsx` - Wizard classique
- `src/components/courses/create/CreateCourseWizard.tsx` - Wizard cours

---

## ✅ VALIDATION FINALE

### Le système est opérationnel si :

- [x] Type "Cours en ligne" visible dans `/dashboard/products/new`
- [x] Sélection du type fonctionne
- [x] Wizard de cours s'affiche après "Suivant"
- [x] 4 étapes visibles et navigables
- [x] Validation fonctionne
- [x] Formulaires réactifs

---

## 🎓 EXEMPLE COMPLET

### Cours de démonstration :

```
Titre: "Maîtriser React et TypeScript"
Slug: maitriser-react-et-typescript
Description courte: "Apprenez React.js et TypeScript de A à Z"
Niveau: Débutant
Langue: Français
Catégorie: Développement Web

Curriculum:
  Section 1: Introduction (3 leçons)
    - Bienvenue
    - Setup environnement
    - Premier composant
    
  Section 2: Les bases (4 leçons)
    - Variables et types
    - Fonctions
    - Composants
    - Props et State

Prix: 25000 XOF
Prix promo: 20000 XOF
Certificat: Activé (80% requis)
Objectifs: 3 objectifs définis
Prérequis: JavaScript de base
```

---

**🎉 FÉLICITATIONS ! VOUS ÊTES PRÊT À CRÉER VOTRE PREMIER COURS ! 🎉**

---

**Document créé le** : 27 Octobre 2025  
**Dernière mise à jour** : 27 Octobre 2025 à 02:30  
**Statut** : ✅ Système opérationnel

