# 🎯 GUIDE VISUEL - Étapes Finales Déploiement

**Date :** 1er Février 2025  
**Temps estimé :** 10 minutes

---

## 📍 Navigation rapide

🔗 **Liens directs Supabase Dashboard :**

- **SQL Editor :** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/sql/new
- **Edge Functions :** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions
- **Secrets (send-order-confirmation-email) :** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/send-order-confirmation-email/settings

---

## 🔧 ÉTAPE 1 : MIGRATIONS SQL

### 🎯 Action rapide

1. **Ouvrir SQL Editor :** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/sql/new

2. **Copier le fichier complet :** `supabase/migrations/20250201_fix_email_templates_complete_structure.sql`
   - Ouvrir le fichier dans votre éditeur
   - **Sélectionner tout** (Ctrl+A)
   - **Copier** (Ctrl+C)
   - **Coller dans SQL Editor** (Ctrl+V)
   - **Run** (Ctrl+Enter ou bouton vert)

3. **Nouvelle query :** Cliquer sur **+ New query**

4. **Copier le fichier complet :** `supabase/migrations/20250201_add_missing_email_templates.sql`
   - Même processus : Copier → Coller → Run

---

### ✅ Vérification après chaque migration

**Après Migration 1 :**

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'email_templates'
AND column_name IN ('product_type', 'is_default');
```

✅ **Doit montrer 2 lignes**

**Après Migration 2 :**

```sql
SELECT slug, name, product_type
FROM email_templates
WHERE slug IN (
  'order-confirmation-service',
  'course-enrollment-confirmation',
  'order-confirmation-artist'
);
```

✅ **Doit montrer 3 lignes**

---

## ⚙️ ÉTAPE 2 : VARIABLE D'ENVIRONNEMENT

### 🎯 Accès direct

**URL :** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/send-order-confirmation-email/settings

### 📝 Étapes détaillées

1. **Dans la barre latérale gauche :**
   - Cliquer sur **Edge Functions** (icône ⚡)

2. **Dans la liste des fonctions :**
   - Cliquer sur **send-order-confirmation-email**

3. **En haut de la page :**
   - Cliquer sur l'onglet **Settings**

4. **Dans le menu de gauche (Settings) :**
   - Cliquer sur **Secrets**

5. **Ajouter le secret :**
   - Cliquer sur **Add secret** (bouton en haut à droite)
   - **Name :** `SENDGRID_API_KEY`
   - **Value :** Votre clé API SendGrid (commence par `SG.`)
   - Cliquer sur **Save** ou **Add**

---

### 🔑 Comment obtenir votre clé SendGrid ?

Si vous n'avez pas encore la clé :

1. **Aller sur :** https://app.sendgrid.com
2. **Cliquer sur :** Settings (icône ⚙️ en haut à droite)
3. **Cliquer sur :** API Keys (dans le menu Settings)
4. **Cliquer sur :** Create API Key (bouton bleu)
5. **Remplir :**
   - **Name :** `Emarzona Email Service`
   - **Permissions :** Full Access (ou "Mail Send")
6. **Cliquer sur :** Create & View
7. **⚠️ IMPORTANT :** Copier la clé immédiatement (elle commence par `SG.`)
8. **Coller dans Supabase** (voir ci-dessus)

---

## ✅ VÉRIFICATION FINALE COMPLÈTE

### Test 1 : Vérifier la structure

```sql
-- Vérifier toutes les colonnes importantes
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'email_templates'
AND column_name IN (
  'product_type',
  'is_default',
  'variables',
  'is_active',
  'from_email',
  'from_name'
)
ORDER BY column_name;
```

✅ **Résultat attendu :** 6 lignes

---

### Test 2 : Vérifier les templates

```sql
-- Vérifier tous les templates par type
SELECT
  slug,
  name,
  product_type,
  is_active,
  is_default
FROM email_templates
WHERE product_type IS NOT NULL
ORDER BY product_type, slug;
```

✅ **Résultat attendu :** Au moins 5 templates (digital, physical, service, course, artist)

---

### Test 3 : Vérifier les secrets

1. Aller sur : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/send-order-confirmation-email/settings
2. Cliquer sur **Secrets**
3. Vérifier que ces 3 secrets sont présents :
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `SENDGRID_API_KEY`

---

## 🎉 CHECKLIST FINALE

### Migrations SQL

- [ ] Migration 1 exécutée sans erreur
- [ ] Migration 2 exécutée sans erreur
- [ ] Vérification colonnes : ✅ 2 colonnes trouvées
- [ ] Vérification templates : ✅ 3+ templates trouvés

### Configuration

- [ ] Secret `SENDGRID_API_KEY` ajouté
- [ ] Clé SendGrid valide (commence par `SG.`)
- [ ] Vérification secrets : ✅ 3 secrets présents

---

## 🧪 TEST OPTIONNEL

Pour tester que tout fonctionne :

1. **Aller sur :** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/send-order-confirmation-email
2. **Cliquer sur :** Invoke (onglet en haut)
3. **Dans Request body**, coller :

```json
{
  "order_id": "VOTRE_ORDER_ID_ICI",
  "customer_email": "votre-email@example.com",
  "customer_name": "Votre Nom"
}
```

4. **Cliquer sur :** Invoke
5. **Vérifier les logs** pour voir le résultat

---

## 🆘 AIDE

### Erreur : "Column already exists"

✅ **Normal !** La migration vérifie avant d'ajouter. C'est sans danger.

### Erreur : "Index already exists"

✅ **Normal !** Utilisation de `IF NOT EXISTS`. C'est sans danger.

### Erreur : "Template already exists"

✅ **Normal !** Le `ON CONFLICT` met à jour le template. C'est sans danger.

### Secret non sauvegardé

- Vérifier que le nom est exact : `SENDGRID_API_KEY` (sans espace)
- Vérifier que la clé commence par `SG.`
- Réessayer

---

## 📋 RÉSUMÉ

**Après avoir terminé toutes les étapes :**

✅ Migrations SQL exécutées  
✅ Templates créés  
✅ Variable d'environnement configurée  
✅ Système prêt !

**Le système enverra automatiquement des emails de confirmation après chaque paiement réussi ! 🎉**

---

**Guide créé le 1er Février 2025** ✅
