# Méthode Alternative : Configuration Cron Job SSL

## 🎯 Si vous avez des erreurs de permission

Si vous obtenez l'erreur `permission denied for table job`, utilisez l'une de ces méthodes alternatives :

## Méthode 1 : Via Dashboard Supabase (⭐ RECOMMANDÉ)

C'est la méthode la plus simple et la plus fiable. Voir le guide complet :
**`docs/guides/CONFIGURATION_CRON_SSL_EXPIRATION_VIA_DASHBOARD.md`**

## Méthode 2 : Via Fonction Helper

Une fonction SQL avec `SECURITY DEFINER` qui s'exécute avec les bonnes permissions.

### Étape 1 : Créer la fonction helper

Exécutez le script : `supabase/migrations/20250202_setup_ssl_expiration_check_cron_SECURE.sql`

### Étape 2 : Utiliser la fonction

```sql
-- Remplacer YOUR_SERVICE_ROLE_KEY par votre vraie clé
SELECT * FROM setup_ssl_expiration_check_cron('YOUR_SERVICE_ROLE_KEY');
```

Cette fonction :
- ✅ S'exécute avec les permissions nécessaires
- ✅ Crée ou met à jour le cron job automatiquement
- ✅ Retourne les informations du cron job créé

## Méthode 3 : Via Supabase CLI (si disponible)

```bash
supabase db execute --file supabase/migrations/20250202_setup_ssl_expiration_check_cron.sql
```

---

**Recommandation :** Utilisez la **Méthode 1 (Dashboard)** si possible, c'est la plus simple et la plus fiable.

