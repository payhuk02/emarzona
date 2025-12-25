# 🔧 Résolution : Erreur Moneroo "The route v1/checkout/initialize could not be found"

## 📋 Problèmes Identifiés dans les Logs

D'après les logs Supabase Edge Functions, deux erreurs principales :

### 1. ❌ "MONEROO_API_KEY is not configured"

**Observations :**
- Cette erreur apparaît dans les logs plus anciens (avant la configuration du secret)
- Le secret `MONEROO_API_KEY` est maintenant configuré dans Supabase Dashboard

**Solution :**
- ✅ Secret configuré
- ⚠️ **Redéployer l'Edge Function** pour que le secret soit pris en compte

### 2. ❌ "The route v1/checkout/initialize could not be found"

**Observations :**
- Cette erreur apparaît lors des tentatives de paiement récentes
- L'endpoint `/checkout/initialize` n'existe pas dans l'API Moneroo
- L'API Moneroo retourne une erreur 404

**Solution appliquée :**
- ✅ Endpoint modifié de `/checkout/initialize` à `/checkout`
- ✅ Format des données ajusté selon le format attendu par Moneroo
- ✅ Logs détaillés ajoutés pour diagnostic

## 🔍 Actions Requises

### Action 1: Redéployer l'Edge Function Moneroo

**Pourquoi :**
- Le secret `MONEROO_API_KEY` a été configuré après le déploiement initial
- Les Edge Functions doivent être redéployées pour accéder aux nouveaux secrets
- Les corrections de code (endpoint) doivent être déployées

**Comment :**

1. **Via Supabase CLI (recommandé) :**
   ```bash
   # Installer Supabase CLI si nécessaire
   npm install -g supabase
   
   # Se connecter à Supabase
   supabase login
   
   # Lier le projet
   supabase link --project-ref votre-project-ref
   
   # Déployer l'Edge Function
   supabase functions deploy moneroo
   ```

2. **Via Supabase Dashboard :**
   - Aller dans **Edge Functions** → **Functions** → **moneroo**
   - Cliquer sur **"Deploy"** ou **"Redeploy"**
   - Attendre que le déploiement soit terminé

### Action 2: Vérifier la Documentation Moneroo

**Pourquoi :**
- L'endpoint `/checkout` pourrait ne pas être correct non plus
- Il faut vérifier la documentation officielle Moneroo pour trouver le bon endpoint

**Comment :**

1. **Consulter la documentation Moneroo :**
   - Dashboard Moneroo → Documentation API
   - Vérifier l'endpoint pour créer un checkout
   - Vérifier le format des données attendu

2. **Tester avec Postman ou curl :**
   ```bash
   curl -X POST https://api.moneroo.io/v1/checkout \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "amount": 1000,
       "currency": "XOF",
       "description": "Test payment"
     }'
   ```

3. **Vérifier les endpoints possibles :**
   - `/checkout`
   - `/payments`
   - `/v1/checkout`
   - `/v1/payments`
   - Autre endpoint selon la documentation

### Action 3: Vérifier le Format des Données

**Pourquoi :**
- Même avec le bon endpoint, le format des données pourrait être incorrect
- L'API Moneroo pourrait attendre un format spécifique

**Comment :**

1. **Consulter la documentation Moneroo** pour le format exact
2. **Vérifier les logs Supabase** après le redéploiement pour voir la réponse de l'API
3. **Ajuster le format** si nécessaire

## 📝 Checklist de Résolution

- [ ] **Redéployer l'Edge Function Moneroo**
  - [ ] Via Supabase CLI ou Dashboard
  - [ ] Vérifier que le déploiement est réussi
  - [ ] Vérifier que les secrets sont accessibles

- [ ] **Vérifier la Documentation Moneroo**
  - [ ] Trouver le bon endpoint pour créer un checkout
  - [ ] Vérifier le format des données attendu
  - [ ] Vérifier l'authentification (Bearer token, headers, etc.)

- [ ] **Tester l'Endpoint**
  - [ ] Tester avec Postman ou curl
  - [ ] Vérifier la réponse de l'API
  - [ ] Ajuster le code si nécessaire

- [ ] **Vérifier les Logs**
  - [ ] Consulter les logs Supabase après le redéploiement
  - [ ] Vérifier que l'endpoint est correct
  - [ ] Vérifier que les données sont correctement formatées

- [ ] **Tester le Paiement**
  - [ ] Tester un paiement sur le marketplace
  - [ ] Vérifier que le checkout est créé avec succès
  - [ ] Vérifier que l'URL de checkout est retournée

## 🔗 Ressources

- **Documentation Moneroo** : Vérifier dans le dashboard Moneroo
- **Support Moneroo** : Contacter le support si nécessaire
- **Supabase Edge Functions** : https://supabase.com/docs/guides/functions
- **Guide Configuration Secrets** : `GUIDE_CONFIGURATION_SECRETS_SUPABASE.md`

## 🎯 Prochaines Étapes

1. **Redéployer l'Edge Function Moneroo** (priorité 1)
2. **Vérifier la documentation Moneroo** pour le bon endpoint (priorité 1)
3. **Tester l'endpoint** avec Postman/curl (priorité 2)
4. **Ajuster le code** si nécessaire (priorité 2)
5. **Tester le paiement** sur le marketplace (priorité 3)

## ⚠️ Important

**Si l'erreur persiste après le redéploiement :**

1. **Vérifier les logs Supabase** pour voir la nouvelle erreur
2. **Vérifier la documentation Moneroo** pour le bon endpoint
3. **Contacter le support Moneroo** si nécessaire
4. **Vérifier que la clé API est valide** et active

## 📊 Statut

- ✅ Code corrigé (endpoint `/checkout/initialize` → `/checkout`)
- ✅ Logs détaillés ajoutés
- ⚠️ **En attente** : Redéploiement de l'Edge Function
- ⚠️ **En attente** : Vérification de la documentation Moneroo
- ⚠️ **En attente** : Test de l'endpoint






