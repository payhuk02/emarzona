# 🔒 GUIDE D'EXÉCUTION - MIGRATIONS RLS (PRIORITÉ 1)

**Date** : 13 Janvier 2026  
**Priorité** : 🔴 **CRITIQUE**  
**Durée estimée** : 2-3 heures d'exécution + tests

---

## 📋 VUE D'ENSEMBLE

Ce guide vous accompagne dans l'exécution des migrations RLS (Row Level Security) pour sécuriser complètement la base de données.

**Total** : 22 migrations organisées en 4 patterns

---

## ⚠️ PRÉREQUIS

### 1. Accès Supabase Dashboard

- ✅ Compte Supabase avec accès admin
- ✅ Accès au projet Supabase
- ✅ Accès au SQL Editor

### 2. Backup de la Base de Données

**⚠️ IMPORTANT** : Créer un backup avant d'exécuter les migrations

```sql
-- Dans Supabase Dashboard → Database → Backups
-- Créer un backup manuel avant de commencer
```

### 3. Environnement de Test (Recommandé)

- ✅ Tester d'abord sur un environnement de staging/dev
- ✅ Vérifier que toutes les fonctionnalités fonctionnent
- ✅ Exécuter ensuite en production

---

## 🎯 ORDRE D'EXÉCUTION RECOMMANDÉ

### Phase 1 : Pattern 4 - Admin Only (🔴 CRITIQUE - Commencer ici)

**Fichier** : `supabase/migrations/rls_execution/20260113_rls_pattern_4_admin_only_combined.sql`

**Tables concernées** :
- `platform_settings`
- `admin_config`
- `system_logs`
- `admin_actions`

**Pourquoi commencer ici** : Ces tables sont critiques pour la sécurité et ne doivent être accessibles qu'aux admins.

**Durée** : ~30 minutes

---

### Phase 2 : Pattern 1 - user_id (🟠 HAUTE)

**Fichier** : `supabase/migrations/rls_execution/20260113_rls_pattern_1_user_id_combined.sql`

**Tables concernées** :
- `notifications`
- `user_preferences`
- `saved_addresses`
- `certificates`
- `user_sessions`
- `user_activity_logs`

**Durée** : ~45 minutes

---

### Phase 3 : Pattern 2 - store_id (🟠 HAUTE)

**Fichier** : `supabase/migrations/rls_execution/20260113_rls_pattern_2_store_id_combined.sql`

**Tables concernées** :
- `subscriptions`
- `invoices`
- `disputes`
- `service_availability`
- `recurring_bookings`
- `warranty_claims`
- `product_analytics`
- `store_analytics`

**Durée** : ~45 minutes

---

### Phase 4 : Pattern 3 - Public (🟡 MOYENNE)

**Fichier** : `supabase/migrations/rls_execution/20260113_rls_pattern_3_public_combined.sql`

**Tables concernées** :
- `reviews`
- `community_posts`
- `public_reviews`

**Durée** : ~30 minutes

---

## 📝 INSTRUCTIONS D'EXÉCUTION ÉTAPE PAR ÉTAPE

### Étape 1 : Préparation

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Ouvrir SQL Editor**
   - Cliquer sur **SQL Editor** dans le menu de gauche
   - Créer une nouvelle requête

3. **Vérifier l'état actuel**
   ```sql
   -- Vérifier les tables sans politiques RLS
   SELECT 
     t.tablename,
     t.rowsecurity,
     COUNT(p.policyname) as policy_count
   FROM pg_tables t
   LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
   WHERE t.schemaname = 'public'
     AND t.rowsecurity = true
   GROUP BY t.tablename, t.rowsecurity
   HAVING COUNT(p.policyname) = 0
   ORDER BY t.tablename;
   ```

---

### Étape 2 : Exécuter Pattern 4 (Admin Only)

1. **Ouvrir le fichier de migration**
   - Ouvrir : `supabase/migrations/rls_execution/20260113_rls_pattern_4_admin_only_combined.sql`
   - Copier tout le contenu

2. **Coller dans SQL Editor**
   - Coller le contenu dans l'éditeur SQL
   - Vérifier qu'il n'y a pas d'erreurs de syntaxe

3. **Exécuter la migration**
   - Cliquer sur **Run** (ou `Ctrl+Enter`)
   - Attendre la fin de l'exécution
   - Vérifier qu'il n'y a pas d'erreurs

4. **Vérifier les résultats**
   ```sql
   -- Vérifier que les politiques ont été créées
   SELECT 
     tablename,
     policyname,
     cmd,
     roles
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('platform_settings', 'admin_config', 'system_logs', 'admin_actions')
   ORDER BY tablename, policyname;
   ```

5. **Tester l'accès**
   ```sql
   -- Tester en tant qu'admin (remplacer USER_ID par votre ID admin)
   SET ROLE authenticated;
   SET request.jwt.claim.sub = 'USER_ID_ADMIN';
   
   -- Devrait fonctionner
   SELECT * FROM platform_settings LIMIT 1;
   
   -- Tester en tant qu'utilisateur normal (devrait échouer)
   SET request.jwt.claim.sub = 'USER_ID_NORMAL';
   SELECT * FROM platform_settings LIMIT 1; -- Devrait retourner 0 lignes
   ```

