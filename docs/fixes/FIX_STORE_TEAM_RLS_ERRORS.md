# 🔧 FIX: Erreurs 500 - Store Team RLS

## 🐛 Problème

Les requêtes vers `store_members` et `store_tasks` retournent des erreurs 500 (Internal Server Error).

**Erreurs observées :**
```
Failed to load resource: the server responded with a status of 500
Error fetching store members
Error fetching store tasks
```

## 🔍 Cause

Les politiques RLS (Row Level Security) sont trop restrictives et ne permettent pas aux propriétaires de boutique d'accéder aux données s'ils ne sont pas encore membres de `store_members`.

## ✅ Solution

Une migration SQL a été créée pour :
1. **Ajouter automatiquement le propriétaire comme membre** lors de la création d'une boutique
2. **Ajouter tous les propriétaires existants** comme membres owner
3. **Améliorer les politiques RLS** pour permettre l'accès aux propriétaires même s'ils ne sont pas membres

## 📝 Instructions

### ⚠️ IMPORTANT : Récursion Infinie Détectée

L'erreur `infinite recursion detected in policy for relation "store_members"` indique que les politiques RLS créent une boucle infinie.

### Étape 1 : Appliquer la migration de correction

1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Créez une nouvelle requête
5. **Copiez-collez le contenu du fichier : `supabase/migrations/20250202_fix_store_team_rls_v2.sql`**
6. Cliquez sur **Run** (ou `Ctrl+Enter`)

**Note :** Cette migration supprime toutes les anciennes politiques problématiques et les recrée avec des fonctions `SECURITY DEFINER` pour éviter la récursion.

### Étape 2 : Vérifier que ça fonctionne

Dans le SQL Editor, exécutez cette requête pour vérifier que les propriétaires ont été ajoutés :

```sql
-- Vérifier les membres owner
SELECT 
  s.name as store_name,
  s.user_id as owner_id,
  sm.id as member_id,
  sm.role,
  sm.status
FROM public.stores s
LEFT JOIN public.store_members sm ON sm.store_id = s.id AND sm.user_id = s.user_id
ORDER BY s.created_at DESC
LIMIT 10;
```

Vous devriez voir que tous les propriétaires ont un enregistrement dans `store_members` avec `role = 'owner'` et `status = 'active'`.

### Étape 3 : Tester dans l'application

1. Rechargez la page `/dashboard/store/team`
2. Rechargez la page `/dashboard/tasks`
3. Les erreurs 500 devraient disparaître

## 🔍 Vérification des politiques RLS

Si les erreurs persistent, vérifiez que les politiques RLS sont bien créées :

```sql
-- Vérifier les politiques pour store_members
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('store_members', 'store_tasks')
ORDER BY tablename, policyname;
```

Vous devriez voir :
- `Members and owners can view team members`
- `Members and owners can view tasks`
- `Members and owners can create tasks`
- etc.

## 🚨 Si les erreurs persistent

1. **Vérifiez les logs Supabase** :
   - Allez dans **Logs** > **Postgres Logs**
   - Cherchez les erreurs liées à `store_members` ou `store_tasks`

2. **Vérifiez que vous êtes bien connecté** :
   - L'utilisateur doit être authentifié
   - Vérifiez dans la console : `auth.uid()` doit retourner votre user_id

3. **Vérifiez que la boutique existe** :
   ```sql
   SELECT id, name, user_id 
   FROM public.stores 
   WHERE id = '17cc4002-e248-4cad-a7bd-571577e0018a';
   ```

4. **Vérifiez que vous êtes propriétaire ou membre** :
   ```sql
   SELECT 
     s.id as store_id,
     s.name as store_name,
     s.user_id as owner_id,
     sm.role,
     sm.status
   FROM public.stores s
   LEFT JOIN public.store_members sm ON sm.store_id = s.id AND sm.user_id = auth.uid()
   WHERE s.id = '17cc4002-e248-4cad-a7bd-571577e0018a';
   ```

## 📚 Fichiers modifiés

- `supabase/migrations/20250202_fix_store_team_rls.sql` - Nouvelle migration
- `docs/fixes/FIX_STORE_TEAM_RLS_ERRORS.md` - Ce document

## ✅ Après la correction

Une fois la migration appliquée :
- ✅ Les propriétaires peuvent accéder à `/dashboard/store/team`
- ✅ Les propriétaires peuvent accéder à `/dashboard/tasks`
- ✅ Les nouveaux propriétaires sont automatiquement ajoutés comme membres
- ✅ Les politiques RLS permettent l'accès aux propriétaires

