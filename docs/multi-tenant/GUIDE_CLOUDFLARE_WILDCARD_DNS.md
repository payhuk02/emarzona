# 🌐 Guide : Configuration DNS Wildcard sur Cloudflare

**Date** : 1 Février 2025  
**Objectif** : Configurer un enregistrement DNS wildcard (`*`) pour `myemarzona.shop`

---

## 📋 Prérequis

- ✅ Compte Cloudflare actif
- ✅ Domaine `myemarzona.shop` ajouté à Cloudflare
- ✅ Accès administrateur au compte Cloudflare
- ✅ IP du serveur Vercel (ou serveur de destination)

---

## 🎯 Objectif

Créer un enregistrement DNS wildcard qui permettra à **tous les sous-domaines** de `myemarzona.shop` de pointer vers votre serveur :

- `boutique1.myemarzona.shop` → Serveur
- `boutique2.myemarzona.shop` → Serveur
- `nimporte-quoi.myemarzona.shop` → Serveur
- `*.myemarzona.shop` → Serveur (wildcard)

---

## 📝 Étapes Détaillées

### Étape 1 : Accéder à la Configuration DNS

1. **Connectez-vous** à votre compte Cloudflare : https://dash.cloudflare.com
2. **Sélectionnez** le domaine `myemarzona.shop` dans la liste des domaines
3. Dans le menu latéral, cliquez sur **"DNS"** (ou **"DNS"** dans la barre de navigation)

---

### Étape 2 : Récupérer l'IP de Vercel

Si vous utilisez **Vercel** pour héberger votre frontend :

1. Allez sur https://vercel.com
2. Ouvrez votre projet
3. Allez dans **Settings** → **Domains**
4. Notez l'**IP de destination** (ou utilisez un CNAME vers `cname.vercel-dns.com`)

**Alternative** : Utilisez un **CNAME** au lieu d'un **A** (recommandé pour Vercel)

---

### Étape 3 : Créer l'Enregistrement Wildcard

#### Option A : Enregistrement A (IPv4)

Si vous avez une **IP statique** :

1. Cliquez sur **"Add record"** (Ajouter un enregistrement)
2. Configurez comme suit :
   - **Type** : `A`
   - **Name** : `*` (astérisque seul, sans guillemets)
   - **IPv4 address** : L'IP de votre serveur (ex: `76.76.21.21`)
   - **Proxy status** : 🟠 **Proxied** (orange cloud activé) ⚠️ **IMPORTANT**
   - **TTL** : `Auto` (géré par Cloudflare)
3. Cliquez sur **"Save"**

**Résultat** :
```
Type: A
Name: *
Content: 76.76.21.21
Proxy: 🟠 Proxied
TTL: Auto
```

---

#### Option B : Enregistrement CNAME (Recommandé pour Vercel)

Si vous utilisez **Vercel** ou un service avec un nom de domaine :

1. Cliquez sur **"Add record"** (Ajouter un enregistrement)
2. Configurez comme suit :
   - **Type** : `CNAME`
   - **Name** : `*` (astérisque seul)
   - **Target** : `cname.vercel-dns.com` (ou votre domaine Vercel)
   - **Proxy status** : 🟠 **Proxied** (orange cloud activé) ⚠️ **IMPORTANT**
   - **TTL** : `Auto`
3. Cliquez sur **"Save"**

**Résultat** :
```
Type: CNAME
Name: *
Target: cname.vercel-dns.com
Proxy: 🟠 Proxied
TTL: Auto
```

---

### Étape 4 : Vérifier la Configuration

Après avoir créé l'enregistrement, vous devriez voir dans la liste DNS :

```
Type    Name    Content                    Proxy    TTL
A       *       76.76.21.21                🟠       Auto
```

ou

```
Type    Name    Target                     Proxy    TTL
CNAME   *       cname.vercel-dns.com       🟠       Auto
```

---

### Étape 5 : Activer le Proxy (Orange Cloud)

⚠️ **CRITIQUE** : Le proxy Cloudflare (orange cloud) **DOIT** être activé pour :

- ✅ Protection DDoS
- ✅ SSL/TLS automatique
- ✅ CDN global
- ✅ Masquage de l'IP réelle
- ✅ Compatibilité avec les sous-domaines dynamiques

**Comment vérifier** :
- L'icône du cloud doit être **🟠 Orange** (Proxied)
- Si elle est **⚪ Gris** (DNS only), cliquez dessus pour l'activer

---

### Étape 6 : Configurer SSL/TLS

1. Dans le menu Cloudflare, allez dans **"SSL/TLS"**
2. Sélectionnez **"Full (strict)"** ou **"Full"** :
   - **Full (strict)** : Recommandé si vous avez un certificat SSL valide
   - **Full** : Accepte les certificats auto-signés
3. Activez **"Always Use HTTPS"** (Toujours utiliser HTTPS)
4. Activez **"Automatic HTTPS Rewrites"** (Réécriture HTTPS automatique)

**Configuration recommandée** :
```
SSL/TLS encryption mode: Full (strict)
Always Use HTTPS: ON
Automatic HTTPS Rewrites: ON
```

---

## 🧪 Tests de Validation

### Test 1 : Vérifier la Résolution DNS

Depuis votre terminal :

