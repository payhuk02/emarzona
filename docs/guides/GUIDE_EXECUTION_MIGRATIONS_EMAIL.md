# 📋 Guide d'exécution des migrations Email Templates

**Date :** 1er Février 2025  
**Objectif :** Corriger les erreurs de structure et ajouter les templates manquants

---

## 🚨 Problèmes à corriger

1. ❌ Colonne `product_type` manquante dans `email_templates`
2. ❌ Colonne `is_default` manquante dans `email_templates`
3. ❌ Templates manquants (service, course, artist)

---

## ✅ Solution

Trois migrations SQL à exécuter dans l'ordre :

### 📝 Étape 1 : Structure complète

**Fichier :** `supabase/migrations/20250201_fix_email_templates_complete_structure.sql`

**Ce que fait cette migration :**
- ✅ Ajoute la colonne `product_type` si elle n'existe pas
- ✅ Ajoute la colonne `is_default` si elle n'existe pas
- ✅ Ajoute toutes les autres colonnes manquantes
- ✅ Crée les index nécessaires de manière sécurisée
- ✅ Met à jour les commentaires

**Comment exécuter :**
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier le contenu du fichier `20250201_fix_email_templates_complete_structure.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur "Run" (ou Ctrl+Enter)
5. Vérifier qu'il n'y a pas d'erreur

**Vérification :**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'email_templates' 
AND column_name IN ('product_type', 'is_default');
```
Doit retourner 2 lignes.

---

### 📝 Étape 2 : Templates manquants

**Fichier :** `supabase/migrations/20250201_add_missing_email_templates.sql`

**Ce que fait cette migration :**
- ✅ Insère le template `order-confirmation-service`
- ✅ Insère le template `course-enrollment-confirmation`
- ✅ Insère le template `order-confirmation-artist`
- ✅ Utilise `ON CONFLICT` pour éviter les doublons

**Comment exécuter :**
1. Toujours dans SQL Editor
2. Copier le contenu du fichier `20250201_add_missing_email_templates.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur "Run"
5. Vérifier qu'il n'y a pas d'erreur

**Vérification :**
```sql
SELECT slug, name, product_type 
FROM email_templates 
WHERE slug IN (
  'order-confirmation-service',
  'course-enrollment-confirmation',
  'order-confirmation-artist'
);
```
Doit retourner 3 lignes.

---

### 📝 Étape 3 : Automatisation (Optionnel)

**Fichier :** `supabase/migrations/20250201_auto_send_order_confirmation_emails.sql`

**Ce que fait cette migration :**
- ✅ Crée un trigger SQL pour détecter les paiements complétés
- ✅ Prépare le système pour l'envoi automatique d'emails

**Comment exécuter :**
1. Toujours dans SQL Editor
2. Copier le contenu du fichier `20250201_auto_send_order_confirmation_emails.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur "Run"
5. Vérifier qu'il n'y a pas d'erreur

---

## 🔍 Vérification finale

Après avoir exécuté toutes les migrations, exécuter cette requête :

```sql
-- Vérifier toutes les colonnes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'email_templates'
ORDER BY ordinal_position;

-- Vérifier les templates
SELECT 
  slug,
  name,
  category,
  product_type,
  is_active,
  is_default
FROM email_templates
ORDER BY slug;
```

---

## ⚠️ En cas d'erreur

### Erreur : "column already exists"
✅ **C'est normal !** La migration vérifie l'existence avant d'ajouter. C'est sans danger.

### Erreur : "index already exists"
✅ **C'est normal !** L'utilisation de `IF NOT EXISTS` évite les erreurs. C'est sans danger.

### Erreur : "template already exists"
✅ **C'est normal !** Le `ON CONFLICT` met à jour le template existant. C'est sans danger.

---

## ✅ Résultat attendu

Après exécution complète :

1. ✅ Table `email_templates` avec toutes les colonnes nécessaires
2. ✅ Templates `order-confirmation-service`, `course-enrollment-confirmation`, `order-confirmation-artist` présents
3. ✅ Index créés correctement
4. ✅ Trigger pour envoi automatique configuré

---

## 📞 Support

Si des erreurs persistent :
1. Vérifier les logs dans Supabase Dashboard → Logs
2. Vérifier que les migrations sont exécutées dans l'ordre
3. Vérifier que la table `email_templates` existe bien

---

**Guide créé le 1er Février 2025** ✅

