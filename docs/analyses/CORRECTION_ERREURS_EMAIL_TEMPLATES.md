# 🔧 Correction des erreurs email_templates

**Date :** 1er Février 2025  
**Statut :** ✅ **CORRIGÉ**

---

## 🚨 Problèmes identifiés

### 1. Colonne `product_type` manquante

**Erreur :**

```
ERROR: 42703: column "product_type" of relation "email_templates" does not exist
```

### 2. Colonne `is_default` manquante

**Erreur :**

```
ERROR: 42703: column "is_default" does not exist
QUERY: CREATE UNIQUE INDEX ... WHERE is_default = TRUE
```

---

## ✅ Solution implémentée

### Migration complète de structure

**Fichier :** `supabase/migrations/20250201_fix_email_templates_complete_structure.sql`

Cette migration :

1. ✅ Vérifie et ajoute **toutes** les colonnes manquantes :
   - `product_type` (TEXT)
   - `is_default` (BOOLEAN DEFAULT FALSE)
   - `variables` (JSONB)
   - `sendgrid_template_id` (TEXT)
   - `from_email` (TEXT)
   - `from_name` (TEXT)
   - `reply_to` (TEXT)
   - `is_active` (BOOLEAN)
   - `sent_count` (INTEGER)
   - `open_rate` (DECIMAL)
   - `click_rate` (DECIMAL)
   - `text_content` (JSONB)
   - `created_by` (UUID)

2. ✅ Crée les index **uniquement si les colonnes existent** :
   - `idx_email_templates_product_type`
   - `idx_email_templates_is_active`
   - `idx_email_templates_default` (index unique sur category + product_type WHERE is_default = TRUE)
   - `idx_email_templates_category`
   - `idx_email_templates_slug`

3. ✅ Met à jour les commentaires de la table

---

## 📋 Ordre d'exécution des migrations

**IMPORTANT :** Exécuter les migrations dans cet ordre exact :

1. ✅ `20250201_fix_email_templates_complete_structure.sql`
   - Ajoute toutes les colonnes manquantes
   - Crée les index nécessaires
2. ✅ `20250201_add_missing_email_templates.sql`
   - Insère les templates manquants (service, course, artist)
   - Utilise les colonnes créées à l'étape 1

3. ✅ `20250201_auto_send_order_confirmation_emails.sql`
   - Crée le trigger pour l'envoi automatique

---

## 🔍 Structure finale attendue

### Colonnes dans `email_templates` :

| Colonne                | Type         | Default                  | Description                    |
| ---------------------- | ------------ | ------------------------ | ------------------------------ |
| `id`                   | UUID         | `gen_random_uuid()`      | Primary key                    |
| `slug`                 | TEXT         | NOT NULL                 | Unique identifier              |
| `name`                 | TEXT         | NOT NULL                 | Nom descriptif                 |
| `category`             | TEXT         | NOT NULL                 | 'transactional' \| 'marketing' |
| **`product_type`**     | TEXT         | NULL                     | ✅ **Ajoutée**                 |
| `subject`              | JSONB        | NOT NULL                 | Sujet multilingue              |
| `html_content`         | JSONB        | NOT NULL                 | Contenu HTML multilingue       |
| `text_content`         | JSONB        | NULL                     | Version texte                  |
| `variables`            | JSONB        | `'[]'::jsonb`            | Liste des variables            |
| `sendgrid_template_id` | TEXT         | NULL                     | ID template SendGrid           |
| `from_email`           | TEXT         | `'noreply@emarzona.com'` | Email expéditeur               |
| `from_name`            | TEXT         | `'Emarzona'`             | Nom expéditeur                 |
| `reply_to`             | TEXT         | NULL                     | Email de réponse               |
| `is_active`            | BOOLEAN      | TRUE                     | Template actif                 |
| **`is_default`**       | BOOLEAN      | FALSE                    | ✅ **Ajoutée**                 |
| `created_at`           | TIMESTAMPTZ  | NOW()                    | Date création                  |
| `updated_at`           | TIMESTAMPTZ  | NOW()                    | Date mise à jour               |
| `created_by`           | UUID         | NULL                     | Auteur                         |
| `sent_count`           | INTEGER      | 0                        | Nombre d'envois                |
| `open_rate`            | DECIMAL(5,2) | 0.00                     | Taux d'ouverture               |
| `click_rate`           | DECIMAL(5,2) | 0.00                     | Taux de clic                   |

### Index créés :

1. ✅ `idx_email_templates_slug` (UNIQUE)
2. ✅ `idx_email_templates_category`
3. ✅ `idx_email_templates_product_type` (conditionnel)
4. ✅ `idx_email_templates_is_active` (conditionnel)
5. ✅ `idx_email_templates_default` (UNIQUE sur category + product_type WHERE is_default = TRUE) (conditionnel)

---

## 🎯 Résultat

**Toutes les colonnes nécessaires sont maintenant présentes et les index sont créés de manière sécurisée.**

✅ La table `email_templates` a maintenant la structure complète  
✅ Les templates peuvent être insérés sans erreur  
✅ L'index unique sur `is_default` fonctionne correctement

---

**Document créé le 1er Février 2025** ✅
