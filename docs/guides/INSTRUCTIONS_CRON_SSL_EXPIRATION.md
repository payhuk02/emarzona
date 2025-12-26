# Instructions : Configuration Cron Job SSL Expiration

## 🎯 Méthode Simple en 2 Étapes

### Étape 1 : Créer la Fonction Helper

Exécutez ce script dans le SQL Editor de Supabase :

**Fichier :** `supabase/migrations/20250202_setup_ssl_expiration_check_cron_SIMPLE.sql`

Ce script crée la fonction `setup_ssl_expiration_check_cron()` avec `SECURITY DEFINER` pour contourner les problèmes de permission.

### Étape 2 : Utiliser la Fonction

Une fois la fonction créée, exécutez cette commande (remplacez `YOUR_SERVICE_ROLE_KEY` par votre vraie clé) :

```sql
SELECT * FROM setup_ssl_expiration_check_cron('YOUR_SERVICE_ROLE_KEY');
```

**Où trouver votre Service Role Key :**

- Dashboard Supabase → Settings → API
- Section "Project API keys" → `service_role` (secret)
- Cliquez sur l'icône 👁️ pour révéler et copier

## ✅ Vérification

Après exécution, vous devriez voir une ligne avec :

- `active: true`
- `schedule: 0 9 * * *`
- `jobname: check-ssl-expiration-daily`

## 🧪 Test Immédiat

Testez manuellement la fonction Edge Function :

1. Dashboard → Edge Functions → check-ssl-expiration
2. Cliquez sur "Invoke"
3. Cliquez sur "Run Function"
4. Vérifiez les logs

## 🔄 Méthode Alternative : Dashboard

Si vous préférez éviter SQL, utilisez le Dashboard :

- Voir : `docs/guides/CONFIGURATION_CRON_SSL_EXPIRATION_VIA_DASHBOARD.md`

---

**Date :** 2025-02-02
