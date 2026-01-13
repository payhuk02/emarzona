# 🔧 Solution : Erreur 525 SSL Handshake Failed

**Date** : 13 Janvier 2026  
**Erreur** : Cloudflare Error 525 - SSL handshake failed pour `test-boutique.myemarzona.shop`

---

## 📊 Diagnostic de l'Erreur 525

### Qu'est-ce que l'erreur 525 ?

L'erreur **525** signifie que Cloudflare ne peut pas établir une connexion SSL sécurisée avec le serveur d'origine (Vercel).

**Flux de connexion** :
```
Navigateur → ✅ Cloudflare (SSL OK) → ❌ Vercel (SSL Failed)
```

### Pourquoi cela arrive-t-il ?

1. **Vercel n'a pas encore généré le certificat SSL** pour le sous-domaine
2. **Le mode SSL/TLS dans Cloudflare** n'est pas correctement configuré
3. **Le domaine wildcard n'est pas encore validé** sur Vercel
4. **Délai de propagation** du certificat SSL

---

## ✅ Solutions par Ordre de Priorité

### Solution 1 : Configurer le Mode SSL/TLS dans Cloudflare (CRITIQUE)

**C'est la solution la plus importante !**

1. **Allez sur Cloudflare Dashboard**
   - Connectez-vous : https://dash.cloudflare.com
   - Sélectionnez le domaine `myemarzona.shop`
   - Allez dans **SSL/TLS** → **Overview**

2. **Changez le mode SSL/TLS**
   - Mode actuel : Probablement "Full" ou "Full (strict)"
   - **Changez vers** : **"Full"** (pas "Full (strict)")
   - Cliquez sur **Save**

**Pourquoi "Full" et pas "Full (strict)" ?**
- "Full (strict)" nécessite un certificat SSL valide sur Vercel
- "Full" accepte les certificats auto-signés ou en cours de génération
- Vercel génère les certificats automatiquement, mais cela peut prendre du temps

**Configuration recommandée** :
```
SSL/TLS encryption mode: Full
Always Use HTTPS: ON
Automatic HTTPS Rewrites: ON
```

### Solution 2 : Vérifier que le Domaine est Ajouté sur Vercel

1. **Allez sur Vercel Dashboard**
   - Connectez-vous : https://vercel.com
   - Ouvrez votre projet `emarzona`
   - Allez dans **Settings** → **Domains**

2. **Vérifiez que `myemarzona.shop` est ajouté**
   - Le root domain doit être présent : `myemarzona.shop`
   - Le wildcard peut être présent : `*.myemarzona.shop` (même si "Invalid Configuration")

3. **Si le domaine n'est pas ajouté**
   - Cliquez sur **"Add Domain"**
   - Ajoutez `myemarzona.shop`
   - Attendez la validation (icône verte ✅)

### Solution 3 : Attendre la Génération du Certificat SSL

**Vercel génère automatiquement les certificats SSL, mais cela peut prendre du temps.**

- ⏱️ **Délai normal** : 5 minutes à 24 heures
- 🔄 **Pour accélérer** : Redéployez l'application sur Vercel

**Comment redéployer** :
1. Vercel → Deployments
2. Cliquez sur les trois points (⋯) du dernier déploiement
3. Sélectionnez **Redeploy**
4. Attendez que le déploiement soit terminé

### Solution 4 : Vérifier la Configuration DNS

**Assurez-vous que tous les enregistrements DNS sont corrects :**

| Type | Name | Target | Proxy | TTL |
|------|------|--------|-------|-----|
| CNAME | `@` | `cname.vercel-dns.com` | 🟠 Proxied | Auto |
| CNAME | `www` | `cname.vercel-dns.com` | 🟠 Proxied | Auto |
| CNAME | `*` | `cname.vercel-dns.com` | 🟠 Proxied | Auto |

**Points critiques** :
- ✅ Tous les enregistrements doivent être en **CNAME**
- ✅ Tous doivent pointer vers **`cname.vercel-dns.com`**
- ✅ Le proxy Cloudflare (🟠 orange cloud) **DOIT** être activé

---

## 🔧 Configuration Cloudflare SSL/TLS Détaillée

### Étape par Étape

1. **Allez dans SSL/TLS → Overview**
   - Mode SSL/TLS : **Full** (pas "Full (strict)")
   - Cliquez sur **Save**

2. **Allez dans SSL/TLS → Edge Certificates**
   - **Always Use HTTPS** : **ON** ✅
   - **Automatic HTTPS Rewrites** : **ON** ✅
   - **Minimum TLS Version** : **1.2** (ou plus récent)

3. **Allez dans SSL/TLS → Origin Server**
   - **Authenticated Origin Pulls** : **OFF** (par défaut)
   - Ne changez rien ici sauf si vous avez un certificat client spécifique

### Pourquoi "Full" et pas "Full (strict)" ?

