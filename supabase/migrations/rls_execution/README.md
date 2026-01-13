# 📋 Guide d'Exécution des Migrations RLS

**Date de génération** : 2026-01-13  
**Total migrations** : 22

---

## 🎯 Ordre d'Exécution Recommandé

### 1. Pattern 4 : Admin Only (4 migrations)
**Fichier** : `20260113_rls_pattern_4_admin_only_combined.sql`

**Tables** :
- admin_config
- platform_settings
- system_logs
- admin_actions

**Priorité** : 🔴 CRITIQUE - Exécuter en premier

---

### 2. Pattern 1 : user_id (6 migrations)
**Fichier** : `20260113_rls_pattern_1_user_id_combined.sql`

**Tables** :
- notifications
- notifications
- user_preferences
- certificates
- saved_addresses
- user_activity_logs
- user_sessions

**Priorité** : 🟠 HAUTE

---

### 3. Pattern 2 : store_id (8 migrations)
**Fichier** : `20260113_rls_pattern_2_store_id_combined.sql`

**Tables** :
- disputes
- invoices
- subscriptions
- product_analytics
- recurring_bookings
- service_availability
- warranty_claims
- store_analytics

**Priorité** : 🟠 HAUTE

---

### 4. Pattern 3 : Public (3 migrations)
**Fichier** : `20260113_rls_pattern_3_public_combined.sql`

**Tables** :
- community_posts
- public_reviews
- reviews

**Priorité** : 🟡 MOYENNE

---

## 📝 Instructions d'Exécution

### Option 1 : Exécuter les fichiers combinés (Recommandé)

1. Ouvrir Supabase Dashboard → SQL Editor
2. Ouvrir le fichier combiné pour un pattern
3. Copier tout le contenu
4. Coller dans SQL Editor
5. Cliquer sur **Run**
6. Vérifier les messages de succès

### Option 2 : Exécuter les migrations individuellement

1. Ouvrir Supabase Dashboard → SQL Editor
2. Pour chaque migration dans `supabase/migrations/` :
   - Copier le contenu
   - Coller dans SQL Editor
   - Exécuter
   - Vérifier les résultats

---

## ✅ Vérification Après Exécution

Pour chaque table, vérifier que les politiques sont créées :

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'TABLE_NAME'
ORDER BY cmd, policyname;
```

**Résultat attendu** : 4 politiques (SELECT, INSERT, UPDATE, DELETE)

---

## ⚠️ Points d'Attention

1. **Exécuter dans l'ordre** : Pattern 4 → Pattern 1 → Pattern 2 → Pattern 3
2. **Vérifier avant d'exécuter** : S'assurer que RLS est activé sur les tables
3. **Tester après chaque pattern** : Vérifier que les politiques fonctionnent
4. **Backup recommandé** : Faire un backup de la base avant l'exécution

---

**Prochaine étape** : Exécuter Pattern 4 (Admin Only) en premier
