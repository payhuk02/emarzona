# Instructions : Créer la fonction validate_unified_promotion

**Problème :** L'erreur `function validate_unified_promotion() does not exist` apparaît.

**Solution :** Exécuter le script de création de la fonction avant les commentaires.

---

## 🔧 Solution Rapide (Recommandée)

### Étape 1 : Ouvrir le fichier de correction

Ouvrez le fichier : `supabase/migrations/20250128_fix_validate_unified_promotion.sql`

### Étape 2 : Copier tout le contenu

Copiez **TOUT** le contenu du fichier.

### Étape 3 : Coller dans Supabase SQL Editor

1. Dans Supabase, allez dans **SQL Editor**
2. Créez une nouvelle requête ou ouvrez celle qui contient l'erreur
3. **Effacez** le contenu actuel (les COMMENT ON FUNCTION)
4. **Collez** tout le contenu du fichier de correction

### Étape 4 : Exécuter

Cliquez sur **"Run"** (ou appuyez sur `CTRL+Enter`)

---

## ✅ Vérification

Après l'exécution, testez avec cette requête :

```sql
-- Vérifier que la fonction existe maintenant
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'validate_unified_promotion';
```

Vous devriez voir la fonction dans les résultats.

---

## 📝 Alternative : Exécuter toute la migration

Si vous préférez exécuter toute la migration complète :

1. Ouvrez `supabase/migrations/20250128_unify_promotions_system.sql`
2. Copiez **TOUT** le contenu
3. Collez dans Supabase SQL Editor
4. Exécutez

**Important :** Exécutez toujours le script complet, pas seulement les commentaires.

---

## 🎯 Ordre d'exécution correct

Pour créer la fonction et ajouter les commentaires :

1. **D'abord** : Créer la fonction (lignes 271-424 dans la migration complète)
2. **Ensuite** : Ajouter les commentaires (lignes 487-491)

Le fichier de correction (`20250128_fix_validate_unified_promotion.sql`) fait les deux en une fois, donc c'est la solution la plus simple.

---

## ❓ Problème persistant ?

Si l'erreur persiste après avoir exécuté le script :

1. Vérifiez que vous êtes connecté au bon projet Supabase
2. Vérifiez que vous êtes sur le bon schéma (public)
3. Regardez les erreurs détaillées dans le panneau de résultats
4. Assurez-vous que la table `product_promotions` existe
