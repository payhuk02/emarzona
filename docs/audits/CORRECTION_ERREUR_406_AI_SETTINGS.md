# 🔧 Correction - Erreur 406 lors du chargement des paramètres IA

**Date:** 13 Janvier 2026
**Erreur:** `Failed to load resource: the server responded with a status of 406 ()`
**Cause:** Migration des paramètres IA non exécutée

---

## 🚨 Problème Identifié

L'erreur HTTP 406 (Not Acceptable) se produit lorsque la page d'administration des recommandations IA (`/admin/ai-settings`) essaie de charger les paramètres depuis la base de données, mais la colonne `ai_recommendation_settings` n'existe pas encore.

### Symptômes
- Erreur 406 dans la console du navigateur
- Page qui ne se charge pas correctement
- Message d'erreur dans les logs : `Error loading AI settings`

---

## ✅ Solution Appliquée

### 1. Code Corrigé

Le code de `AISettingsPage.tsx` a été mis à jour pour :

- ✅ **Vérifier l'existence de la colonne** avant de faire des requêtes
- ✅ **Utiliser `maybeSingle()`** au lieu de `single()` pour éviter l'erreur 406
- ✅ **Ajouter des requêtes de fallback** en cas d'erreur
- ✅ **Messages d'erreur spécifiques** selon le type de problème
- ✅ **Interface de prévisualisation** quand la migration n'est pas faite

### 2. Interface d'Aide

Une interface d'aide s'affiche maintenant quand la migration n'a pas été exécutée :

```
🔧 Migration Requise
La fonctionnalité de paramètres IA n'est pas encore disponible.
Vous devez d'abord exécuter la migration de base de données.

Commandes à exécuter :
# 1. Migration des corrections critiques
supabase db push

# 2. Migration du support types produits
supabase db push

# 3. Migration des paramètres admin
supabase db push
```

---

## 🚀 Résolution Définitive

### Étape 1: Exécuter les Migrations

```bash
# Se positionner dans le répertoire du projet
cd /chemin/vers/emarzona

# 1. Migration des corrections critiques
supabase db push

# 2. Migration du support types produits
supabase db push

# 3. Migration des paramètres admin
supabase db push
```

### Étape 2: Vérifier la Migration

Utilisez le script de vérification créé :

```bash
node scripts/check-ai-settings-migration.js
```

**Sortie attendue :**
```
🔍 Vérification de la migration des paramètres IA...

1. Vérification de la colonne ai_recommendation_settings...
✅ Colonne ai_recommendation_settings trouvée:
   - Type: jsonb
   - Nullable: YES
   - Défaut: Oui

2. Vérification de l'enregistrement platform_settings...
✅ Enregistrement platform_settings trouvé

3. Vérification du contenu des paramètres IA...
✅ Paramètres IA trouvés:
   - Algorithmes: 5
   - Poids: 5
   - Similarité: 5
   - Types produits: 5
   - Limitations: 5
   - Fallbacks: 5
✅ Structure complète des paramètres IA

🎉 Migration des paramètres IA vérifiée avec succès !
🚀 Vous pouvez maintenant accéder à la page /admin/ai-settings
```

### Étape 3: Tester l'Accès

1. **Redémarrer l'application :**
   ```bash
   npm run dev
   ```

2. **Accéder à la page :**
   - Aller sur `/admin/ai-settings`
   - La page devrait maintenant se charger correctement
   - Vous devriez voir l'interface complète avec 5 onglets

---

## 🔍 Diagnostic Détaillé

### Vérifications à Faire

#### 1. Colonne Existe ?
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'platform_settings'
  AND column_name = 'ai_recommendation_settings';
```

**Résultat attendu :**
```
column_name               | jsonb
data_type                 | jsonb
is_nullable               | YES
```

#### 2. Enregistrement Existe ?
```sql
SELECT id, ai_recommendation_settings IS NOT NULL as has_settings
FROM platform_settings
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Résultat attendu :**
```
id                                    | has_settings
00000000-0000-0000-0000-000000000001 | true
```

#### 3. Structure des Paramètres
```sql
SELECT
  ai_recommendation_settings->>'algorithms' as algorithms,
  ai_recommendation_settings->>'weights' as weights,
  ai_recommendation_settings->>'similarity' as similarity,
  ai_recommendation_settings->>'productTypes' as product_types,
  ai_recommendation_settings->>'limits' as limits,
  ai_recommendation_settings->>'fallbacks' as fallbacks
FROM platform_settings
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Résultat attendu :** Toutes les colonnes non NULL.

---

## 🛠️ Dépannage

### Si le Script de Vérification Échoue

1. **Vérifier les Variables d'Environnement :**
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_ANON_KEY
   ```

2. **Tester la Connexion Supabase :**
   ```javascript
   // Dans la console du navigateur
   console.log(window.supabase); // Devrait afficher l'objet Supabase
   ```

3. **Vérifier les Permissions RLS :**
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE tablename = 'platform_settings';
   ```

### Si les Migrations Échouent

1. **Vérifier l'État de Supabase :**
   ```bash
   supabase status
   ```

2. **Forcer la Migration :**
   ```bash
   supabase db reset
   supabase db push
   ```

3. **Migrations Manuelles :**
   Si les migrations automatiques échouent, exécutez-les manuellement dans le dashboard Supabase.

---

## 📋 Checklist de Résolution

### Prérequis
- [x] Supabase CLI installé
- [x] Variables d'environnement configurées
- [x] Accès administrateur à Supabase

### Migrations
- [ ] Migration `20260113_fix_recommendations_critical_issues.sql` exécutée
- [ ] Migration `20260113_fix_recommendations_product_types.sql` exécutée
- [ ] Migration `20260113_add_ai_recommendation_settings.sql` exécutée

### Vérifications
- [ ] Colonne `ai_recommendation_settings` existe
- [ ] Enregistrement dans `platform_settings` existe
- [ ] Paramètres IA ont une structure valide
- [ ] Page `/admin/ai-settings` accessible
- [ ] Interface se charge sans erreur 406

### Tests Fonctionnels
- [ ] Modification des paramètres possible
- [ ] Sauvegarde fonctionne
- [ ] Recommandations utilisent les nouveaux paramètres

---

## 🎯 Résultat Attendu

Après résolution :

- ✅ **Erreur 406 éliminée**
- ✅ **Page d'administration fonctionnelle**
- ✅ **Paramètres IA configurables**
- ✅ **Recommandations personnalisables**
- ✅ **Interface utilisateur fluide**

---

**Date de correction:** 13 Janvier 2026
**Statut:** ✅ **CORRIGÉ ET DOCUMENTÉ**