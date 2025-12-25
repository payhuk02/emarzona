# 🧹 Guide de Nettoyage des Migrations SQL

> **Objectif**: Consolider et nettoyer les 293+ fichiers de migration SQL pour améliorer la maintenabilité

---

## 📊 État Actuel

- **Nombre de migrations**: 293+ fichiers dans `supabase/migrations/`
- **Fichiers SQL à la racine**: Plusieurs fichiers `fix_*.sql`, `FIX_*.sql`
- **Problème**: Migrations dispersées, difficulté de suivi

---

## 🎯 Objectifs

1. ✅ Identifier les migrations obsolètes
2. ✅ Consolider les migrations liées
3. ✅ Archiver les anciennes migrations
4. ✅ Nettoyer les fichiers SQL de fix à la racine
5. ✅ Documenter la stratégie de migration

---

## 📋 Étapes de Nettoyage

### Étape 1: Audit des Migrations

```bash
# Lister toutes les migrations
ls -la supabase/migrations/ | wc -l

# Identifier les migrations par date
ls -lt supabase/migrations/ | head -20

# Identifier les fichiers SQL à la racine
ls -la *.sql 2>/dev/null
ls -la FIX_*.sql 2>/dev/null
ls -la fix_*.sql 2>/dev/null
```

### Étape 2: Catégoriser les Migrations

Créer un fichier `supabase/migrations/AUDIT_MIGRATIONS.md` :

```markdown
# Audit des Migrations

## Migrations Actives (à conserver)
- [ ] Liste des migrations essentielles

## Migrations Obsolètes (à archiver)
- [ ] Migrations remplacées par de nouvelles versions
- [ ] Migrations de test
- [ ] Migrations rollback non utilisées

## Migrations à Consolider
- [ ] Migrations liées à une même fonctionnalité
- [ ] Migrations de fix multiples pour le même problème
```

### Étape 3: Créer un Dossier d'Archive

```bash
# Créer le dossier d'archive
mkdir -p supabase/migrations/archive

# Déplacer les migrations obsolètes
# (À faire manuellement après audit)
```

### Étape 4: Consolider les Migrations

**Stratégie recommandée**:

1. **Grouper par fonctionnalité**:
   ```
   migrations/
   ├── 001_initial_schema.sql
   ├── 002_auth_tables.sql
   ├── 003_products_tables.sql
   ├── 004_orders_tables.sql
   ├── 005_payments_tables.sql
   └── ...
   ```

2. **Créer des migrations consolidées**:
   - Regrouper les migrations liées
   - Créer une nouvelle migration consolidée
   - Marquer les anciennes comme obsolètes

### Étape 5: Nettoyer les Fichiers SQL de Fix

**Fichiers à traiter**:
- `fix_*.sql`
- `FIX_*.sql`
- `quick_fix_*.sql`

**Actions**:
1. Vérifier si le fix a été appliqué en production
2. Si oui: Créer une migration dans `supabase/migrations/` avec le fix
3. Si non: Appliquer le fix puis créer la migration
4. Supprimer les fichiers de fix à la racine

---

## 🔧 Script d'Aide

Créer `scripts/audit-migrations.js`:

```javascript
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../supabase/migrations');
const migrations = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .map(file => {
    const stats = fs.statSync(path.join(migrationsDir, file));
    return {
      name: file,
      size: stats.size,
      modified: stats.mtime,
    };
  })
  .sort((a, b) => b.modified - a.modified);

console.log(`Total migrations: ${migrations.length}`);
console.log('\nDernières migrations:');
migrations.slice(0, 10).forEach(m => {
  console.log(`  ${m.name} (${m.size} bytes, ${m.modified.toISOString()})`);
});
```

---

## ✅ Checklist de Nettoyage

- [ ] **Audit complet** des migrations
- [ ] **Catégorisation** des migrations (actives/obsolètes)
- [ ] **Création** du dossier `archive/`
- [ ] **Archivage** des migrations obsolètes
- [ ] **Consolidation** des migrations liées
- [ ] **Nettoyage** des fichiers SQL de fix à la racine
- [ ] **Documentation** de la stratégie de migration
- [ ] **Mise à jour** du README avec les nouvelles conventions

---

## 📝 Conventions Recommandées

### Nommage des Migrations

```
YYYYMMDDHHMMSS_description.sql
```

Exemple:
```
20250130120000_add_user_preferences.sql
20250130120001_update_products_table.sql
```

### Structure Recommandée

```
supabase/
├── migrations/
│   ├── active/          # Migrations actives
│   ├── archive/         # Migrations archivées
│   └── consolidated/    # Migrations consolidées
├── functions/           # Edge Functions
└── config.toml          # Configuration Supabase
```

---

## ⚠️ Précautions

1. **Ne pas supprimer** les migrations déjà appliquées en production
2. **Toujours tester** les migrations consolidées en développement
3. **Documenter** les changements dans `CHANGELOG.md`
4. **Créer des backups** avant consolidation

---

## 🔗 Ressources

- [Documentation Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Best Practices Migrations](https://supabase.com/docs/guides/database/migrations)

---

*Dernière mise à jour: 2025-01-30*

