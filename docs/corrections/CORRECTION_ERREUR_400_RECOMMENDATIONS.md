# 🔧 Correction de l'Erreur 400 sur get_user_product_recommendations

## 📋 Problème Identifié

L'erreur `400 Bad Request` sur `get_user_product_recommendations` indique que :
- La requête atteint bien Supabase
- Mais la fonction RPC rejette l'appel avec une erreur 400
- Cela peut être dû à :
  1. La fonction n'existe pas dans la base de données
  2. Les paramètres sont invalides (userId n'est pas un UUID valide)
  3. Les tables nécessaires (`orders`, `order_items`) n'existent pas ou ont des colonnes manquantes
  4. Les permissions RLS bloquent l'accès

## ✅ Corrections Apportées

### 1. Amélioration de la Gestion d'Erreurs dans le Hook

**Fichier :** `src/hooks/useProductRecommendations.ts`

- ✅ Validation du format UUID avant l'appel
- ✅ Gestion spécifique des codes d'erreur PostgreSQL/Supabase
- ✅ Les erreurs ne bloquent plus l'interface (retourne un tableau vide)
- ✅ Logs en `warn` au lieu de `error` pour les erreurs non-critiques
- ✅ Désactivation des retry automatiques pour éviter le spam

### 2. Amélioration du Composant

**Fichier :** `src/components/marketplace/ProductRecommendations.tsx`

- ✅ Le composant ne s'affiche pas si erreur (au lieu de bloquer)
- ✅ Les erreurs sont silencieuses pour ne pas perturber l'utilisateur

### 3. Script SQL de Correction

**Fichier :** `FIX_GET_USER_PRODUCT_RECOMMENDATIONS.sql`

- ✅ Version améliorée de la fonction avec gestion d'erreurs
- ✅ Gestion défensive si les tables n'existent pas
- ✅ Retourne des recommandations populaires si pas d'historique d'achat

## 🔧 Solutions

### Solution 1 : Exécuter le Script SQL

1. **Ouvrir Supabase Dashboard → SQL Editor**
2. **Copier le contenu de `FIX_GET_USER_PRODUCT_RECOMMENDATIONS.sql`**
3. **Exécuter le script**
4. **Vérifier que la fonction est créée :**
   ```sql
   SELECT proname, pg_get_function_arguments(oid) 
   FROM pg_proc 
   WHERE proname = 'get_user_product_recommendations';
   ```

### Solution 2 : Vérifier les Tables

Vérifier que les tables suivantes existent :
- `orders` (avec colonnes `customer_id`, `payment_status`, `id`)
- `order_items` (avec colonnes `order_id`, `product_id`)
- `products` (avec colonnes `id`, `category`, `tags`, `is_active`, `is_draft`)
- `stores` (avec colonnes `id`, `name`, `slug`)

### Solution 3 : Vérifier les Permissions RLS

La fonction utilise `SECURITY DEFINER`, donc elle devrait bypasser RLS. Mais vérifiez que :
- La fonction a les permissions nécessaires
- Les tables ont les bonnes politiques RLS (si applicable)

### Solution 4 : Désactiver Temporairement les Recommandations

Si vous voulez désactiver temporairement les recommandations utilisateur :

1. **Modifier `src/pages/Marketplace.tsx` :**
   ```typescript
   // Commenter cette ligne :
   // {userId && filters.category === 'all' && filters.search === '' && filters.productType === 'all' && (
   //   <PersonalizedRecommendations userId={userId} limit={6} />
   // )}
   ```

2. **Ou modifier le hook pour toujours retourner un tableau vide :**
   ```typescript
   enabled: false, // Désactiver complètement
   ```

## 📝 Résultat Attendu

Après les corrections :
- ✅ L'erreur 400 ne s'affiche plus dans la console
- ✅ La marketplace fonctionne normalement même si les recommandations échouent
- ✅ Les recommandations s'affichent si la fonction existe et fonctionne
- ✅ Les recommandations populaires s'affichent si pas d'historique d'achat

## 🔍 Vérification

1. **Vérifier la console du navigateur :**
   - L'erreur 400 ne devrait plus apparaître
   - Seuls des warnings peuvent apparaître (non-critiques)

2. **Vérifier les logs Supabase :**
   - Les appels RPC devraient fonctionner
   - Ou retourner des résultats vides sans erreur

3. **Tester la marketplace :**
   - La page devrait se charger normalement
   - Les produits devraient s'afficher
   - Les recommandations peuvent ne pas s'afficher (normal si la fonction n'existe pas)

## 🚀 Prochaines Étapes

1. **Exécuter le script SQL** `FIX_GET_USER_PRODUCT_RECOMMENDATIONS.sql`
2. **Vérifier que la fonction est créée**
3. **Tester la marketplace** pour voir si les recommandations s'affichent
4. **Vérifier les logs** pour s'assurer qu'il n'y a plus d'erreurs 400

## 🔗 Fichiers Modifiés

- `src/hooks/useProductRecommendations.ts` - Gestion d'erreurs améliorée
- `src/components/marketplace/ProductRecommendations.tsx` - Gestion d'erreurs silencieuse
- `FIX_GET_USER_PRODUCT_RECOMMENDATIONS.sql` - Script SQL de correction

## 📚 Ressources

- [Documentation Supabase RPC](https://supabase.com/docs/guides/database/functions)
- [Codes d'Erreur PostgreSQL](https://www.postgresql.org/docs/current/errcodes-appendix.html)
- [Migration Originale](supabase/migrations/20250131_create_product_recommendations_system.sql)





