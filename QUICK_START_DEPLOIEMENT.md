# ⚡ QUICK START - Déploiement Final (5 minutes)

---

## ✅ Déjà fait

- ✅ Edge Functions déployées (3/3)

---

## 📋 À faire maintenant (2 actions)

### 1️⃣ Migrations SQL

**Ouvrir :** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/sql/new

#### Migration A
- Fichier : `supabase/migrations/20250201_fix_email_templates_complete_structure.sql`
- **Copier tout** → **Coller** → **Run**

#### Migration B  
- **+ New query**
- Fichier : `supabase/migrations/20250201_add_missing_email_templates.sql`
- **Copier tout** → **Coller** → **Run**

---

### 2️⃣ Variable d'environnement

**Ouvrir :** https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/send-order-confirmation-email/settings

- **Secrets** → **Add secret**
- **Name :** `SENDGRID_API_KEY`
- **Value :** Votre clé SendGrid (`SG.xxxxx`)

---

## ✅ C'est tout !

**Temps total : 5-10 minutes**

---

**Créé le 1er Février 2025** ✅

