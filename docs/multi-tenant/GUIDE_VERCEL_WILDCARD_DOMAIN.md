# 🚀 Guide : Configuration Domaine Wildcard sur Vercel

**Date** : 1 Février 2025  
**Objectif** : Configurer le domaine wildcard `*.myemarzona.shop` sur Vercel pour le système multi-tenant

---

## 📋 Prérequis

- ✅ Compte Vercel actif
- ✅ Projet déployé sur Vercel
- ✅ Domaine `myemarzona.shop` configuré sur Cloudflare
- ✅ Enregistrement DNS wildcard créé sur Cloudflare (voir `GUIDE_CLOUDFLARE_WILDCARD_DNS.md`)

---

## 🎯 Objectif

Configurer Vercel pour accepter et router les requêtes vers **tous les sous-domaines** de `myemarzona.shop` :

- `boutique1.myemarzona.shop` → Application React
- `boutique2.myemarzona.shop` → Application React
- `*.myemarzona.shop` → Application React (wildcard)

---

## 📝 Étapes Détaillées

### Étape 1 : Accéder aux Paramètres du Projet

1. **Connectez-vous** à Vercel : https://vercel.com
2. **Sélectionnez** votre projet (emarzona)
3. Allez dans **Settings** → **Domains** (ou **Domains** dans le menu latéral)

---

### Étape 2 : Ajouter le Domaine Wildcard

1. Dans la section **Domains**, cliquez sur **"Add"** ou **"Add Domain"**
2. Dans le champ de saisie, entrez : `*.myemarzona.shop`
   - ⚠️ **Important** : Utilisez l'astérisque `*` suivi du point `.`
   - Format exact : `*.myemarzona.shop` (sans guillemets)
3. Cliquez sur **"Add"** ou **"Continue"**

**Résultat attendu** :

```
Domain: *.myemarzona.shop
Status: Valid Configuration
```

---

### Étape 3 : Vérifier la Configuration DNS

Vercel va vérifier que l'enregistrement DNS wildcard existe. Vous devriez voir :

**Si la configuration est correcte** :

```
✅ *.myemarzona.shop
   Valid Configuration
   DNS records are correctly configured
```

**Si la configuration est incorrecte** :

```
❌ *.myemarzona.shop
   Invalid Configuration
   Please add a CNAME record pointing to cname.vercel-dns.com
```

---

### Étape 4 : Configuration DNS sur Cloudflare

Si Vercel indique que la configuration DNS est invalide, configurez comme suit :

#### Option A : CNAME Wildcard (Recommandé)

1. Allez sur Cloudflare → Domaine `myemarzona.shop` → **DNS**
2. Créez un enregistrement :
   - **Type** : `CNAME`
   - **Name** : `*` (astérisque seul)
   - **Target** : `cname.vercel-dns.com`
   - **Proxy status** : 🟠 **Proxied** (orange cloud activé)
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

#### Option B : Vérifier l'Enregistrement Existant

Si vous avez déjà créé l'enregistrement wildcard :

1. Vérifiez qu'il pointe vers `cname.vercel-dns.com`
2. Vérifiez que le proxy est activé (🟠 orange)
3. Attendez 5-15 minutes pour la propagation DNS

---

### Étape 5 : Vérifier le Statut sur Vercel

Après avoir configuré le DNS, retournez sur Vercel :

1. Actualisez la page **Domains**
2. Le statut devrait passer à **"Valid Configuration"**
3. Vercel va générer automatiquement un certificat SSL pour le wildcard

**Statut attendu** :

```
*.myemarzona.shop
✅ Valid Configuration
🔒 SSL Certificate: Active
```

---

### Étape 6 : Configuration du Projet (Optionnel)

Si vous avez besoin de configurer le routage spécifique pour les sous-domaines :

#### Fichier `vercel.json` (si nécessaire)

Créez ou modifiez `vercel.json` à la racine du projet :

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Note** : Pour une application React SPA, cette configuration est généralement **déjà gérée automatiquement** par Vercel.

---

## 🧪 Tests de Validation

### Test 1 : Vérifier le Domaine sur Vercel

1. Allez dans **Settings** → **Domains**
2. Vérifiez que `*.myemarzona.shop` apparaît dans la liste
3. Vérifiez que le statut est **"Valid Configuration"**

