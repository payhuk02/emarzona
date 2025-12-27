# Script pour créer le fichier .env.example
# Exécuter: powershell -ExecutionPolicy Bypass -File scripts/create-env-example.ps1

$rootDir = Split-Path -Parent $PSScriptRoot
$envExamplePath = Join-Path $rootDir ".env.example"

$content = @"
# ==============================================
# PAYHULA - VARIABLES D'ENVIRONNEMENT
# ==============================================
# Copiez ce fichier en .env et remplissez les valeurs
# NE JAMAIS COMMIT LE FICHIER .env !

# ==============================================
# SUPABASE (OBLIGATOIRE)
# ==============================================
# Récupérez ces valeurs depuis : https://app.supabase.com/project/YOUR_PROJECT/settings/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
# Optionnel : Project ID (peut être extrait de l'URL)
VITE_SUPABASE_PROJECT_ID=your-project-id

# ==============================================
# PAIEMENTS (OBLIGATOIRE POUR PRODUCTION)
# ==============================================
# Moneroo
# Note: la clé API doit être configurée côté Supabase (Edge Functions Secrets) en production.
# Ne pas hardcoder de secrets côté frontend.
VITE_MONEROO_API_KEY=your_moneroo_api_key

# ==============================================
# SHIPPING (OPTIONNEL)
# ==============================================
VITE_FEDEX_API_KEY=your_fedex_api_key
VITE_FEDEX_ACCOUNT_NUMBER=your_fedex_account_number

# ==============================================
# ANALYTICS (OPTIONNEL)
# ==============================================
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_FB_PIXEL_ID=your_facebook_pixel_id
VITE_TIKTOK_PIXEL_ID=your_tiktok_pixel_id

# ==============================================
# MONITORING (RECOMMANDÉ POUR PRODUCTION)
# ==============================================
VITE_SENTRY_DSN=https://your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
VITE_SENTRY_ORG=your_organization_name
VITE_SENTRY_PROJECT=payhula

# ==============================================
# EMAIL (OPTIONNEL)
# ==============================================
VITE_SENDGRID_API_KEY=your_sendgrid_api_key

# ==============================================
# CDN (OPTIONNEL - Phase 1 Optimisations)
# ==============================================
VITE_CDN_ENABLED=false
VITE_CDN_BASE_URL=https://cdn.emarzona.com
VITE_CDN_PROVIDER=cloudflare
VITE_CDN_IMAGE_OPTIMIZATION=true
VITE_CDN_VIDEO_OPTIMIZATION=true
VITE_CDN_FONT_OPTIMIZATION=true

# ==============================================
# APM MONITORING (OPTIONNEL - Phase 1 Optimisations)
# ==============================================
VITE_APM_ENABLED=true
VITE_APM_WEB_VITALS=true
VITE_APM_PERFORMANCE=true

# ==============================================
# DÉVELOPPEMENT
# ==============================================
NODE_ENV=development
VITE_APP_URL=http://localhost:8080
VITE_APP_VERSION=1.0.0

# ==============================================
# PRODUCTION
# ==============================================
# NODE_ENV=production
# VITE_APP_URL=https://emarzona.com
"@

try {
    Set-Content -Path $envExamplePath -Value $content -Encoding UTF8
    Write-Host "[OK] Fichier .env.example cree avec succes" -ForegroundColor Green
    Write-Host "Emplacement: $envExamplePath" -ForegroundColor Cyan
}
catch {
    Write-Host "[ERROR] Erreur lors de la creation du fichier: $_" -ForegroundColor Red
}

