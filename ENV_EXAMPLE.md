# 📋 Variables d'Environnement - Emarzona

> **Note**: Ce fichier remplace `.env.example` (bloqué par gitignore).  
> Copiez ces variables dans votre fichier `.env` à la racine du projet.

## 🚀 Configuration Rapide

```bash
# Créer le fichier .env
cp ENV_EXAMPLE.md .env
# Puis éditer .env avec vos valeurs
```

---

## 📝 Variables Requises

### Supabase (OBLIGATOIRE)

```env
# Obtenez ces valeurs depuis: https://app.supabase.com/project/_/settings/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key-here
```

---

## 🔧 Variables Optionnelles

### Moneroo (Paiements)

```env
# Configuration Moneroo pour les paiements
# Note: Les clés API doivent être configurées dans Supabase Edge Functions
# Voir: docs/GUIDE_CONFIGURATION_MONEROO.md
VITE_MONEROO_API_URL=https://api.moneroo.com
VITE_MONEROO_TIMEOUT_MS=30000
VITE_MONEROO_MAX_RETRIES=3
VITE_MONEROO_RETRY_BACKOFF_MS=1000
VITE_MONEROO_CACHE_TTL_MS=300000
VITE_MONEROO_CACHE_MAX_SIZE=100
VITE_MONEROO_RATE_LIMIT_MAX=100
VITE_MONEROO_RATE_LIMIT_WINDOW_MS=60000
VITE_MONEROO_RATE_LIMIT_USER_MAX=10
VITE_MONEROO_RATE_LIMIT_STORE_MAX=50
```

### Sentry (Monitoring - Recommandé pour Production)

```env
# Monitoring d'erreurs et performance
# Obtenez ces valeurs depuis: https://sentry.io/settings/
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_ORG=your-org-slug
VITE_SENTRY_PROJECT=your-project-slug
# Token pour upload des source maps (production uniquement)
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### Google Maps (Géocodage - Optionnel)

```env
# Clé API Google Maps pour le géocodage automatique d'adresses
# Obtenez-la depuis: https://console.cloud.google.com/google/maps-apis/credentials
# Activez l'API "Geocoding API" dans votre projet Google Cloud
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### Crisp (Chat en Direct)

```env
# Chat en direct
# Obtenez l'ID depuis: https://app.crisp.chat/settings/website/
VITE_CRISP_WEBSITE_ID=
```

### Feature Flags (Fonctionnalités Expérimentales)

```env
# Activez/désactivez des fonctionnalités expérimentales
VITE_FEATURE_NEW_CHECKOUT=false
VITE_FEATURE_ADVANCED_ANALYTICS=false
```

### Environnement

```env
# development | production | test
NODE_ENV=development
MODE=development
```

---

## ⚠️ Notes Importantes

1. **NE COMMITEZ JAMAIS** le fichier `.env` dans Git
2. Les clés API PayDunya/Moneroo doivent être dans Supabase Edge Functions (pas dans `.env`)
3. En production, utilisez les variables d'environnement de votre hébergeur (Vercel, Netlify, etc.)
4. Pour plus d'informations, consultez:
   - `docs/INSTALLATION.md`
   - `docs/SECURITY.md`
   - `docs/GUIDE_CONFIGURATION_MONEROO.md`

---

## 🔗 Liens Utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Sentry](https://docs.sentry.io/)
- [Documentation Crisp](https://docs.crisp.chat/)

---

_Dernière mise à jour: 2025-01-30_
