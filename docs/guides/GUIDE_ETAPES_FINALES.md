# 🎯 GUIDE PAS À PAS - Étapes Finales du Déploiement

**Date :** 1er Février 2025  
**Temps estimé :** 10 minutes

---

## 📋 Récapitulatif

✅ Edge Functions déployées (3/3)  
⏳ **Migrations SQL à exécuter** (ÉTAPE 1)  
⏳ **Variable d'environnement à configurer** (ÉTAPE 2)

---

## 🔧 ÉTAPE 1 : EXÉCUTER LES MIGRATIONS SQL

### Préparez-vous

1. **Ouvrez votre navigateur**
2. **Connectez-vous à Supabase Dashboard**
3. **Allez sur votre projet** : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb

---

### Migration 1 : Structure Complète

#### 📍 Étape 1.1 : Ouvrir SQL Editor

1. Dans la barre latérale gauche, cliquez sur **SQL Editor** (icône de code)
2. Cliquez sur **+ New query** (en haut à gauche)

#### 📍 Étape 1.2 : Copier le code

1. Ouvrez le fichier : `supabase/migrations/20250201_fix_email_templates_complete_structure.sql`
2. **Sélectionnez tout le contenu** (Ctrl+A)
3. **Copiez** (Ctrl+C)

#### 📍 Étape 1.3 : Coller et exécuter

1. Dans SQL Editor, **collez** le code (Ctrl+V)
2. Vérifiez que tout le code est bien collé
3. Cliquez sur le bouton **Run** (en bas à droite, vert)
   - OU appuyez sur **Ctrl+Enter**

#### 📍 Étape 1.4 : Vérifier le résultat

**Résultat attendu :**

- ✅ Message de succès vert
- ✅ Aucune erreur rouge
- ✅ Notices indiquant que les colonnes ont été ajoutées

**Si vous voyez des erreurs :**

- "Column already exists" → ✅ C'est normal, c'est sans danger
- "Index already exists" → ✅ C'est normal, c'est sans danger

---

### Migration 2 : Templates Manquants

#### 📍 Étape 2.1 : Créer une nouvelle query

1. Dans SQL Editor, cliquez sur **+ New query** (nouvelle query)
2. OU cliquez sur l'onglet **Untitled query** pour créer une nouvelle tab

#### 📍 Étape 2.2 : Copier le code

1. Ouvrez le fichier : `supabase/migrations/20250201_add_missing_email_templates.sql`
2. **Sélectionnez tout le contenu** (Ctrl+A)
3. **Copiez** (Ctrl+C)

#### 📍 Étape 2.3 : Coller et exécuter

1. Dans la nouvelle query, **collez** le code (Ctrl+V)
2. Cliquez sur **Run** (ou Ctrl+Enter)

#### 📍 Étape 2.4 : Vérifier le résultat

**Résultat attendu :**

- ✅ Message de succès
- ✅ Aucune erreur

---

### 🔍 Vérification des Migrations

Créez une nouvelle query et exécutez ceci pour vérifier :

```sql
-- Vérifier que les colonnes existent
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'email_templates'
AND column_name IN ('product_type', 'is_default')
ORDER BY column_name;
```

**Résultat attendu :** 2 lignes

- `is_default` | boolean
- `product_type` | text

---

Puis exécutez :

```sql
-- Vérifier que les templates sont créés
SELECT slug, name, product_type, is_active
FROM email_templates
WHERE slug IN (
  'order-confirmation-service',
  'course-enrollment-confirmation',
  'order-confirmation-artist'
)
ORDER BY slug;
```

**Résultat attendu :** 3 lignes

- `course-enrollment-confirmation`
- `order-confirmation-artist`
- `order-confirmation-service`

---

## ⚙️ ÉTAPE 2 : CONFIGURER SENDGRID_API_KEY

### 📍 Étape 2.1 : Accéder aux Settings

1. Dans Supabase Dashboard, cliquez sur **Edge Functions** (barre latérale)
2. Cliquez sur **send-order-confirmation-email** dans la liste
3. Cliquez sur l'onglet **Settings** (en haut)

### 📍 Étape 2.2 : Aller dans Secrets

1. Dans Settings, cliquez sur **Secrets** (sous-menu à gauche)
2. Vous verrez la liste des secrets existants

### 📍 Étape 2.3 : Vérifier les secrets existants

