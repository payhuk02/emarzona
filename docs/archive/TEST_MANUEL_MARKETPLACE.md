# 🧪 GUIDE DE TEST MANUEL - MARKETPLACE & STOREFRONT

**Serveur :** http://localhost:8082  
**Durée estimée :** 5 minutes

---

## 🎯 OBJECTIF

Vérifier rapidement que le Marketplace et les boutiques fonctionnent après les améliorations Phase 1.

---

## ✅ TEST 1 : MARKETPLACE (2 minutes)

### Étape 1 : Ouvrir le Marketplace

1. Ouvrir le navigateur
2. Aller sur : **http://localhost:8082/marketplace**
3. **Vérifier :**
   - ✅ La page se charge sans erreur
   - ✅ Les produits s'affichent
   - ✅ Aucune erreur dans la console (F12)

### Étape 2 : Tester la recherche

1. Cliquer sur la barre de recherche
2. Taper un mot-clé (ex: "formation", "ebook")
3. **Vérifier :**
   - ✅ Les résultats se filtrent
   - ✅ Le compteur se met à jour

### Étape 3 : Tester les filtres

1. Cliquer sur "Filtres"
2. Sélectionner une catégorie
3. **Vérifier :**
   - ✅ Les produits se filtrent
   - ✅ Les badges de filtre s'affichent

### Étape 4 : Cliquer sur un produit

1. Cliquer sur n'importe quel produit
2. **Vérifier :**
   - ✅ Redirection vers la page produit
   - ✅ Pas d'erreur 404

**Status Marketplace :** ⬜ OK  ⬜ KO

---

## ✅ TEST 2 : STOREFRONT (2 minutes)

### Étape 1 : Accéder à une boutique

**Option A :** Depuis le Marketplace
1. Cliquer sur "Voir la boutique" sous un produit

**Option B :** URL directe
1. Aller sur : **http://localhost:8082/stores/[slug-boutique]**
   - (Remplacer `[slug-boutique]` par un slug réel de votre base)

### Étape 2 : Vérifier l'affichage

**Vérifier :**
- ✅ Le header de la boutique s'affiche
- ✅ Le logo/bannière s'affiche
- ✅ Le nom de la boutique s'affiche
- ✅ Les produits de la boutique s'affichent
- ✅ Aucune erreur dans la console (F12)

### Étape 3 : Tester les onglets

1. Cliquer sur "À propos"
   - ✅ Contenu s'affiche
2. Cliquer sur "Contact"
   - ✅ Formulaire s'affiche
3. Cliquer sur "Produits"
   - ✅ Retour aux produits

### Étape 4 : Cliquer sur un produit

1. Cliquer sur un produit de la boutique
2. **Vérifier :**
   - ✅ Page produit s'ouvre
   - ✅ Fil d'Ariane visible : Accueil > Boutique > Produit

**Status Storefront :** ⬜ OK  ⬜ KO

---

## ✅ TEST 3 : PAGE PRODUIT (1 minute)

### Vérifier l'affichage

**Éléments à vérifier :**
- ✅ Image(s) du produit s'affichent
- ✅ Titre du produit s'affiche
- ✅ Prix s'affiche correctement
- ✅ Description s'affiche
- ✅ Bouton "Acheter" visible
- ✅ Fil d'Ariane complet
- ✅ Produits similaires en bas (si disponibles)
- ✅ Aucune erreur dans la console (F12)

### Tester la galerie d'images (si plusieurs images)

1. Cliquer sur les miniatures
2. **Vérifier :**
   - ✅ L'image principale change
   - ✅ Pas de bug d'affichage

**Status Page Produit :** ⬜ OK  ⬜ KO

---

## 🔍 TEST 4 : VÉRIFIER LE SEO (1 minute)

### Dans la console du navigateur (F12)

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet **Console**
3. Copier-coller ce code :

```javascript
// Afficher tous les schemas JSON-LD
document.querySelectorAll('script[type="application/ld+json"]').forEach((script, index) => {
  console.log(`Schema ${index + 1}:`, JSON.parse(script.textContent));
});
```

4. Appuyer sur Entrée

**Vérifier :**
- ✅ Au moins 1 schema s'affiche
- ✅ Aucune erreur de parsing JSON
- ✅ Le schema contient des données correctes (nom, prix, etc.)

### Dans le code source (Ctrl+U)

1. Appuyer sur **Ctrl+U** (ou clic droit > "Afficher le code source")
2. Chercher (Ctrl+F) : `<title>`
3. **Vérifier :**
   - ✅ Le titre de la page est correct
   - ✅ Présence de `<meta name="description"`
   - ✅ Présence de `<meta property="og:title"`
   - ✅ Présence de `<script type="application/ld+json">`

**Status SEO :** ⬜ OK  ⬜ KO

---

## 📊 RÉSULTAT FINAL

```
Test 1 - Marketplace       : ⬜ OK  ⬜ KO
Test 2 - Storefront        : ⬜ OK  ⬜ KO
Test 3 - Page Produit      : ⬜ OK  ⬜ KO
Test 4 - SEO               : ⬜ OK  ⬜ KO

════════════════════════════════════════
STATUT GLOBAL : ⬜ TOUT OK  ⬜ ERREUR
════════════════════════════════════════
```

---

## 🐛 EN CAS D'ERREUR

### Erreur "Page blanche"

1. Ouvrir la console (F12)
2. Noter l'erreur affichée
3. Prendre un screenshot

### Erreur "Module not found"

1. Relancer le serveur :
   ```bash
   # Arrêter (Ctrl+C)
   npm run dev
   ```

### Erreur 404 sur produit/boutique

1. Vérifier que des données existent dans Supabase :
   - Table `stores` (au moins 1 boutique active)
   - Table `products` (au moins 1 produit actif)

### Erreur dans la console

1. Copier l'erreur complète
2. Vérifier le fichier mentionné
3. Vérifier les imports

---

## 🎯 CHECKLIST RAPIDE

**Si TOUS ces points sont ✅, alors tout fonctionne :**

```
□ Marketplace charge
□ Produits s'affichent
□ Boutique charge
□ Produits boutique s'affichent
□ Page produit charge
□ Images produits s'affichent
□ Schemas JSON-LD présents
□ Aucune erreur console
```

---

## ✅ CONCLUSION

### Si tout est OK ✅

```
╔════════════════════════════════════════╗
║  ✅ MARKETPLACE & STOREFRONT OK ✅    ║
║                                        ║
║  Prêt pour :                          ║
║  → Build production (npm run build)   ║
║  → Tests E2E (Playwright)             ║
║  → Déploiement Vercel                 ║
╚════════════════════════════════════════╝
```

**Action suivante :** Passer à **Phase 2 : Améliorations Essentielles**

### Si erreurs détectées ⚠️

```
╔════════════════════════════════════════╗
║  ⚠️ ERREURS DÉTECTÉES                 ║
║                                        ║
║  1. Noter toutes les erreurs          ║
║  2. Prendre screenshots               ║
║  3. Copier logs console               ║
║  4. Signaler pour correction          ║
╚════════════════════════════════════════╝
```

---

**Durée du test :** ~5 minutes  
**Dernière mise à jour :** 26 Octobre 2025


