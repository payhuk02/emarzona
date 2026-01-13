# ✅ SOLUTION RAPIDE : Résoudre "Invalid Configuration" sur Vercel

**Problème** : `*.myemarzona.shop` affiche "Invalid Configuration" sur Vercel

---

## 🎯 SOLUTION EN 5 ÉTAPES

### 1️⃣ Vérifier Cloudflare DNS

Allez sur **Cloudflare** → Domaine `myemarzona.shop` → **DNS**

Vérifiez que cet enregistrement existe :

```
Type: CNAME
Name: *
Target: cname.vercel-dns.com
Proxy: 🟠 Proxied (orange cloud)
TTL: Auto
```

### 2️⃣ Créer/Corriger l'Enregistrement

Si l'enregistrement n'existe pas ou est incorrect :

1. Cliquez sur **"Add record"** (ou **"Edit"**)
2. **Type** : `CNAME`
3. **Name** : `*` (astérisque seul)
4. **Target** : `cname.vercel-dns.com` (exactement, sans `https://`)
5. **Proxy** : 🟠 **Proxied** (orange cloud) ⚠️ **OBLIGATOIRE**
6. **TTL** : `Auto`
7. Cliquez sur **"Save"**

### 3️⃣ Activer "Always Use HTTPS" sur Cloudflare

1. Cloudflare → **SSL/TLS** → **Edge Certificates**
2. Activez **"Always Use HTTPS"**
3. Activez **"Automatic HTTPS Rewrites"**

### 4️⃣ Attendre la Propagation

- ⏱️ **5-15 minutes** pour la propagation DNS
- 🔄 Videz le cache DNS local si nécessaire

### 5️⃣ Rafraîchir sur Vercel

1. Vercel → Projet `emarzona` → **Settings** → **Domains**
2. Cliquez sur **"Refresh"** à côté de `*.myemarzona.shop`
3. Le statut devrait passer à **"Valid Configuration"** ✅

---

## ⚠️ NE PAS FAIRE

❌ **Ne changez PAS les nameservers** vers `ns1.vercel-dns.com` et `ns2.vercel-dns.com`

- Gardez les nameservers Cloudflare
- Utilisez un CNAME wildcard au lieu de changer les nameservers

❌ **Ne désactivez PAS le proxy Cloudflare**

- Le proxy (🟠 orange cloud) doit être activé
- Sans proxy, Vercel ne peut pas valider la configuration

---

## 📋 CHECKLIST RAPIDE

- [ ] CNAME wildcard créé sur Cloudflare (`*` → `cname.vercel-dns.com`)
- [ ] Proxy Cloudflare activé (🟠 orange cloud)
- [ ] "Always Use HTTPS" activé sur Cloudflare
- [ ] Attente de 5-15 minutes
- [ ] Bouton "Refresh" cliqué sur Vercel
- [ ] Statut = "Valid Configuration" ✅

---

## 🆘 SI ÇA NE FONCTIONNE PAS

1. Vérifiez que le proxy Cloudflare est bien activé (🟠 orange)
2. Vérifiez que le Target est exactement `cname.vercel-dns.com` (sans protocole)
3. Attendez jusqu'à 24 heures pour la génération du certificat SSL
4. Consultez [ANALYSE_PROBLEME_VERCEL_WILDCARD.md](./ANALYSE_PROBLEME_VERCEL_WILDCARD.md) pour plus de détails

---

**Dernière mise à jour** : 1 Février 2025