Vérifiez si ces secrets existent déjà :

- `SUPABASE_URL` → Si présent, ✅ c'est bon
- `SUPABASE_SERVICE_ROLE_KEY` → Si présent, ✅ c'est bon

### 📍 Étape 2.4 : Ajouter SENDGRID_API_KEY

1. Cliquez sur le bouton **Add secret** (en haut à droite)
2. Dans le champ **Name**, tapez : `SENDGRID_API_KEY`
3. Dans le champ **Value**, collez votre clé API SendGrid
   - La clé commence généralement par `SG.`
   - Format : `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. Cliquez sur **Save** ou **Add**

### 📍 Étape 2.5 : Où trouver votre clé SendGrid ?

Si vous n'avez pas encore la clé :

1. **Connectez-vous à SendGrid** : https://app.sendgrid.com
2. Allez dans **Settings** (icône d'engrenage, en haut à droite)
3. Cliquez sur **API Keys** dans le menu
4. Cliquez sur **Create API Key** (bouton bleu)
5. **Nom** : `Emarzona Email Service` (ou autre nom)
6. **Permissions** : Sélectionnez **Full Access** (ou au minimum "Mail Send")
7. Cliquez sur **Create & View**
8. **⚠️ IMPORTANT :** Copiez la clé immédiatement (elle ne sera affichée qu'une seule fois !)
9. Collez-la dans Supabase (voir Étape 2.4)

---

## ✅ VÉRIFICATION FINALE

### Test 1 : Vérifier les templates

```sql
SELECT COUNT(*) as total_templates
FROM email_templates
WHERE product_type IN ('service', 'course', 'artist');
```

**Résultat attendu :** `total_templates = 3`

---

### Test 2 : Vérifier la configuration

1. Allez dans **Edge Functions** → **send-order-confirmation-email** → **Settings** → **Secrets**
2. Vérifiez que ces 3 secrets sont présents :
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `SENDGRID_API_KEY`

---

## 🧪 TEST OPTIONNEL

### Tester l'envoi d'email manuellement

1. Allez dans **Edge Functions** → **send-order-confirmation-email**
2. Cliquez sur l'onglet **Invoke**
3. Dans **Request body**, collez ce JSON (remplacez `YOUR_ORDER_ID` par un vrai order_id) :

```json
{
  "order_id": "YOUR_ORDER_ID",
  "customer_email": "votre-email@example.com",
  "customer_name": "Votre Nom"
}
```

4. Cliquez sur **Invoke**
5. Vérifiez l'onglet **Logs** pour voir le résultat

**Résultat attendu :**

- ✅ Status : 200
- ✅ Message : "Successfully processed X emails"

---

## 📋 CHECKLIST FINALE

Cochez chaque étape au fur et à mesure :

### Migrations SQL

- [ ] Migration 1 exécutée (`fix_email_templates_complete_structure.sql`)
- [ ] Migration 2 exécutée (`add_missing_email_templates.sql`)
- [ ] Vérification des colonnes : ✅ 2 colonnes trouvées
- [ ] Vérification des templates : ✅ 3 templates trouvés

### Configuration

- [ ] Secret `SENDGRID_API_KEY` ajouté
- [ ] Vérification des secrets : ✅ 3 secrets présents

### Tests

- [ ] Test manuel effectué (optionnel)

---

## 🎉 TERMINÉ !

Une fois toutes les cases cochées :

✅ **Le système est opérationnel !**  
✅ **Les emails seront envoyés automatiquement** après chaque paiement  
✅ **Tous les types de produits sont supportés**

---

## 🆘 AIDE

### Problème : Erreur dans la migration

**Solution :**

- Vérifiez que vous avez copié tout le contenu du fichier
- Vérifiez qu'il n'y a pas d'erreur de syntaxe
- Réessayez

### Problème : Secret non sauvegardé

**Solution :**

- Vérifiez que le nom est exactement : `SENDGRID_API_KEY` (sans espace)
- Vérifiez que la valeur est bien votre clé SendGrid
- Réessayez de l'ajouter

### Problème : Email non envoyé lors du test

**Solutions :**

- Vérifiez les logs dans Edge Functions
- Vérifiez que `SENDGRID_API_KEY` est bien configuré
- Vérifiez que la clé SendGrid est valide
- Vérifiez que l'order_id existe et a des items

---

**Guide créé le 1er Février 2025** ✅