### Test 2 : Tester un Sous-domaine Spécifique

1. Créez une boutique de test dans votre application
2. Notez le subdomain généré (ex: `test-boutique`)
3. Accédez à : `https://test-boutique.myemarzona.shop`
4. Vérifiez que :
   - ✅ La page se charge
   - ✅ Le certificat SSL est valide (cadenas vert)
   - ✅ L'application React fonctionne
   - ✅ Le sous-domaine est détecté correctement

### Test 3 : Vérifier les Headers

Utilisez `curl` ou un outil en ligne :

```bash
curl -I https://test-boutique.myemarzona.shop

# Vérifiez que les headers incluent :
# - server: Vercel
# - x-vercel-id: (présent)
# - strict-transport-security: (présent si HTTPS)
```

### Test 4 : Vérifier la Détection du Sous-domaine

Dans la console du navigateur (F12) :

```javascript
// Sur https://test-boutique.myemarzona.shop
console.log(window.location.hostname);
// Attendu: "test-boutique.myemarzona.shop"

// Vérifier la détection dans l'application
// Le composant SubdomainMiddleware devrait détecter le sous-domaine
```

---

## ⚠️ Points d'Attention

### 1. Propagation DNS

- ⏱️ **Délai** : La propagation DNS peut prendre **5-15 minutes** avec Cloudflare
- 🔄 **Cache** : Videz le cache DNS local si nécessaire
- 🌍 **Global** : La propagation est généralement rapide avec Cloudflare

### 2. Certificat SSL

- 🔒 **Génération** : Vercel génère automatiquement un certificat SSL wildcard
- ⏱️ **Délai** : Peut prendre jusqu'à **24 heures** pour être actif
- ✅ **Gratuit** : Les certificats SSL sont gratuits sur Vercel

### 3. Limites Vercel

- 📊 **Plan Gratuit** : Jusqu'à **100 domaines** par projet
- 🚀 **Plan Pro** : Domaine illimité
- ⚡ **Performance** : Pas de limite sur le nombre de sous-domaines

### 4. Sous-domaines Réservés

Assurez-vous que les sous-domaines réservés (voir `RESERVED_SUBDOMAINS` dans le code) ne sont **pas utilisés** :

- `www`, `admin`, `api`, `mail`, etc. → Ne doivent pas être des boutiques
- Ces sous-domaines peuvent être configurés séparément si nécessaire

---

## 🔧 Configuration Avancée

### Variables d'Environnement

Si vous avez besoin de variables d'environnement spécifiques par sous-domaine :

1. Allez dans **Settings** → **Environment Variables**
2. Configurez les variables nécessaires
3. Les variables sont partagées entre tous les sous-domaines

### Redirections Personnalisées

Pour rediriger certains sous-domaines spécifiques :

1. Allez dans **Settings** → **Domains**
2. Ajoutez le sous-domaine spécifique (ex: `www.myemarzona.shop`)
3. Configurez la redirection si nécessaire

### Analytics et Monitoring

Pour suivre les performances par sous-domaine :

1. Allez dans **Analytics** (disponible sur les plans payants)
2. Filtrez par domaine pour voir les statistiques par sous-domaine
3. Utilisez **Web Vitals** pour analyser les performances

---

## 🆘 Dépannage

### Problème : "Invalid Configuration" sur Vercel

⚠️ **IMPORTANT** : Si Vercel demande de changer les nameservers vers `ns1.vercel-dns.com` et `ns2.vercel-dns.com`, **NE LE FAITES PAS**. Vous utilisez Cloudflare comme DNS provider, et vous devez garder les nameservers Cloudflare.

**Solutions** :

1. Vérifiez que l'enregistrement CNAME wildcard existe sur Cloudflare
2. Vérifiez que le Target est exactement `cname.vercel-dns.com` (sans `https://` ou `/`)
3. Vérifiez que le proxy Cloudflare est activé (🟠 orange cloud) ⚠️ **CRITIQUE**
4. Vérifiez que "Always Use HTTPS" est activé sur Cloudflare (SSL/TLS → Edge Certificates)
5. Attendez 5-15 minutes pour la propagation DNS
6. Videz le cache DNS local
7. Cliquez sur **"Refresh"** sur Vercel après avoir modifié le DNS

