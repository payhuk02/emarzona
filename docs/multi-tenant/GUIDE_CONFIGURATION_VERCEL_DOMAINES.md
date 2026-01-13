# 🌐 Guide : Configuration Vercel pour les Deux Domaines

**Date** : 13 Janvier 2026  
**Objectif** : Configurer `emarzona.com` et `myemarzona.shop` dans Vercel

---

## 🎯 Vue d'Ensemble

Cette plateforme utilise deux domaines distincts :

1. **`emarzona.com`** - Plateforme principale (dashboard, marketplace)
2. **`myemarzona.shop`** - Boutiques utilisateurs (sous-domaines wildcard)

Les deux domaines doivent pointer vers le même déploiement Vercel, mais le code détecte automatiquement le domaine et se comporte différemment.

---

## 📋 Prérequis

- ✅ Compte Vercel actif
- ✅ Projet Vercel créé et déployé
- ✅ Domaines `emarzona.com` et `myemarzona.shop` achetés
- ✅ Domaines configurés dans Cloudflare avec les nameservers Vercel

---

## 🔧 Configuration Étape par Étape

### Étape 1 : Accéder aux Paramètres du Projet

1. Connectez-vous à Vercel : https://vercel.com
2. Ouvrez votre projet **Emarzona**
3. Cliquez sur **Settings** dans le menu supérieur
4. Cliquez sur **Domains** dans le menu latéral

---

### Étape 2 : Ajouter le Domaine Principal (`emarzona.com`)

1. Dans la section **Domains**, cliquez sur **Add Domain**
2. Entrez `emarzona.com` dans le champ
3. Cliquez sur **Add**

**Configuration DNS requise** :

Vercel vous donnera des instructions DNS. Configurez dans Cloudflare :

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | IP Vercel | 🟠 Proxied |
| CNAME | `www` | `cname.vercel-dns.com` | 🟠 Proxied |

**Ou utilisez CNAME** (recommandé pour Vercel) :

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` | `cname.vercel-dns.com` | 🟠 Proxied |
| CNAME | `www` | `cname.vercel-dns.com` | 🟠 Proxied |

4. Attendez que le domaine soit validé (icône verte ✅)
5. Vérifiez que le certificat SSL est généré automatiquement

---

### Étape 3 : Ajouter le Domaine des Boutiques (`myemarzona.shop`)

1. Dans la section **Domains**, cliquez sur **Add Domain**
2. Entrez `myemarzona.shop` dans le champ
3. Cliquez sur **Add**

**Configuration DNS requise** :

Configurez dans Cloudflare :

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` | `cname.vercel-dns.com` | 🟠 Proxied |
| CNAME | `*` | `cname.vercel-dns.com` | 🟠 Proxied |

**Important** : L'enregistrement wildcard (`*`) permet à tous les sous-domaines de fonctionner automatiquement.

4. Attendez que le domaine soit validé (icône verte ✅)
5. Vérifiez que le certificat SSL wildcard est généré automatiquement

---

### Étape 4 : Vérifier la Configuration

Après configuration, vous devriez voir dans Vercel :

```
Domains
├── emarzona.com ✅ Valid
│   └── SSL: Valid
└── myemarzona.shop ✅ Valid
    └── SSL: Valid
```

**Note** : Vercel détecte automatiquement les sous-domaines de `myemarzona.shop` grâce à l'enregistrement DNS wildcard. Vous n'avez pas besoin d'ajouter chaque sous-domaine individuellement.

---

### Étape 5 : Configurer les Variables d'Environnement

1. Dans **Settings** → **Environment Variables**
2. Ajoutez/modifiez les variables suivantes :

```env
# Domaine principal de la plateforme
VITE_APP_DOMAIN=emarzona.com
VITE_SITE_URL=https://emarzona.com

# Domaine dédié aux boutiques
VITE_PUBLIC_STORE_DOMAIN=myemarzona.shop
```

3. Sélectionnez les environnements (Production, Preview, Development)
4. Cliquez sur **Save**

---

### Étape 6 : Redéployer l'Application

Après avoir configuré les domaines :

1. Allez dans **Deployments**
2. Cliquez sur les trois points (⋯) du dernier déploiement
3. Sélectionnez **Redeploy**
4. Attendez que le déploiement soit terminé

**Ou** : Faites un commit/push pour déclencher un nouveau déploiement automatique.

---

## ✅ Vérification

### Test 1 : Domaine Principal

1. Accédez à `https://emarzona.com`
2. Vérifiez que :
   - ✅ La page se charge correctement
   - ✅ Le certificat SSL est valide (cadenas vert)
   - ✅ Aucune erreur dans la console
   - ✅ Le dashboard fonctionne : `https://emarzona.com/dashboard`

### Test 2 : Domaine des Boutiques

