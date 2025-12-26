# 🔧 Correction : Permissions Cron Jobs pour Tags Email

**Date** : 19 Février 2025  
**Problème** : `permission denied for table job`  
**Statut** : ✅ Solution disponible

---

## 🐛 Problème Identifié

Lors de l'accès à la page "Gestion des Tags Email" > onglet "Cron Jobs", une erreur apparaît :

```
permission denied for table job
```

Cette erreur se produit car les utilisateurs authentifiés n'ont pas les permissions nécessaires pour accéder directement au schéma `cron` et à la table `cron.job`.

---

## ✅ Solution

### ⚡ Solution Rapide (RECOMMANDÉ)

**Exécutez ce script simple dans Supabase Dashboard > SQL Editor** :

**Fichier** : `supabase/migrations/20250219_fix_email_tags_cron_permissions_SIMPLE.sql`

Ce script :

- ✅ Supprime et recrée les fonctions avec les bonnes permissions
- ✅ Utilise `SECURITY DEFINER` pour exécuter avec les permissions du superutilisateur
- ✅ Donne les permissions `EXECUTE` aux rôles `authenticated`, `anon` et `service_role`
- ✅ Inclut des vérifications automatiques

**Instructions** :

1. Ouvrez **Supabase Dashboard > SQL Editor**
2. Copiez-collez le contenu du fichier `20250219_fix_email_tags_cron_permissions_SIMPLE.sql`
3. Cliquez sur **Run** ou appuyez sur `Ctrl+Enter`
4. Vérifiez qu'il n'y a pas d'erreurs dans les résultats
5. Rechargez la page "Gestion des Tags Email"

### Alternative : Migration Standard

Si vous préférez utiliser la migration standard :

**Fichier** : `supabase/migrations/20250219_fix_email_tags_cron_permissions.sql`

### Vérification

Après avoir exécuté le script, testez manuellement :

```sql
-- Tester la fonction de lecture
SELECT * FROM public.get_email_tags_cron_jobs_status();

-- Tester la fonction de modification (remplacez 'cleanup-expired-email-tags' par un nom valide)
SELECT public.toggle_email_tags_cron_job('cleanup-expired-email-tags', true);
```

Si ces requêtes fonctionnent sans erreur 403, le problème est résolu.

---

## 🔍 Détails Techniques

### Pourquoi cette erreur ?

Dans Supabase, le schéma `cron` est protégé et n'est accessible que par :

- Le superutilisateur (`postgres`)
- Les fonctions avec `SECURITY DEFINER` créées par un superutilisateur

### Comment la solution fonctionne ?

1. **`SECURITY DEFINER`** : La fonction s'exécute avec les permissions du rôle qui l'a créée (généralement `postgres`)
2. **`SET search_path`** : Permet d'accéder au schéma `cron` sans préfixe explicite
3. **`GRANT EXECUTE`** : Permet aux utilisateurs authentifiés d'appeler la fonction

---

## 📝 Code Modifié

### Migration SQL

```sql
CREATE OR REPLACE FUNCTION public.get_email_tags_cron_jobs_status()
RETURNS TABLE (...) AS $$
BEGIN
  SET LOCAL search_path = cron, public;
  -- ... accès à cron.job ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = cron, public;

GRANT EXECUTE ON FUNCTION public.get_email_tags_cron_jobs_status() TO authenticated;
```

### Composant React

Le composant `EmailTagsDashboard.tsx` a été mis à jour pour :

- ✅ Logger les erreurs de permission sans bloquer l'interface
- ✅ Gérer gracieusement l'absence de données de cron jobs

---

## ⚠️ Notes Importantes

1. **Exécution via Dashboard** : Cette migration doit être exécutée via Supabase Dashboard > SQL Editor pour garantir les permissions du superutilisateur.

2. **Alternative** : Si vous ne pouvez pas exécuter la migration, vous pouvez :
   - Masquer l'onglet "Cron Jobs" dans l'interface
   - Utiliser une alternative comme Supabase Edge Functions avec scheduling

3. **Vérification** : Après la migration, rechargez la page "Gestion des Tags Email" pour voir les cron jobs s'afficher correctement.

---

## ✅ Vérification Post-Correction

1. ✅ La page "Gestion des Tags Email" se charge sans erreur
2. ✅ L'onglet "Cron Jobs" affiche les 3 cron jobs configurés
3. ✅ Les boutons "Activer/Désactiver" fonctionnent
4. ✅ Aucune erreur dans la console du navigateur

---

**Migration à exécuter** : `supabase/migrations/20250219_fix_email_tags_cron_permissions.sql`
