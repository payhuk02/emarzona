# 🧪 GUIDE DE TEST - PHASE 5 : PROGRESSION UTILISATEUR

**Date** : 27 octobre 2025  
**Phase** : Phase 5 - Système de progression  
**Objectif** : Tester toutes les fonctionnalités de progression

---

## 📋 PRÉREQUIS

Avant de commencer, assurez-vous que :

1. ✅ Vous avez un compte utilisateur
2. ✅ Vous avez créé au moins 1 cours (via Phase 2)
3. ✅ Vous êtes inscrit à ce cours (créer manuellement l'enrollment dans Supabase)
4. ✅ L'application tourne sur http://localhost:8082/

---

## 🎯 TEST 1 : Sauvegarde Automatique de Position Vidéo

### Objectif
Vérifier que la position vidéo est sauvegardée automatiquement.

### Étapes
1. **Aller** sur un cours : `/courses/formation-react`
2. **Vérifier** que vous êtes inscrit
3. **Lancer** une vidéo (type "upload" uniquement)
4. **Regarder** pendant ~30 secondes
5. **Noter** la position actuelle (ex: 0:32)
6. **Attendre** 10 secondes (sauvegarde auto)
7. **Fermer** complètement la page
8. **Revenir** sur `/courses/formation-react`

### Résultat attendu
- ✅ La vidéo reprend automatiquement à la position ~0:32
- ✅ Pas besoin de rembobiner
- ✅ Message bleu: "Vous reprenez là où vous vous êtes arrêté"

### ⚠️ Note
La sauvegarde automatique fonctionne SEULEMENT pour les vidéos "upload" (Supabase Storage), pas pour YouTube/Vimeo/Drive.

---

## 🎯 TEST 2 : Marquer une Leçon comme Complétée

### Objectif
Tester le bouton de complétion de leçon.

### Étapes
1. **Aller** sur un cours
2. **Vérifier** la barre de progression en haut (ex: 0%)
3. **Regarder** une leçon
4. **Cliquer** sur "Marquer comme complétée"

### Résultat attendu
- ✅ Toast apparaît : "Leçon complétée ! 🎉"
- ✅ Bouton devient vert : "✓ Leçon complétée"
- ✅ Bouton devient désactivé (pas cliquable)
- ✅ Barre de progression se met à jour (ex: 0% → 7%)
- ✅ Stats changent (ex: 0/15 → 1/15)

### Screenshot attendu
```
┌────────────────────────────────────┐
│  🏆 Votre progression         7%   │
│  ██░░░░░░░░░░░░░░░░░░░░░░░░        │
│  ✅ 1 / 15 leçons complétées       │
│  "Vous venez de commencer..."      │
└────────────────────────────────────┘

[ ✓ Leçon complétée ]  <- Vert, désactivé
```

---

## 🎯 TEST 3 : Progression Multiple

### Objectif
Tester la progression avec plusieurs leçons.

### Étapes
1. **Marquer** 5 leçons comme complétées
2. **Observer** la barre de progression

### Résultat attendu
- ✅ Barre : 33% (5/15)
- ✅ Message: "Bon début ! Vous êtes sur la bonne voie."

### Progression des messages
```
0-25%   : "Vous venez de commencer, continuez comme ça !"
25-50%  : "Bon début ! Vous êtes sur la bonne voie."
50-75%  : "Plus de la moitié ! Vous y êtes presque."
75-100% : "Dernière ligne droite ! Ne lâchez rien."
100%    : "Cours terminé ! 🎉"
```

---

## 🎯 TEST 4 : Dashboard "Mes Cours"

### Objectif
Vérifier l'affichage du dashboard étudiant.

### Étapes
1. **Aller** sur `/dashboard/my-courses`
2. **Observer** les statistiques
3. **Observer** les cartes de cours

### Résultat attendu

#### Statistiques
```
┌──────────────┬──────────────┬──────────────┐
│ Total cours  │  En cours    │  Terminés    │
│    📚 1      │   📈 1       │   🏆 0       │
└──────────────┴──────────────┴──────────────┘
```

#### Carte de cours
- ✅ Image du cours (ou icône 🎓 si pas d'image)
- ✅ Badge "En cours" (orange)
- ✅ Titre : "Formation React Complète"
- ✅ Description courte
- ✅ Barre de progression : 33%
- ✅ Stats : "5/15 leçons"
- ✅ Stats : "📚 15 leçons | ⏱️ 3h 0m"
- ✅ Bouton : "▶️ Continuer"

---

## 🎯 TEST 5 : "Reprendre où on s'est arrêté"

### Objectif
Tester la fonctionnalité de reprise automatique.

### Étapes
1. **Aller** sur un cours
2. **Regarder** la leçon 3
3. **Cliquer** sur "Marquer comme complétée" (important !)
4. **Quitter** le cours (aller ailleurs)
5. **Revenir** via Dashboard → "Continuer"

### Résultat attendu
- ✅ Page `/courses/formation-react` se charge
- ✅ **Leçon 3** est automatiquement sélectionnée (pas la 1)
- ✅ Message bleu apparaît :
  ```
  ℹ️ Vous reprenez là où vous vous êtes arrêté : Leçon 3 - Les Composants
  ```
- ✅ Vidéo de la leçon 3 commence à jouer

---

## 🎯 TEST 6 : Boutons CTA Intelligents

### Objectif
Vérifier que les boutons changent selon la progression.

### Test 6.1 : Cours à 0%
```
Dashboard → Carte cours
Bouton : "▶️ Commencer"
```

### Test 6.2 : Cours à 33%
```
Dashboard → Carte cours
Bouton : "▶️ Continuer"
```

### Test 6.3 : Cours à 100%
```
1. Marquer toutes les 15 leçons comme complétées
2. Aller sur Dashboard
3. Carte montre :
   - Badge : "🏆 Terminé" (vert)
   - Barre : 100%
   - Bouton : "▶️ Revoir le cours"
4. Stats :
   - Terminés : 1
```

---

## 🎯 TEST 7 : Messages d'Encouragement

### Objectif
Vérifier que les messages changent selon le %.

### Test
Marquer des leçons une par une et observer le message sous la barre.

### Résultats attendus
```
5% (1/15)   : "Vous venez de commencer, continuez comme ça !"
33% (5/15)  : "Bon début ! Vous êtes sur la bonne voie."
60% (9/15)  : "Plus de la moitié ! Vous y êtes presque."
87% (13/15) : "Dernière ligne droite ! Ne lâchez rien."
100%(15/15) : "🏆 Cours terminé ! 🎉"
```

---

## 🎯 TEST 8 : État Vide du Dashboard

### Objectif
Tester l'affichage quand aucun cours.

### Étapes
1. **Se connecter** avec un compte sans cours
2. **Aller** sur `/dashboard/my-courses`

### Résultat attendu
```
┌─────────────────────────────────────┐
│          🎓                         │
│  Aucun cours pour le moment         │
│                                     │
│  Explorez notre catalogue et        │
│  inscrivez-vous à votre premier     │
│  cours !                            │
│                                     │
│  [Explorer les cours]               │
└─────────────────────────────────────┘
```

Stats :
```
Total : 0 | En cours : 0 | Terminés : 0
```

---

## 🎯 TEST 9 : Responsive (Mobile)

### Objectif
Vérifier que tout fonctionne sur mobile.

### Étapes
1. **Ouvrir** DevTools (F12)
2. **Mode** responsive
3. **iPhone 12 Pro**
4. **Tester** :
   - Dashboard
   - Barre de progression
   - Bouton de complétion
   - Cartes de cours

### Résultat attendu
- ✅ Dashboard : Cards en colonne (1 par ligne)
- ✅ Stats : Grid responsive
- ✅ Barre progression : Visible et lisible
- ✅ Boutons : Taille adaptée au touch
- ✅ Pas de scroll horizontal

---

## 🎯 TEST 10 : Performance de Sauvegarde

### Objectif
Vérifier que la sauvegarde n'impacte pas les performances.

### Étapes
1. **Ouvrir** DevTools → Network
2. **Filtrer** par "course_lesson_progress"
3. **Regarder** une vidéo pendant 1 minute
4. **Observer** les requêtes

### Résultat attendu
- ✅ 1 requête toutes les ~10 secondes
- ✅ Requêtes rapides (<200ms)
- ✅ Pas de spam de requêtes
- ✅ Vidéo ne lag pas

---

## 🎯 TEST 11 : Invalidation du Cache

### Objectif
Vérifier que le cache React Query s'invalide correctement.

### Étapes
1. **Regarder** une leçon
2. **Marquer** comme complétée
3. **Ouvrir** un autre onglet
4. **Aller** sur Dashboard
5. **Observer** la progression

### Résultat attendu
- ✅ Progression à jour sur les 2 onglets
- ✅ Pas besoin de rafraîchir
- ✅ Real-time sync

---

## 🎯 TEST 12 : Navigation Entre Leçons

### Objectif
Tester que la progression se met à jour quand on change de leçon.

### Étapes
1. **Sur** page cours
2. **Regarder** leçon 1
3. **Marquer** complétée
4. **Cliquer** sur leçon 2 dans le curriculum
5. **Marquer** complétée
6. **Observer** la barre

### Résultat attendu
- ✅ Barre : 0% → 7% → 13%
- ✅ Bouton de complétion se réinitialise pour leçon 2
- ✅ Après complétion leçon 2, redevient vert
- ✅ Leçon 1 montre ✓ dans curriculum
- ✅ Leçon 2 montre ✓ dans curriculum

---

## ✅ CHECKLIST GLOBALE

### Fonctionnalités
- [ ] Sauvegarde automatique position (10s)
- [ ] Restauration position au chargement
- [ ] Marquer leçon complétée (1 clic)
- [ ] Toast de confirmation
- [ ] Barre de progression s'actualise
- [ ] Messages d'encouragement changent
- [ ] Dashboard affiche cours
- [ ] Stats correctes (total/en cours/terminés)
- [ ] Cartes cours avec progression
- [ ] Boutons CTA intelligents
- [ ] "Reprendre où on s'arrête"
- [ ] Message bleu d'indication
- [ ] État vide dashboard

### UX
- [ ] Pas de lag lors sauvegarde
- [ ] Transitions fluides
- [ ] Feedback visuel clair
- [ ] Messages pertinents
- [ ] Responsive mobile
- [ ] Icons cohérentes

### Technique
- [ ] Aucune erreur console
- [ ] Cache React Query fonctionne
- [ ] Requêtes optimisées
- [ ] Pas de spam réseau
- [ ] RLS policies respectées

---

## 📊 RÉSULTATS ATTENDUS

Si **TOUS** les tests passent :

```
╔═══════════════════════════════════════════════╗
║                                               ║
║      ✅  PHASE 5 : VALIDÉE !  ✅              ║
║                                               ║
║  Système de progression 100% fonctionnel      ║
║                                               ║
║  Prochaine étape : Phase 6                    ║
║  (Quiz et certificats)                        ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

---

## 🆘 EN CAS DE PROBLÈME

### Problème 1 : Position vidéo ne se sauvegarde pas
**Solutions** :
1. Vérifier que `enrollmentId` et `lessonId` sont passés au VideoPlayer
2. Vérifier que le type vidéo est "upload" (pas youtube/vimeo)
3. Ouvrir Network → voir si requêtes "course_lesson_progress"
4. Vérifier console pour erreurs

### Problème 2 : Bouton "Marquer complété" ne fonctionne pas
**Solutions** :
1. Vérifier fonction SQL `mark_lesson_complete` existe
2. Vérifier RLS policies sur `course_lesson_progress`
3. Vérifier console pour erreurs
4. Vérifier que `enrollmentId` est correct

### Problème 3 : Barre progression ne s'actualise pas
**Solutions** :
1. Vérifier invalidation cache React Query
2. Rafraîchir manuellement la page
3. Vérifier que `total_lessons` est correct

### Problème 4 : Dashboard vide alors que j'ai des cours
**Solutions** :
1. Vérifier table `course_enrollments`
2. Vérifier que `status = 'active'`
3. Vérifier que `user_id` correspond
4. Vérifier console pour erreurs

### Problème 5 : "Reprendre..." ne fonctionne pas
**Solutions** :
1. S'assurer qu'une leçon a été marquée complétée
2. Vérifier table `course_lesson_progress`
3. Vérifier que `updated_at` est bien mis à jour
4. Vérifier hook `useCourseDetail`

---

## 📸 SCREENSHOTS ATTENDUS

### Dashboard
```
┌─────────────────────────────────────────────┐
│  Hero (Orange gradient)                     │
│  Mes Cours                                  │
│  Suivez votre progression...                │
└─────────────────────────────────────────────┘

┌───────┬───────┬───────┐
│ 📚 3  │ 📈 2  │ 🏆 1  │
│ Total │ Cours │Termin.│
└───────┴───────┴───────┘

┌─────────────┬─────────────┬─────────────┐
│ [Cours 1]   │ [Cours 2]   │ [Cours 3]   │
│  Badge      │  Badge      │  Badge      │
│  Titre      │  Titre      │  Titre      │
│  Desc       │  Desc       │  Desc       │
│  ▬▬▬▬▬░ 67% │  ▬▬▬░░░ 40% │  ▬▬▬▬▬ 100% │
│  10/15 leç. │  6/15 leç.  │  15/15 leç. │
│  [Continuer]│  [Continuer]│  [Revoir]   │
└─────────────┴─────────────┴─────────────┘
```

### Page Cours avec Progression
```
┌─────────────────────────────────────────────┐
│  🏆 Votre progression           67%         │
│  ████████████████░░░░░░░░░░                 │
│  ✅ 10 / 15 leçons complétées               │
│  💡 "Plus de la moitié !"                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  [Lecteur Vidéo - 16:9]                     │
│  Leçon 10 : Les Hooks Avancés               │
└─────────────────────────────────────────────┘

ℹ️ Vous reprenez là où vous vous êtes arrêté : Leçon 10

[ ○ Marquer comme complétée ]
```

---

## 🎓 CONCLUSION

Ce guide couvre **100%** des fonctionnalités de la Phase 5.

**Temps estimé** : 30-40 minutes

**Bonne chance pour les tests !** 🍀

---

**Auteur** : Intelli / payhuk02  
**Date** : 27 octobre 2025  
**Version** : 1.0

