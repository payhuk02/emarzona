# 🔍 Script d'Exécution de l'Audit RLS

**Date** : 30 Janvier 2025  
**Objectif** : Exécuter l'audit RLS et identifier les tables à sécuriser

---

## 📋 Instructions d'Exécution

### Option 1 : Via Supabase Dashboard (Recommandé)

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet Emarzona
   - Aller dans **SQL Editor**

2. **Exécuter le script d'audit**
   - Ouvrir le fichier `supabase/FINAL_RLS_AUDIT.sql`
   - Copier tout le contenu
   - Coller dans le SQL Editor
   - Cliquer sur **Run** ou appuyer sur `Ctrl+Enter`

3. **Analyser les résultats**
   - Section 1 : Rapport complet de toutes les tables
   - Section 2 : Statistiques globales
   - Section 3 : Tables sans RLS (devrait être 0)
   - Section 4 : **Tables avec RLS mais sans politiques** (40 tables attendues)
   - Section 5 : Tables avec politiques incomplètes

---

### Option 2 : Via Supabase CLI

```bash
# Si Supabase CLI est installé et configuré
supabase db execute --file supabase/FINAL_RLS_AUDIT.sql
```

---

## 📊 Résultats Attendus

### Section 1 : Rapport Complet

Vous devriez voir toutes les tables avec leur statut RLS :
- `rls_enabled` : true/false
- `policy_count` : Nombre de politiques
- `select_policy` : ✅ ou ❌
- `insert_policy` : ✅ ou ❌
- `update_policy` : ✅ ou ❌
- `delete_policy` : ✅ ou ❌
- `recommendation` : Message de recommandation

### Section 2 : Statistiques Globales

Exemple de résultats attendus :
```
total_tables: ~300
tables_with_rls: ~300
tables_without_rls: 0
tables_without_policies: 40  ⚠️
tables_ok: ~26
tables_warning: 40
tables_info: ~200
percentage_secured: ~87%
```

### Section 4 : Tables Sans Politiques (CRITIQUE)

**Liste des 40 tables attendues** (exemples) :
- `platform_settings`
- `admin_config`
- `commissions`
- `subscriptions`
- `disputes`
- `invoices`
- `lessons`
- `quizzes`
- `assignments`
- ... (et 31 autres)

---

## 📝 Actions Après l'Audit

### 1. Sauvegarder les Résultats

**Copier les résultats dans un fichier** :
```bash
# Créer un fichier de résultats
docs/audits/RLS_AUDIT_RESULTS_$(date +%Y%m%d).md
```

**Format recommandé** :
```markdown
# Résultats Audit RLS - [Date]

## Statistiques Globales
- Total tables : X
- Tables sans politiques : 40
- Tables sans SELECT : 46
- Tables incomplètes : ~200

## Tables Sans Politiques (40)
1. table_name_1
2. table_name_2
...

## Tables Sans SELECT (46)
1. table_name_1
2. table_name_2
...
```

### 2. Prioriser les Tables

**Utiliser la fonction de priorisation** :
```sql
SELECT * FROM get_tables_without_policies() ORDER BY priority, table_name;
```

**Priorités** :
- 🔴 **CRITIQUE** : Données sensibles (payments, commissions, etc.)
- 🟠 **HAUTE** : Données utilisateurs importantes (lessons, quizzes, etc.)
- 🟡 **MOYENNE** : Analytics et logs
- 🟢 **BASSE** : Autres tables

### 3. Créer les Migrations

**Utiliser le guide** : `docs/audits/GUIDE_MIGRATIONS_RLS.md`

**Template de migration** :
```sql
-- Migration : supabase/migrations/YYYYMMDDHHMMSS_rls_{table_name}.sql
-- Utiliser le pattern approprié selon le type de table
```

---

## 🔍 Requêtes Utiles

### Identifier les tables sans politiques

```sql
SELECT * FROM get_tables_without_policies() ORDER BY priority, table_name;
```

### Identifier les tables sans SELECT

```sql
SELECT 
  table_name,
  policy_count,
  CASE WHEN has_select_policy THEN '✅' ELSE '❌' END as select_policy
FROM rls_audit_report
WHERE rls_enabled 
  AND policy_count > 0
  AND NOT has_select_policy
ORDER BY table_name;
```

### Vérifier une table spécifique

```sql
SELECT 
  table_name,
  rls_enabled,
  policy_count,
  CASE WHEN has_select_policy THEN '✅' ELSE '❌' END as select_policy,
  CASE WHEN has_insert_policy THEN '✅' ELSE '❌' END as insert_policy,
  CASE WHEN has_update_policy THEN '✅' ELSE '❌' END as update_policy,
  CASE WHEN has_delete_policy THEN '✅' ELSE '❌' END as delete_policy
FROM rls_audit_report
WHERE table_name = 'nom_de_la_table';
```

---

## ⚠️ Points d'Attention

1. **Tables sans politiques** : Accès bloqué pour TOUS (même admins si pas de politique admin)
2. **Tables sans SELECT** : Impossible de lire les données
3. **Tester après chaque migration** : Vérifier que les politiques fonctionnent correctement

---

## 📚 Ressources

- **Script d'audit** : `supabase/FINAL_RLS_AUDIT.sql`
- **Guide migrations** : `docs/audits/GUIDE_MIGRATIONS_RLS.md`
- **Migration exemple** : `supabase/migrations/20250131_fix_rls_missing_policies_phase1.sql`

---

**Prochaine étape** : Après avoir identifié les tables, créer les migrations RLS en utilisant le guide.