| Mode | Description | Quand l'utiliser |
|------|-------------|-----------------|
| **Full** | Cloudflare chiffre vers l'origine, accepte les certificats auto-signés | ✅ **Recommandé pour Vercel** |
| **Full (strict)** | Cloudflare chiffre vers l'origine, nécessite un certificat valide | ❌ Pas recommandé si Vercel génère encore le certificat |
| Flexible | Cloudflare chiffre vers le visiteur, pas vers l'origine | ❌ Non sécurisé |

**Pour Vercel avec wildcard** : Utilisez **"Full"** jusqu'à ce que le certificat soit généré, puis vous pouvez passer à "Full (strict)" si vous le souhaitez.

---

## 🧪 Tests de Vérification

### Test 1 : Vérifier le Mode SSL/TLS

1. Cloudflare → SSL/TLS → Overview
2. Vérifiez que le mode est **"Full"**
3. Si c'est "Full (strict)", changez vers "Full"

### Test 2 : Tester la Connexion SSL

```bash
# Tester la connexion SSL
openssl s_client -connect test-boutique.myemarzona.shop:443 -servername test-boutique.myemarzona.shop

# Résultat attendu : Connexion SSL réussie
```

### Test 3 : Vérifier les Headers HTTP

```bash
# Vérifier les headers
curl -I https://test-boutique.myemarzona.shop

# Vérifiez la présence de :
# - CF-RAY (header Cloudflare)
# - server: cloudflare
# - x-vercel-id (header Vercel si la connexion fonctionne)
```

### Test 4 : Tester dans le Navigateur

1. Accédez à `https://test-boutique.myemarzona.shop`
2. Si l'erreur 525 persiste :
   - Vérifiez le mode SSL/TLS dans Cloudflare
   - Attendez 5-10 minutes après avoir changé le mode
   - Réessayez

---

## 📋 Checklist de Résolution

### Configuration Cloudflare ✅

- [ ] Mode SSL/TLS changé vers **"Full"** (pas "Full (strict)")
- [ ] "Always Use HTTPS" activé
- [ ] "Automatic HTTPS Rewrites" activé
- [ ] Proxy Cloudflare activé pour tous les enregistrements (🟠 orange cloud)

### Configuration Vercel ✅

- [ ] `myemarzona.shop` ajouté et validé sur Vercel
- [ ] Application redéployée (optionnel mais recommandé)
- [ ] Attente de 5-10 minutes après configuration

### Tests ✅

- [ ] Mode SSL/TLS vérifié dans Cloudflare
- [ ] Test de connexion SSL réussi
- [ ] Accès HTTPS fonctionne dans le navigateur
- [ ] Plus d'erreur 525

---

## 🆘 Dépannage Supplémentaire

### Si l'erreur 525 persiste après avoir changé vers "Full"

1. **Vérifiez que Vercel a généré le certificat**
   - Vercel → Settings → Domains
   - Vérifiez que `myemarzona.shop` affiche "Valid Configuration"
   - Le certificat SSL peut prendre jusqu'à 24 heures

2. **Redéployez l'application sur Vercel**
   - Cela force Vercel à régénérer les certificats
   - Allez dans Deployments → Redeploy

3. **Vérifiez les logs Cloudflare**
   - Cloudflare → Analytics → Logs
   - Cherchez les erreurs SSL/TLS
   - Vérifiez les détails de l'erreur 525

4. **Testez temporairement sans proxy Cloudflare**
   - Désactivez le proxy Cloudflare pour le wildcard (`*`)
   - Attendez 5 minutes
   - Testez `https://test-boutique.myemarzona.shop`
   - Si ça fonctionne, le problème vient de la configuration SSL Cloudflare
   - Réactivez le proxy après

### Si le problème persiste après 24 heures

1. **Contactez le support Cloudflare**
   - Fournissez le Ray ID de l'erreur
   - Mentionnez que vous utilisez Vercel comme origine
   - Demandez de vérifier la configuration SSL

2. **Contactez le support Vercel**
   - Mentionnez que Cloudflare affiche l'erreur 525
   - Demandez de vérifier la génération du certificat SSL
   - Fournissez le nom de domaine concerné

---

## 🎯 Résumé de la Solution

### Action Immédiate Requise

**Changez le mode SSL/TLS dans Cloudflare de "Full (strict)" vers "Full"**

1. Cloudflare → SSL/TLS → Overview
2. Mode SSL/TLS : **Full** (pas "Full (strict)")
3. Cliquez sur **Save**
4. Attendez 5-10 minutes
5. Testez `https://test-boutique.myemarzona.shop`

### Pourquoi cela résout le problème ?

- "Full (strict)" nécessite un certificat SSL valide sur Vercel
- Vercel génère les certificats automatiquement, mais cela peut prendre du temps
- "Full" accepte les certificats en cours de génération
- Une fois le certificat généré, vous pouvez rester en "Full" ou passer à "Full (strict)"

---

## ✅ Résultat Attendu

Après avoir changé le mode SSL/TLS vers "Full" :

- ✅ Plus d'erreur 525
- ✅ `https://test-boutique.myemarzona.shop` se charge correctement
- ✅ Certificat SSL valide dans le navigateur
- ✅ Connexion sécurisée entre Cloudflare et Vercel

---

**Dernière mise à jour** : 13 Janvier 2026
