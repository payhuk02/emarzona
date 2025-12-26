# 🎯 INSTRUCTIONS FINALES - Déploiement

**Statut :** ✅ Edge Functions déployées - 2 actions restantes

---

## 📍 ACTIONS À FAIRE (10 minutes)

### 🔧 ACTION 1 : Migrations SQL (5 minutes)

#### Étape 1.1 : Ouvrir SQL Editor

👉 **Lien direct :** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/sql/new

#### Étape 1.2 : Migration Structure

1. Ouvrir le fichier : `supabase/migrations/20250201_fix_email_templates_complete_structure.sql`
2. **Sélectionner tout** (Ctrl+A) et **Copier** (Ctrl+C)
3. **Coller dans SQL Editor** (Ctrl+V)
4. **Cliquer sur Run** (bouton vert ou Ctrl+Enter)

✅ **Vérification :** Message vert "Success"

---

#### Étape 1.3 : Migration Templates

1. Dans SQL Editor, cliquer sur **+ New query**
2. Ouvrir le fichier : `supabase/migrations/20250201_add_missing_email_templates.sql`
3. **Sélectionner tout** (Ctrl+A) et **Copier** (Ctrl+C)
4. **Coller dans la nouvelle query** (Ctrl+V)
5. **Cliquer sur Run**

✅ **Vérification :** Message vert "Success"

---

### ⚙️ ACTION 2 : Variable SendGrid (3 minutes)

#### Étape 2.1 : Accéder aux Settings

👉 **Lien direct :** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/send-order-confirmation-email/settings

#### Étape 2.2 : Ajouter le secret

1. Cliquer sur **Secrets** (menu de gauche)
2. Cliquer sur **Add secret** (bouton en haut à droite)
3. **Name :** `SENDGRID_API_KEY`
4. **Value :** Votre clé API SendGrid (commence par `SG.`)
5. Cliquer sur **Save**

---

### 🔑 Obtenir la clé SendGrid

Si vous n'avez pas la clé :

1. Aller sur : https://app.sendgrid.com
2. Settings (⚙️) → API Keys → Create API Key
3. **Name :** `Emarzona Email Service`
4. **Permissions :** Full Access
5. Create & View
6. **⚠️ Copier la clé immédiatement** (elle commence par `SG.`)
7. Coller dans Supabase (étape 2.2)

---

## ✅ VÉRIFICATIONS

### Vérification 1 : Colonnes

Dans SQL Editor, exécuter :

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'email_templates'
AND column_name IN ('product_type', 'is_default');
```

✅ **Résultat :** 2 lignes

---

### Vérification 2 : Templates

```sql
SELECT slug, name, product_type
FROM email_templates
WHERE slug IN (
  'order-confirmation-service',
  'course-enrollment-confirmation',
  'order-confirmation-artist'
);
```

✅ **Résultat :** 3 lignes

---

## 📋 CHECKLIST

- [ ] Migration 1 exécutée
- [ ] Migration 2 exécutée
- [ ] Secret `SENDGRID_API_KEY` ajouté
- [ ] Vérifications OK

---

## 🎉 TERMINÉ !

Une fois toutes les cases cochées, le système est opérationnel !

✅ **Les emails seront envoyés automatiquement** après chaque paiement réussi

---

**Instructions créées le 1er Février 2025** ✅
