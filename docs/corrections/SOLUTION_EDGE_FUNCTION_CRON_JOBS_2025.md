# 🔧 Solution Finale : Edge Function pour Cron Jobs

**Date** : 19 Février 2025  
**Problème** : Erreur 403 persistante malgré les permissions SQL correctes  
**Solution** : Edge Function Supabase utilisant le service role key

---

## 🐛 Problème Identifié

Malgré la configuration correcte des permissions SQL (`SECURITY DEFINER`, `GRANT EXECUTE`), les appels RPC aux fonctions `get_email_tags_cron_jobs_status` et `toggle_email_tags_cron_job` retournaient toujours une erreur **403 Forbidden**.

### Cause

Supabase peut bloquer l'accès au schéma `cron` via l'API REST, même pour les fonctions avec `SECURITY DEFINER`, car :

- Le schéma `cron` est un schéma système protégé
- L'API REST de Supabase peut avoir des restrictions supplémentaires
- Les permissions SQL ne garantissent pas l'accès via l'API REST

---

## ✅ Solution : Edge Function

Création d'une **Edge Function Supabase** qui :

- ✅ Utilise le **service role key** pour appeler les fonctions SQL
- ✅ Vérifie l'authentification de l'utilisateur
- ✅ Contourne les restrictions de l'API REST
- ✅ Maintient la sécurité avec validation des jobs autorisés

---

## 📁 Fichiers Créés

### 1. Edge Function

**Fichier** : `supabase/functions/manage-email-tags-cron-jobs/index.ts`

Cette fonction expose deux actions :

- `get_status` : Récupère le statut des cron jobs
- `toggle` : Active/désactive un cron job

### 2. Composant React Modifié

**Fichier** : `src/components/email/EmailTagsDashboard.tsx`

Le composant utilise maintenant l'Edge Function au lieu des appels RPC directs :

- `loadData()` : Appelle l'Edge Function pour récupérer le statut
- `handleToggleCronJob()` : Appelle l'Edge Function pour modifier l'état

---

## 🚀 Déploiement

### Étape 1 : Déployer l'Edge Function

Via Supabase CLI :

```bash
supabase functions deploy manage-email-tags-cron-jobs
```

Via Supabase Dashboard :

1. Allez dans **Edge Functions**
2. Cliquez sur **Create a new function**
3. Nommez-la `manage-email-tags-cron-jobs`
4. Copiez-collez le contenu de `index.ts`
5. Cliquez sur **Deploy**

### Étape 2 : Vérifier le Déploiement

Testez l'Edge Function :

```bash
curl -X GET \
  "https://YOUR_PROJECT.supabase.co/functions/v1/manage-email-tags-cron-jobs?action=get_status" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Étape 3 : Recharger l'Application

Rechargez complètement la page "Gestion des Tags Email" dans votre application.

---

## 🔍 Comment ça fonctionne

### Flux d'authentification

1. L'utilisateur se connecte et obtient un `access_token`
2. Le composant React appelle l'Edge Function avec ce token
3. L'Edge Function vérifie l'authentification de l'utilisateur
4. Si valide, l'Edge Function utilise le **service role key** pour appeler les fonctions SQL
5. Les fonctions SQL s'exécutent avec les permissions du superutilisateur
6. Le résultat est retourné à l'utilisateur

### Sécurité

- ✅ L'utilisateur doit être authentifié
- ✅ Seuls les jobs autorisés peuvent être modifiés
- ✅ Le service role key n'est jamais exposé au client
- ✅ Validation des paramètres d'entrée

---

## 📊 Avantages de cette Solution

1. **Contourne les restrictions** : Utilise le service role key côté serveur
2. **Sécurisé** : Vérifie l'authentification et valide les entrées
3. **Maintenable** : Code centralisé dans une Edge Function
4. **Évolutif** : Facile d'ajouter de nouvelles actions
5. **Robuste** : Gestion d'erreurs complète

---

## 🔄 Migration depuis RPC

Le composant React a été modifié pour utiliser l'Edge Function. Les anciens appels RPC sont remplacés par des appels HTTP à l'Edge Function.

### Avant (RPC direct)

```typescript
const { data, error } = await supabase.rpc('toggle_email_tags_cron_job', {
  p_job_name: jobName,
  p_active: !active,
});
```

### Après (Edge Function)

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/manage-email-tags-cron-jobs?action=toggle`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      job_name: jobName,
      active: !active,
    }),
  }
);
```

---

## ✅ Vérification Post-Déploiement

1. ✅ L'Edge Function est déployée et accessible
2. ✅ La page "Gestion des Tags Email" se charge sans erreur
3. ✅ L'onglet "Cron Jobs" affiche les 3 cron jobs
4. ✅ Les boutons "Activer/Désactiver" fonctionnent
5. ✅ Aucune erreur 403 dans la console

---

## 📝 Notes Importantes

- Les fonctions SQL (`get_email_tags_cron_jobs_status`, `toggle_email_tags_cron_job`) restent nécessaires et doivent être configurées avec les bonnes permissions
- L'Edge Function est un wrapper qui appelle ces fonctions avec le service role key
- Cette solution est plus robuste que les appels RPC directs pour les schémas système

---

**Fichiers à déployer** :

- `supabase/functions/manage-email-tags-cron-jobs/index.ts` (Edge Function)
- `src/components/email/EmailTagsDashboard.tsx` (déjà modifié)