1. Créez une boutique de test dans le dashboard
2. Notez le `subdomain` généré (ex: `test-boutique`)
3. Accédez à `https://test-boutique.myemarzona.shop`
4. Vérifiez que :
   - ✅ La page se charge correctement
   - ✅ Le certificat SSL est valide (cadenas vert)
   - ✅ La boutique s'affiche correctement
   - ✅ Les produits s'affichent correctement

### Test 3 : Sous-domaines Dynamiques

1. Créez plusieurs boutiques avec des sous-domaines différents
2. Vérifiez que chaque sous-domaine fonctionne :
   - `https://boutique1.myemarzona.shop`
   - `https://boutique2.myemarzona.shop`
   - `https://boutique3.myemarzona.shop`

---

## 🔒 Configuration SSL/TLS

Vercel génère automatiquement des certificats SSL pour :

- ✅ `emarzona.com`
- ✅ `www.emarzona.com`
- ✅ `myemarzona.shop`
- ✅ `*.myemarzona.shop` (wildcard)

**Important** : Les certificats SSL sont renouvelés automatiquement par Vercel. Aucune action manuelle n'est requise.

---

## ⚙️ Configuration Avancée

### Redirects et Rewrites

Le fichier `vercel.json` configure déjà les redirects et rewrites nécessaires :

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Cette configuration permet à l'application React SPA de fonctionner correctement sur les deux domaines.

### Headers de Sécurité

Les headers de sécurité sont configurés dans `vercel.json` et incluent :

- ✅ Content-Security-Policy (inclut les deux domaines)
- ✅ Strict-Transport-Security
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Et autres headers de sécurité

---

## 🆘 Dépannage

### Problème : Le domaine n'est pas validé

**Solutions** :
1. Vérifiez que les enregistrements DNS sont corrects dans Cloudflare
2. Vérifiez que le proxy Cloudflare est activé (🟠 orange cloud)
3. Attendez quelques minutes pour la propagation DNS
4. Vérifiez que les nameservers pointent vers Cloudflare

### Problème : Erreur SSL/TLS

**Solutions** :
1. Attendez jusqu'à 24h pour la génération automatique du certificat
2. Vérifiez que le domaine est validé dans Vercel
3. Vérifiez que le proxy Cloudflare est activé
4. Contactez le support Vercel si le problème persiste

### Problème : Les sous-domaines ne fonctionnent pas

**Solutions** :
1. Vérifiez que l'enregistrement DNS wildcard (`*`) existe dans Cloudflare
2. Vérifiez que le proxy Cloudflare est activé pour le wildcard
3. Vérifiez que `myemarzona.shop` est validé dans Vercel
4. Redéployez l'application après configuration

### Problème : Le domaine pointe vers le mauvais projet

**Solutions** :
1. Vérifiez que le domaine est ajouté au bon projet Vercel
2. Vérifiez qu'il n'y a pas de conflit avec un autre projet
3. Supprimez et réajoutez le domaine si nécessaire

---

## 📊 Monitoring

### Analytics Vercel

Vercel fournit des analytics pour chaque domaine :

1. Allez dans **Analytics** dans le menu du projet
2. Vous pouvez voir les statistiques pour :
   - `emarzona.com`
   - `myemarzona.shop` (et ses sous-domaines)

### Logs

Les logs Vercel incluent le domaine d'origine :

1. Allez dans **Deployments**
2. Cliquez sur un déploiement
3. Cliquez sur **Functions** ou **Logs**
4. Les logs incluent le header `host` avec le domaine

---

## 🔄 Mise à Jour

### Ajouter un Nouveau Domaine

Si vous devez ajouter un nouveau domaine à l'avenir :

1. Suivez les étapes 1-3 ci-dessus
2. Configurez les DNS dans Cloudflare
3. Attendez la validation
4. Redéployez l'application

### Modifier les Variables d'Environnement

1. Allez dans **Settings** → **Environment Variables**
2. Modifiez les variables nécessaires
3. Redéployez l'application pour appliquer les changements

---

## 📚 Documentation Associée

- [Vérification Configuration Complète](./VERIFICATION_CONFIGURATION_COMPLETE.md)
- [Guide Cloudflare Wildcard DNS](./GUIDE_CLOUDFLARE_WILDCARD_DNS.md)
- [Architecture Multi-Tenant](./ARCHITECTURE_MULTI_TENANT_SUBDOMAINS.md)

---

## ✅ Checklist Finale

- [ ] `emarzona.com` ajouté dans Vercel et validé
- [ ] `myemarzona.shop` ajouté dans Vercel et validé
- [ ] Certificats SSL générés automatiquement
- [ ] Variables d'environnement configurées
- [ ] DNS configurés dans Cloudflare
- [ ] Application redéployée
- [ ] Tests fonctionnels réussis
- [ ] Monitoring configuré

---

**Dernière mise à jour** : 13 Janvier 2026
