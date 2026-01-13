# Guide de Test - Système de Recommandations IA

**Date:** 13 Janvier 2026  
**Objectif:** Valider que toutes les corrections fonctionnent correctement

---

## 🧪 Tests SQL (Dans Supabase Dashboard)

### Test 1: Table `user_behavior_tracking`

```sql
-- 1. Insérer un comportement de test
INSERT INTO user_behavior_tracking (user_id, product_id, action, context)
VALUES (
  'VOTRE_USER_ID',
  'VOTRE_PRODUIT_ID',
  'view',
  '{"category": "electronics", "price": 100}'::jsonb
);

-- 2. Vérifier l'insertion
SELECT * FROM user_behavior_tracking 
WHERE user_id = 'VOTRE_USER_ID' 
ORDER BY timestamp DESC 
LIMIT 5;

-- 3. Vérifier la colonne date_day
SELECT user_id, product_id, action, timestamp, date_day 
FROM user_behavior_tracking 
LIMIT 5;
```

**Résultat attendu:** ✅ Insertion réussie, colonne `date_day` remplie automatiquement

---

### Test 2: Fonction `find_similar_products`

```sql
-- Remplacer par un ID de produit réel
SELECT * FROM find_similar_products('VOTRE_PRODUIT_ID', 5);
```

**Résultat attendu:** ✅ Liste de produits similaires (même catégorie, tags ou prix similaire)

---

### Test 3: Fonction `find_similar_users`

```sql
-- Remplacer par un ID d'utilisateur réel avec des achats
SELECT * FROM find_similar_users('VOTRE_USER_ID', 10);
```

**Résultat attendu:** ✅ Liste d'utilisateurs similaires avec scores de similarité

**Note:** Nécessite que l'utilisateur ait fait des achats et que d'autres utilisateurs aient acheté les mêmes produits.

---

### Test 4: Fonction `calculate_content_similarity`

```sql
-- Remplacer par deux IDs de produits réels
SELECT calculate_content_similarity('PRODUIT_1_ID', 'PRODUIT_2_ID');
```

**Résultat attendu:** ✅ Score entre 0 et 100 (pas aléatoire)

**Vérifications:**
- Produits même catégorie → Score élevé (>40)
- Produits tags communs → Score moyen-élevé (>30)
- Produits prix similaires → Score moyen (>20)

---

### Test 5: Fonction `get_popular_products_by_users`

```sql
-- Remplacer par des IDs d'utilisateurs réels
SELECT * FROM get_popular_products_by_users(
  ARRAY['USER_ID_1', 'USER_ID_2']::UUID[],
  'purchase',
  5
);
```

**Résultat attendu:** ✅ Liste de produits avec compteur de popularité

---

### Test 6: Fonction `get_trending_products_by_behavior`

```sql
SELECT * FROM get_trending_products_by_behavior(7, 10);
```

**Résultat attendu:** ✅ Liste de produits tendance des 7 derniers jours

---

## 🖥️ Tests Application (Dans le navigateur)

### Test 1: Tracking Comportemental

1. **Ouvrir un produit**
   - Aller sur une page produit
   - Vérifier dans la console du navigateur : pas d'erreurs
   - Vérifier dans Supabase : nouvelle entrée dans `user_behavior_tracking` avec `action='view'`

2. **Ajouter au panier**
   - Cliquer sur "Ajouter au panier"
   - Vérifier dans Supabase : nouvelle entrée avec `action='cart'`

3. **Acheter**
   - Compléter un achat
   - Vérifier dans Supabase : nouvelle entrée avec `action='purchase'`

---

### Test 2: Recommandations sur Page Produit

1. **Ouvrir une page produit**
   - Aller sur `/product/[slug]`
   - Scroller jusqu'à la section "Recommandé pour vous"

2. **Vérifications:**
   - ✅ Les recommandations s'affichent
   - ✅ Pas d'erreurs dans la console
   - ✅ Les produits recommandés sont pertinents (même catégorie ou similaires)
   - ✅ Les scores ne sont pas tous identiques (pas aléatoires)

---

### Test 3: Recommandations sur Marketplace

