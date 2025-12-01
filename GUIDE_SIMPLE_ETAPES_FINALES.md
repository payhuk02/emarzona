# ✅ GUIDE SIMPLE - Étapes Finales (10 minutes)

**Date :** 1er Février 2025

---

## 📍 Liens directs

🔗 **SQL Editor :** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/sql/new  
🔗 **Edge Functions Secrets :** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/send-order-confirmation-email/settings

---

## 🔧 ÉTAPE 1 : MIGRATION SQL 1 (2 minutes)

### 1. Ouvrir SQL Editor
👉 https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/sql/new

### 2. Ouvrir le fichier
Ouvrez dans votre éditeur : `supabase/migrations/20250201_fix_email_templates_complete_structure.sql`

### 3. Copier-coller
- **Ctrl+A** (sélectionner tout)
- **Ctrl+C** (copier)
- **Coller dans SQL Editor**
- **Cliquer sur Run** (ou Ctrl+Enter)

✅ **Résultat attendu :** Message vert "Success" (pas d'erreur rouge)

---

## 🔧 ÉTAPE 2 : MIGRATION SQL 2 (2 minutes)

### 1. Nouvelle query
Dans SQL Editor, cliquer sur **+ New query**

### 2. Ouvrir le fichier
Ouvrez : `supabase/migrations/20250201_add_missing_email_templates.sql`

### 3. Copier-coller
- **Ctrl+A** (sélectionner tout)
- **Ctrl+C** (copier)
- **Coller dans la nouvelle query**
- **Cliquer sur Run**

✅ **Résultat attendu :** Message vert "Success"

---

## ⚙️ ÉTAPE 3 : CONFIGURER SENDGRID (3 minutes)

### 1. Accéder aux Settings
👉 https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/send-order-confirmation-email/settings

### 2. Aller dans Secrets
Cliquer sur **Secrets** dans le menu de gauche

### 3. Ajouter le secret
- Cliquer sur **Add secret**
- **Name :** `SENDGRID_API_KEY`
- **Value :** Votre clé SendGrid (commence par `SG.`)

**Si vous n'avez pas la clé SendGrid :**
1. Aller sur : https://app.sendgrid.com
2. Settings → API Keys → Create API Key
3. Full Access → Create
4. **Copier la clé** (elle commence par `SG.`)

### 4. Sauvegarder
Cliquer sur **Save** ou **Add**

---

## ✅ VÉRIFICATION RAPIDE (2 minutes)

### Test 1 : Colonnes
Dans SQL Editor, coller et exécuter :

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'email_templates' 
AND column_name IN ('product_type', 'is_default');
```

✅ **Résultat :** 2 lignes

---

### Test 2 : Templates
```sql
SELECT slug, name 
FROM email_templates 
WHERE slug IN (
  'order-confirmation-service',
  'course-enrollment-confirmation',
  'order-confirmation-artist'
);
```

✅ **Résultat :** 3 lignes

---

## 🎉 TERMINÉ !

Une fois ces 3 étapes terminées, le système est opérationnel !

✅ **Emails envoyés automatiquement** après chaque paiement  
✅ **Tous les types de produits** supportés

---

**Guide créé le 1er Février 2025** ✅

