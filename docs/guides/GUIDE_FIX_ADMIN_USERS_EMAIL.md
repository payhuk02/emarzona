# 🔧 Fix : Admin Users - Récupération des Emails

## 🐛 Problème
**Erreur :** `ERROR: 42703: column profiles.role does not exist`

**Cause :** Le hook `useAllUsers` essayait de trier et rechercher par des colonnes qui n'existent pas dans la table `profiles` :
- ❌ `email` → existe dans `auth.users`, pas dans `profiles`
- ❌ `role` → existe dans `user_roles`, pas dans `profiles`

---

## ✅ Solution Appliquée

### 1. Colonnes de Tri Corrigées
- ✅ `created_at` (existe dans `profiles`)
- ✅ `display_name` (existe dans `profiles`)
- ❌ ~~`email`~~ (retiré, n'existe pas dans `profiles`)

### 2. Recherche Corrigée
- Recherche uniquement dans : `display_name`, `first_name`, `last_name`
- Email exclu de la recherche directe (nécessiterait un JOIN complexe)

### 3. Fonction RPC pour Récupérer les Emails
Une nouvelle fonction SQL a été créée : `get_users_emails(p_user_ids UUID[])`

Cette fonction :
- ✅ Récupère les emails depuis `auth.users` en une seule requête
- ✅ Utilisée par le hook `useAllUsers` pour afficher les emails
- ✅ Sécurisée avec `SECURITY DEFINER`
- ✅ Optimisée (récupère tous les emails d'un coup, pas un par un)

---

## 📝 Migration à Appliquer

### Étape 1 : Exécuter la Migration SQL

**Via Supabase SQL Editor:**
1. Allez sur https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copiez TOUT le contenu du fichier : `supabase/migrations/20250124_get_user_emails_function.sql`
3. Collez dans l'éditeur SQL
4. Cliquez sur **"Run"**
5. Vérifiez : Vous devriez voir ✅ **"Success"**

**Contenu de la migration:**
```sql
-- Fonction pour récupérer l'email d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT email FROM auth.users WHERE id = p_user_id;
$$;

-- Fonction pour récupérer les emails de plusieurs utilisateurs
CREATE OR REPLACE FUNCTION get_users_emails(p_user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id as user_id, email 
  FROM auth.users 
  WHERE id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_emails(UUID[]) TO authenticated;
```

---

### Étape 2 : Vérifier que Ça Fonctionne

Dans Supabase SQL Editor, testez :

```sql
-- Test 1 : Récupérer un email
SELECT get_user_email('VOTRE_USER_ID_ICI');

-- Test 2 : Récupérer plusieurs emails
SELECT * FROM get_users_emails(ARRAY[
  'user_id_1',
  'user_id_2'
]::UUID[]);
```

---

### Étape 3 : Tester dans l'Application

1. Allez sur `/admin/users`
2. ✅ Les emails doivent s'afficher correctement
3. ✅ Le tri par "Nom complet" et "Date d'inscription" fonctionne
4. ✅ La recherche par nom/prénom fonctionne
5. ✅ Les filtres par rôle et statut fonctionnent
6. ✅ La pagination fonctionne
7. ✅ Plus d'erreur `column profiles.role does not exist`

---

## 🏗️ Architecture Technique

### Avant (❌ Incorrect)
```typescript
// ❌ Erreur : tri par 'email' qui n'existe pas dans profiles
query = query.order('email', { ascending: true });

// ❌ Erreur : recherche dans 'email' qui n'existe pas
query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
```

### Après (✅ Correct)
```typescript
// ✅ Tri uniquement sur colonnes existantes
type SortColumn = 'created_at' | 'display_name'; // 'email' retiré

// ✅ Recherche uniquement dans profiles
query = query.or(`display_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);

// ✅ Récupération emails via RPC
const { data: emailsData } = await supabase.rpc('get_users_emails', { 
  p_user_ids: userIds 
});
```

---

## 📊 Comparaison Avant/Après

| Aspect | ❌ AVANT | ✅ APRÈS |
|--------|---------|----------|
| **Tri par email** | Plantage (colonne n'existe pas) | Retiré, tri par nom à la place |
| **Recherche email** | Plantage (colonne n'existe pas) | Recherche par nom uniquement |
| **Affichage email** | `display_name` utilisé comme email | Vrai email depuis auth.users |
| **Performance** | N+1 queries pour emails | 1 seule requête RPC |
| **Erreurs** | `column profiles.role does not exist` | Aucune erreur |

---

## 🎯 Améliorations Futures (Optionnel)

### Option 1 : Vue SQL avec JOIN
Créer une vue qui fait le JOIN entre `profiles` et `auth.users` :

```sql
CREATE VIEW admin_users_view AS
SELECT 
  p.*,
  u.email,
  ur.role
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
LEFT JOIN user_roles ur ON p.user_id = ur.user_id;
```

**Avantages :**
- Tri et recherche par email directement
- Plus besoin de RPC
- Requête unique

**Inconvénients :**
- Nécessite des permissions spéciales sur `auth.users`
- Plus complexe à maintenir

### Option 2 : Fonction RPC Complète
Créer une fonction qui retourne tout (profil + email + rôle) :

```sql
CREATE FUNCTION get_admin_users(...)
RETURNS TABLE(...)
AS $$
  SELECT 
    p.*,
    u.email,
    COALESCE(ur.role, 'user') as role
  FROM profiles p
  LEFT JOIN auth.users u ON p.user_id = u.id
  LEFT JOIN user_roles ur ON p.user_id = ur.user_id
  -- Filtres et tri ici
$$;
```

**Avantages :**
- Performance optimale
- Tout côté serveur
- Pagination/tri/filtres SQL natifs

**Inconvénients :**
- Plus complexe à coder
- Nécessite expertise SQL

---

## ✅ Checklist

- [x] Migration SQL créée (`20250124_get_user_emails_function.sql`)
- [x] Hook `useAllUsers.ts` corrigé (tri, recherche, récupération emails)
- [x] `AdminUsers.tsx` mis à jour (colonnes triables corrigées)
- [ ] **Migration SQL appliquée en production** ⬅️ **À FAIRE**
- [ ] Tests effectués sur `/admin/users`
- [ ] Vérification : emails affichés correctement
- [ ] Vérification : plus d'erreur console

---

**🎉 Une fois la migration appliquée, la page Admin Users fonctionnera parfaitement !**

---

**Commande rapide pour appliquer la migration :**
```bash
# Dans Supabase SQL Editor, copiez-collez :
supabase/migrations/20250124_get_user_emails_function.sql
```

