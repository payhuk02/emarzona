# Edge Function: check-ssl-expiration

## Description

Cette Edge Function vérifie périodiquement l'expiration des certificats SSL pour tous les domaines personnalisés configurés et envoie des alertes email aux propriétaires de boutiques.

## Fonctionnalités

- ✅ Vérification automatique de l'expiration des certificats SSL
- ✅ Détection des certificats expirés
- ✅ Détection des certificats expirant dans moins de 30 jours
- ✅ Envoi d'alertes email personnalisées par boutique
- ✅ Respect des paramètres de notifications configurés par boutique
- ✅ Mise à jour automatique du statut SSL dans la base de données

## Configuration

### Déploiement

```bash
supabase functions deploy check-ssl-expiration
```

### Configuration du Cron Job

Cette fonction doit être appelée périodiquement via un cron job Supabase.

**Recommandation :** Vérifier une fois par jour

```sql
-- Créer un cron job pour vérifier l'expiration SSL quotidiennement à 9h00
INSERT INTO cron.job (id, schedule, command, nodename, nodeport, database, username, active, jobname, description)
VALUES (
  22, -- ID unique
  '0 9 * * *', -- Tous les jours à 9h00
  $$SELECT net.http_post(
    url:='https://<project-ref>.supabase.co/functions/v1/check-ssl-expiration',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <service-role-key>"}'::jsonb,
    body:='{}'::jsonb
  )$$,
  'localhost',
  5432,
  'postgres',
  'postgres',
  true,
  'check-ssl-expiration-daily',
  'Vérifie quotidiennement l''expiration des certificats SSL'
);
```

### Variables d'Environnement

Aucune variable d'environnement spécifique requise. La fonction utilise :

- `SUPABASE_URL` (automatique)
- `SUPABASE_SERVICE_ROLE_KEY` (automatique)
- `SITE_URL` (optionnel, pour les liens dans les emails)

## Utilisation

### Appel Manuel

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/check-ssl-expiration \
  -H "Authorization: Bearer <anon-key>"
```

### Réponse

```json
{
  "message": "SSL expiration check completed",
  "checked": 5,
  "expiring_soon": 2,
  "expired": 0,
  "alerts_sent": 2,
  "domains": ["example.com", "test.com"]
}
```

## Paramètres de Notifications

Les alertes respectent les paramètres configurés dans `store_notification_settings` :

- `email_enabled` : Active/désactive toutes les notifications
- `email_ssl_expiring` : Active/désactive les alertes d'expiration prochaine
- `email_ssl_expired` : Active/désactive les alertes de certificat expiré
- `notification_email` : Email de destination (si différent du contact_email)

## Types d'Alertes

1. **Certificat expirant** : Envoyée si le certificat expire dans moins de 30 jours
2. **Certificat expiré** : Envoyée immédiatement si le certificat est expiré

Les alertes sont envoyées via la fonction `send-email` avec le template `ssl-alert`.

## Améliorations Futures

- [ ] Table `store_ssl_alerts` pour éviter les alertes dupliquées
- [ ] Support des alertes multiples (7 jours, 14 jours, 30 jours avant expiration)
- [ ] Intégration avec système de renouvellement automatique SSL
- [ ] Dashboard de monitoring SSL avec statistiques

## Dépannage

### Aucune alerte envoyée

1. Vérifiez que les certificats SSL sont enregistrés dans `ssl_certificate_status`
2. Vérifiez que `certificate_expires_at` est défini
3. Vérifiez que `email_enabled` est `true` dans `store_notification_settings`
4. Vérifiez les logs de la fonction pour les erreurs

### Erreurs d'envoi d'email

1. Vérifiez que la fonction `send-email` est déployée
2. Vérifiez que le template `ssl-alert` existe
3. Vérifiez que l'email de notification est valide