```bash
# Tester un sous-domaine spécifique
nslookup boutique-test.myemarzona.shop

# Ou avec dig
dig boutique-test.myemarzona.shop

# Résultat attendu : L'IP de votre serveur (ou CNAME)
```

### Test 2 : Vérifier depuis un Navigateur

1. Ouvrez un navigateur en navigation privée
2. Accédez à : `https://test-boutique.myemarzona.shop`
3. Vérifiez que :
   - ✅ La page se charge (même si c'est une erreur 404)
   - ✅ Le certificat SSL est valide (cadenas vert)
   - ✅ L'URL dans la barre d'adresse est correcte

### Test 3 : Vérifier les Headers

Utilisez un outil comme **curl** ou **Postman** :

```bash
curl -I https://test-boutique.myemarzona.shop

# Vérifiez que les headers incluent :
# - CF-RAY (header Cloudflare)
# - server: cloudflare
```

---

## ⚠️ Points d'Attention

### 1. Propagation DNS

- ⏱️ **Délai** : La propagation DNS peut prendre **5 minutes à 48 heures**
- 🌍 **Global** : Cloudflare propage généralement en **5-15 minutes**
- 🔄 **Cache** : Videz le cache DNS local si nécessaire :
  ```bash
  # Windows
  ipconfig /flushdns
  
  # macOS/Linux
  sudo dscacheutil -flushcache
  ```

### 2. Enregistrements Spécifiques vs Wildcard

Si vous créez un enregistrement spécifique (ex: `www.myemarzona.shop`), il aura la **priorité** sur le wildcard :

```
www.myemarzona.shop → Enregistrement spécifique (priorité)
boutique.myemarzona.shop → Wildcard (*)
```

### 3. Sous-domaines Réservés

Assurez-vous que les sous-domaines réservés (voir `RESERVED_SUBDOMAINS` dans le code) ne sont **pas utilisés** comme noms de boutiques :

- `www`, `admin`, `api`, `mail`, etc. → Ne doivent pas être des boutiques

---

## 🔧 Configuration Avancée

### Page Rules (Règles de Page)

Pour forcer HTTPS sur tous les sous-domaines :

1. Allez dans **"Rules"** → **"Page Rules"**
2. Créez une règle :
   - **URL** : `*myemarzona.shop/*`
   - **Setting** : `Always Use HTTPS`
   - **Status** : Active

### Firewall Rules (Règles de Pare-feu)

Pour protéger les sous-domaines :

1. Allez dans **"Security"** → **"WAF"**
2. Créez des règles personnalisées si nécessaire
3. Activez **"Bot Fight Mode"** pour protéger contre les bots

### Rate Limiting

Pour limiter les requêtes par sous-domaine :

1. Allez dans **"Security"** → **"Rate Limiting"**
2. Créez une règle :
   - **Rule name** : `Protect Store Subdomains`
   - **Match** : `*myemarzona.shop/*`
   - **Threshold** : `100 requests per minute`
   - **Action** : `Block`

---

## 📊 Vérification Finale

### Checklist

- [ ] Enregistrement DNS wildcard créé (`*`)
- [ ] Proxy Cloudflare activé (🟠 orange cloud)
- [ ] SSL/TLS configuré (Full strict)
- [ ] Always Use HTTPS activé
- [ ] Test DNS réussi (`nslookup test.myemarzona.shop`)
- [ ] Test HTTPS réussi (`https://test.myemarzona.shop`)
- [ ] Certificat SSL valide (cadenas vert)

---

## 🆘 Dépannage

### Problème : Le sous-domaine ne se résout pas

**Solutions** :
1. Vérifiez que l'enregistrement wildcard existe
2. Attendez la propagation DNS (5-15 minutes)
3. Videz le cache DNS local
4. Vérifiez que le proxy est activé (🟠 orange)

### Problème : Erreur SSL/TLS

**Solutions** :
1. Vérifiez que le proxy est activé (🟠 orange)
2. Changez le mode SSL/TLS en "Full" (au lieu de "Full strict")
3. Attendez la génération du certificat SSL (jusqu'à 24h)

### Problème : Le sous-domaine pointe vers la mauvaise IP

**Solutions** :
1. Vérifiez l'IP dans l'enregistrement DNS
2. Vérifiez que vous n'avez pas d'enregistrement spécifique qui override
3. Vérifiez les enregistrements CNAME qui pourraient entrer en conflit

---

## 📚 Ressources

- [Documentation Cloudflare DNS](https://developers.cloudflare.com/dns/)
- [Wildcard DNS Records](https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/)
- [SSL/TLS Settings](https://developers.cloudflare.com/ssl/ssl-tls/)
- [Page Rules](https://developers.cloudflare.com/rules/page-rules/)

---

## ✅ Résultat Attendu

Après configuration, **tous les sous-domaines** de `myemarzona.shop` devraient :

- ✅ Se résoudre vers votre serveur
- ✅ Avoir un certificat SSL valide
- ✅ Être protégés par Cloudflare (DDoS, CDN)
- ✅ Forcer HTTPS automatiquement

**Exemple** :
```
https://boutique1.myemarzona.shop → ✅ Fonctionne
https://boutique2.myemarzona.shop → ✅ Fonctionne
https://nimporte-quoi.myemarzona.shop → ✅ Fonctionne
```

---

**Dernière mise à jour** : 1 Février 2025