---

### Étape 3 : Exécuter Pattern 1 (user_id)

1. **Répéter les étapes 2.1 à 2.4** avec le fichier :
   - `supabase/migrations/rls_execution/20260113_rls_pattern_1_user_id_combined.sql`

2. **Vérifier les résultats**
   ```sql
   SELECT 
     tablename,
     policyname,
     cmd
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('notifications', 'user_preferences', 'saved_addresses', 'certificates', 'user_sessions', 'user_activity_logs')
   ORDER BY tablename, policyname;
   ```

---

### Étape 4 : Exécuter Pattern 2 (store_id)

1. **Répéter les étapes 2.1 à 2.4** avec le fichier :
   - `supabase/migrations/rls_execution/20260113_rls_pattern_2_store_id_combined.sql`

2. **Vérifier les résultats**
   ```sql
   SELECT 
     tablename,
     policyname,
     cmd
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('subscriptions', 'invoices', 'disputes', 'service_availability', 'recurring_bookings', 'warranty_claims', 'product_analytics', 'store_analytics')
   ORDER BY tablename, policyname;
   ```

---

### Étape 5 : Exécuter Pattern 3 (Public)

1. **Répéter les étapes 2.1 à 2.4** avec le fichier :
   - `supabase/migrations/rls_execution/20260113_rls_pattern_3_public_combined.sql`

2. **Vérifier les résultats**
   ```sql
   SELECT 
     tablename,
     policyname,
     cmd
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('reviews', 'community_posts', 'public_reviews')
   ORDER BY tablename, policyname;
   ```

---

## ✅ VÉRIFICATION FINALE

### 1. Vérifier toutes les politiques créées

```sql
-- Compter les politiques par table
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(DISTINCT cmd::text, ', ') as operations
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

### 2. Vérifier qu'il n'y a plus de tables sans politiques

```sql
-- Devrait retourner 0 lignes
SELECT 
  t.tablename,
  t.rowsecurity
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.tablename, t.rowsecurity
HAVING COUNT(p.policyname) = 0;
```

### 3. Tests fonctionnels dans l'application

**À tester** :
- ✅ Connexion utilisateur normal
- ✅ Connexion admin
- ✅ Accès aux données personnelles (notifications, préférences)
- ✅ Accès aux données de boutique (produits, commandes)
- ✅ Isolation des données entre utilisateurs
- ✅ Isolation des données entre boutiques
- ✅ Accès admin aux tables critiques

---

## 🐛 DÉPANNAGE

### Erreur : "Policy already exists"

**Solution** :
```sql
-- Supprimer la politique existante
DROP POLICY IF EXISTS "policy_name" ON table_name;

-- Réexécuter la migration
```

### Erreur : "Permission denied"

**Solution** :
- Vérifier que vous êtes connecté en tant qu'admin Supabase
- Vérifier que vous avez les permissions nécessaires

### Erreur : "Function does not exist"

**Solution** :
- Vérifier que toutes les fonctions SQL nécessaires existent
- Exécuter les migrations de fonctions avant les migrations RLS

### Les utilisateurs ne peuvent plus accéder à leurs données

**Solution** :
1. Vérifier que les politiques utilisent `auth.uid()` correctement
2. Vérifier que les utilisateurs sont bien authentifiés
3. Vérifier les logs Supabase pour les erreurs détaillées

---

## 📊 SUIVI DE PROGRESSION

### Checklist d'exécution

- [ ] Backup créé
- [ ] Pattern 4 (Admin Only) exécuté
- [ ] Pattern 4 vérifié et testé
- [ ] Pattern 1 (user_id) exécuté
- [ ] Pattern 1 vérifié et testé
- [ ] Pattern 2 (store_id) exécuté
- [ ] Pattern 2 vérifié et testé
- [ ] Pattern 3 (Public) exécuté
- [ ] Pattern 3 vérifié et testé
- [ ] Vérification finale complétée
- [ ] Tests fonctionnels passés
- [ ] Documentation mise à jour

---

## 📝 NOTES IMPORTANTES

1. **Ne pas exécuter toutes les migrations en même temps**
   - Exécuter pattern par pattern
   - Tester après chaque pattern
   - Vérifier que tout fonctionne avant de continuer

2. **Garder une trace des erreurs**
   - Noter toutes les erreurs rencontrées
   - Documenter les solutions appliquées
   - Mettre à jour ce guide si nécessaire

3. **Tester en production avec précaution**
   - Commencer par un environnement de test
   - Tester avec un utilisateur de test
   - Surveiller les logs après chaque migration

---

## 🔗 RESSOURCES

- **Fichiers de migration** : `supabase/migrations/rls_execution/`
- **Queries de vérification** : `supabase/migrations/rls_execution/verification_queries.sql`
- **Documentation RLS** : `docs/audits/GUIDE_MIGRATIONS_RLS.md`
- **Suivi d'exécution** : `docs/audits/SUIVI_EXECUTION_RLS.md`

---

**Document créé le** : 13 Janvier 2026  
**Dernière mise à jour** : 13 Janvier 2026  
**Version** : 1.0