1. **Aller sur la page marketplace**
   - Se connecter avec un compte utilisateur
   - Aller sur `/marketplace`

2. **Vérifications:**
   - ✅ Section "Découvrez nos recommandations personnalisées" s'affiche
   - ✅ Les recommandations sont différentes pour chaque utilisateur
   - ✅ Pas d'erreurs dans la console

---

### Test 4: Performance

1. **Mesurer le temps de chargement**
   - Ouvrir les DevTools → Network
   - Recharger une page avec recommandations
   - Vérifier le temps de réponse des requêtes RPC

2. **Résultat attendu:**
   - ✅ Temps de génération < 500ms
   - ✅ Pas de requêtes qui timeout

---

## 🐛 Tests d'Erreurs

### Test 1: Utilisateur Non Connecté

1. **Se déconnecter**
2. **Aller sur une page produit**
3. **Vérifier:**
   - ✅ Pas d'erreurs dans la console
   - ✅ Recommandations "tendance" s'affichent (fallback)

---

### Test 2: Produit Sans Similaires

1. **Créer un produit unique** (catégorie/tags très spécifiques)
2. **Ouvrir ce produit**
3. **Vérifier:**
   - ✅ Pas d'erreurs
   - ✅ Recommandations de fallback s'affichent (produits populaires)

---

### Test 3: Utilisateur Sans Historique

1. **Créer un nouveau compte**
2. **Aller sur marketplace**
3. **Vérifier:**
   - ✅ Recommandations s'affichent (produits tendance/populaires)
   - ✅ Pas d'erreurs

---

## 📊 Checklist de Validation

### SQL
- [ ] Table `user_behavior_tracking` fonctionne
- [ ] `find_similar_products` retourne des résultats
- [ ] `find_similar_users` fonctionne (si données disponibles)
- [ ] `calculate_content_similarity` retourne des scores cohérents
- [ ] `get_popular_products_by_users` fonctionne
- [ ] `get_trending_products_by_behavior` fonctionne

### Application
- [ ] Tracking des vues fonctionne
- [ ] Tracking du panier fonctionne
- [ ] Tracking des achats fonctionne
- [ ] Recommandations s'affichent sur page produit
- [ ] Recommandations s'affichent sur marketplace
- [ ] Pas d'erreurs dans la console
- [ ] Performance acceptable (<500ms)

### Edge Cases
- [ ] Utilisateur non connecté → Fallback fonctionne
- [ ] Produit sans similaires → Fallback fonctionne
- [ ] Utilisateur sans historique → Fallback fonctionne

---

## 🔍 Debugging

### Si les recommandations ne s'affichent pas

1. **Vérifier la console du navigateur**
   - Erreurs JavaScript ?
   - Erreurs réseau ?

2. **Vérifier les logs Supabase**
   - Requêtes RPC échouent ?
   - Permissions correctes ?

3. **Vérifier les données**
   ```sql
   -- Y a-t-il des produits actifs ?
   SELECT COUNT(*) FROM products WHERE is_active = true;
   
   -- Y a-t-il des comportements trackés ?
   SELECT COUNT(*) FROM user_behavior_tracking;
   ```

### Si les scores sont toujours identiques

1. **Vérifier que `calculate_content_similarity` est utilisée**
   - Vérifier dans les logs que la fonction SQL est appelée
   - Vérifier que les scores varient entre produits différents

2. **Tester directement la fonction SQL**
   ```sql
   SELECT 
     p1.id as product1,
     p2.id as product2,
     calculate_content_similarity(p1.id, p2.id) as similarity
   FROM products p1, products p2
   WHERE p1.id != p2.id
   LIMIT 10;
   ```

---

## ✅ Critères de Succès

Le système est considéré comme fonctionnel si :

1. ✅ Toutes les fonctions SQL s'exécutent sans erreur
2. ✅ Le tracking comportemental fonctionne
3. ✅ Les recommandations s'affichent correctement
4. ✅ Les scores de similarité sont cohérents (pas aléatoires)
5. ✅ Les fallbacks fonctionnent pour les cas limites
6. ✅ Les performances sont acceptables (<500ms)

---

**Bon test ! 🚀**