**Voir aussi** : [ANALYSE_PROBLEME_VERCEL_WILDCARD.md](./ANALYSE_PROBLEME_VERCEL_WILDCARD.md) pour une analyse détaillée et complète

### Problème : Le sous-domaine ne se charge pas

**Solutions** :

1. Vérifiez que le domaine wildcard est ajouté sur Vercel
2. Vérifiez que le statut est "Valid Configuration"
3. Vérifiez les logs de déploiement sur Vercel
4. Vérifiez que l'application React gère correctement les sous-domaines
5. Vérifiez la console du navigateur pour les erreurs

### Problème : Erreur SSL/TLS

**Solutions** :

1. Attendez jusqu'à 24 heures pour la génération du certificat
2. Vérifiez que le proxy Cloudflare est activé (🟠 orange)
3. Vérifiez la configuration SSL/TLS sur Cloudflare (Full strict)
4. Contactez le support Vercel si le problème persiste

### Problème : Le sous-domaine pointe vers la mauvaise page

**Solutions** :

1. Vérifiez que l'application React route correctement selon le sous-domaine
2. Vérifiez que `SubdomainMiddleware` est bien intégré dans `App.tsx`
3. Vérifiez les logs de l'application pour les erreurs de routage
4. Vérifiez que l'Edge Function `store-by-domain` fonctionne

---

## 📊 Checklist de Vérification

### Configuration Vercel

- [ ] Domaine wildcard `*.myemarzona.shop` ajouté
- [ ] Statut "Valid Configuration" sur Vercel
- [ ] Certificat SSL actif (peut prendre jusqu'à 24h)
- [ ] Projet déployé avec succès

### Configuration Cloudflare

- [ ] Enregistrement CNAME wildcard créé (`*` → `cname.vercel-dns.com`)
- [ ] Proxy Cloudflare activé (🟠 orange cloud)
- [ ] SSL/TLS configuré (Full strict)
- [ ] Always Use HTTPS activé

### Tests

- [ ] Test DNS réussi (`nslookup test.myemarzona.shop`)
- [ ] Test HTTPS réussi (`https://test.myemarzona.shop`)
- [ ] Certificat SSL valide (cadenas vert)
- [ ] Application React fonctionne sur le sous-domaine
- [ ] Détection du sous-domaine fonctionne dans l'application

---

## 📚 Ressources

- [Documentation Vercel - Domains](https://vercel.com/docs/concepts/projects/domains)
- [Documentation Vercel - Wildcard Domains](https://vercel.com/docs/concepts/projects/domains/wildcard-domains)
- [Documentation Vercel - DNS Configuration](https://vercel.com/docs/concepts/projects/domains/dns-records)
- [Guide Cloudflare Wildcard DNS](./GUIDE_CLOUDFLARE_WILDCARD_DNS.md)

---

## ✅ Résultat Attendu

Après configuration, **tous les sous-domaines** de `myemarzona.shop` devraient :

- ✅ Être acceptés par Vercel
- ✅ Avoir un certificat SSL valide (généré automatiquement)
- ✅ Router vers votre application React
- ✅ Permettre la détection du sous-domaine dans l'application
- ✅ Charger la boutique correspondante automatiquement

**Exemple** :

```
https://boutique1.myemarzona.shop → ✅ Application React → Boutique 1
https://boutique2.myemarzona.shop → ✅ Application React → Boutique 2
https://test-boutique.myemarzona.shop → ✅ Application React → Boutique Test
```

---

## 🔄 Flux Complet

```
1. Utilisateur accède à https://ma-boutique.myemarzona.shop
   ↓
2. DNS Cloudflare résout *.myemarzona.shop → cname.vercel-dns.com
   ↓
3. Cloudflare proxy (🟠) route vers Vercel
   ↓
4. Vercel reçoit la requête et sert l'application React
   ↓
5. Application React détecte le sous-domaine (SubdomainMiddleware)
   ↓
6. Application charge la boutique via Edge Function store-by-domain
   ↓
7. Boutique affichée à l'utilisateur ✅
```

---

**Dernière mise à jour** : 1 Février 2025
