# 🧪 GUIDE TEST RAPIDE - 3 PAGES CRITIQUES

**Durée :** 3 minutes  
**Serveur :** http://localhost:8082

---

## ⚡ TEST EXPRESS (30 secondes par page)

### ✅ PAGE 1 : MARKETPLACE

```
1. Ouvrir : http://localhost:8082/marketplace
2. Vérifier : Les produits s'affichent avec leurs images
3. Console (F12) : Pas d'erreur rouge
```

**Status :** ⬜ OK  ⬜ KO

---

### ✅ PAGE 2 : BOUTIQUE (STOREFRONT)

```
1. Depuis le Marketplace, cliquer sur "Voir la boutique" sous un produit
   OU
   Ouvrir : http://localhost:8082/stores/[votre-slug-boutique]

2. Vérifier : 
   - Logo/bannière boutique visible
   - Produits de la boutique s'affichent avec images

3. Console (F12) : Pas d'erreur rouge
```

**Status :** ⬜ OK  ⬜ KO

---

### ✅ PAGE 3 : DÉTAIL PRODUIT

```
1. Depuis la boutique, cliquer sur un produit
   OU
   Ouvrir : http://localhost:8082/stores/[slug]/products/[produit-slug]

2. Vérifier :
   - Images produit s'affichent
   - Galerie d'images fonctionne (si plusieurs images)
   - Prix et description visibles
   - Fil d'Ariane complet (Accueil > Boutique > Produit)

3. Console (F12) : Pas d'erreur rouge
```

**Status :** ⬜ OK  ⬜ KO

---

## 🎯 RÉSULTAT

```
Marketplace    : ⬜ OK  ⬜ KO
Boutique       : ⬜ OK  ⬜ KO
Détail Produit : ⬜ OK  ⬜ KO

═══════════════════════════════════
TOUT FONCTIONNE ? ⬜ OUI  ⬜ NON
═══════════════════════════════════
```

---

## ⚠️ EN CAS DE PROBLÈME

### Si vous voyez encore l'erreur "ProductImage"

```bash
1. Vider le cache :
   Ctrl + Shift + R (Windows)
   Cmd + Shift + R (Mac)

2. Ou vider complètement :
   - Ouvrir DevTools (F12)
   - Clic droit sur le bouton Refresh
   - Sélectionner "Empty Cache and Hard Reload"
```

### Si les pages sont blanches

```bash
1. Vérifier que le serveur tourne :
   ➜ Local:   http://localhost:8082/

2. Vérifier la console (F12) pour l'erreur exacte

3. Redémarrer si besoin :
   Ctrl+C (arrêter)
   npm run dev (relancer)
```

---

## ✅ SI TOUT EST OK

```
╔════════════════════════════════════════╗
║                                        ║
║  ✅ TOUTES LES PAGES FONCTIONNENT ✅  ║
║                                        ║
║  → Phase 1 complète                   ║
║  → Prêt pour Phase 2                  ║
║  → Ou déploiement production          ║
║                                        ║
╚════════════════════════════════════════╝
```

---

**Temps estimé :** 3 minutes  
**Dernière mise à jour :** 26 Octobre 2025


