# 🚀 GUIDE DE DÉPLOIEMENT - SYSTÈME MULTI-TENANT

**Date** : 1 Février 2025  
**Version** : 1.0

---

## 📋 CHECKLIST DE DÉPLOIEMENT

### ✅ Étape 1 : Base de Données

- [ ] Appliquer la migration SQL
- [ ] Vérifier que la colonne `subdomain` existe
- [ ] Vérifier que les fonctions SQL sont créées
- [ ] Tester la fonction `get_store_by_subdomain()`

### ✅ Étape 2 : Edge Function

- [ ] Déployer l'Edge Function `store-by-domain`
- [ ] Vérifier que l'endpoint répond
- [ ] Tester avec un sous-domaine valide
- [ ] Tester avec un sous-domaine inexistant (404)

### ✅ Étape 3 : Cloudflare

- [ ] Ajouter le domaine `myemarzona.shop`
- [ ] Configurer les nameservers
- [ ] Créer l'enregistrement DNS wildcard (\*)
- [ ] Activer le proxy (orange cloud)
- [ ] Configurer SSL/TLS (Full strict)
- [ ] Activer "Always Use HTTPS"
- [ ] Configurer les Page Rules (optionnel)

### ✅ Étape 4 : Frontend

- [ ] Vérifier que `SubdomainMiddleware` est intégré
- [ ] Vérifier que les hooks sont importés
- [ ] Build de l'application
- [ ] Déployer sur Vercel
- [ ] Configurer les variables d'environnement

### ✅ Étape 5 : Tests

- [ ] Créer une boutique de test
- [ ] Accéder au sous-domaine
- [ ] Vérifier que la boutique se charge
- [ ] Tester la page 404
- [ ] Vérifier HTTPS
- [ ] Tester sur mobile

---

## 🔧 COMMANDES DE DÉPLOIEMENT

### Migration SQL

```bash
# Via Supabase CLI
supabase migration up

# Ou via Dashboard
# SQL Editor → Coller le contenu de la migration → Run
```

### Edge Function

```bash
# Déployer
supabase functions deploy store-by-domain

# Vérifier
supabase functions list

# Tester localement
supabase functions serve store-by-domain
```

### Frontend

```bash
# Build
npm run build

# Déployer sur Vercel
vercel deploy --prod

# Ou via Git (si configuré)
git push origin main
```

---

## 🧪 TESTS POST-DÉPLOIEMENT

### Test 1 : Création de Boutique

```sql
-- Créer une boutique de test
INSERT INTO stores (user_id, name, slug, subdomain, is_active)
VALUES (
  'YOUR_USER_ID',
  'Boutique Test',
  'boutique-test',
  'boutique-test',
  true
);
```

### Test 2 : Accès au Sous-domaine

1. Attendre la propagation DNS (5-30 minutes)
2. Accéder à `https://boutique-test.myemarzona.shop`
3. Vérifier que la boutique se charge

### Test 3 : Page 404

1. Accéder à `https://boutique-inexistante.myemarzona.shop`
2. Vérifier que la page 404 s'affiche

### Test 4 : Validation

```bash
# Valider un sous-domaine
tsx scripts/validate-subdomain.ts ma-boutique

# Tester un sous-domaine réservé
tsx scripts/validate-subdomain.ts admin
# Devrait retourner une erreur
```

---

## 🔍 VÉRIFICATIONS

### DNS

```bash
# Vérifier la résolution DNS
dig boutique-test.myemarzona.shop

# Vérifier avec nslookup
nslookup boutique-test.myemarzona.shop
```

### SSL

```bash
# Vérifier le certificat SSL
openssl s_client -connect boutique-test.myemarzona.shop:443 -servername boutique-test.myemarzona.shop
```

### Edge Function

```bash
# Tester l'Edge Function directement
curl -X GET "https://[PROJECT].supabase.co/functions/v1/store-by-domain" \
  -H "x-subdomain: boutique-test"
```

---

## ⚠️ PROBLÈMES COURANTS

### DNS ne se propage pas

**Solution** : Attendre jusqu'à 48h pour la propagation complète

### SSL non valide

**Solution** : Vérifier que Cloudflare SSL est en mode "Full (strict)"

### Boutique non trouvée

**Solution** : Vérifier que `is_active = true` et que le `subdomain` correspond exactement

### CORS Error

**Solution** : Vérifier les headers CORS dans l'Edge Function

---

**Dernière mise à jour** : 1 Février 2025
