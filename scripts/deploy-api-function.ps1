# Script de déploiement de l'Edge Function API (PowerShell)
# Date: 28 Janvier 2025

Write-Host "🚀 Déploiement de l'Edge Function API Publique..." -ForegroundColor Cyan

# Vérifier que Supabase CLI est installé
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI n'est pas installé" -ForegroundColor Red
    Write-Host "Installez-le avec: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "supabase/functions/api/v1/index.ts")) {
    Write-Host "❌ Fichier Edge Function non trouvé" -ForegroundColor Red
    Write-Host "Assurez-vous d'être dans la racine du projet" -ForegroundColor Yellow
    exit 1
}

# Appliquer les migrations SQL
Write-Host "📦 Application des migrations SQL..." -ForegroundColor Cyan
supabase db push

# Déployer l'Edge Function
Write-Host "🚀 Déploiement de l'Edge Function..." -ForegroundColor Cyan
supabase functions deploy api/v1

Write-Host "✅ Déploiement terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Créez une clé API via SQL:"
Write-Host "   SELECT * FROM create_api_key("
Write-Host "     p_user_id := auth.uid(),"
Write-Host "     p_store_id := 'VOTRE_STORE_ID',"
Write-Host "     p_name := 'Ma clé API'"
Write-Host "   );"
Write-Host ""
Write-Host "2. Testez l'API:"
Write-Host "   curl -X GET 'https://[PROJECT_REF].supabase.co/functions/v1/api/v1/products' \"
Write-Host "     -H 'Authorization: Bearer VOTRE_CLE_API'"

