# Script de déploiement de l'Edge Function store-by-domain
# Date: 1 Février 2025

Write-Host "🚀 Déploiement de l'Edge Function store-by-domain..." -ForegroundColor Cyan

# Vérifier que Supabase CLI est installé
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI n'est pas installé." -ForegroundColor Red
    Write-Host "📦 Installation: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Vérifier que le fichier existe
if (-not (Test-Path "supabase\functions\store-by-domain\index.ts")) {
    Write-Host "❌ Le fichier supabase\functions\store-by-domain\index.ts n'existe pas." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Fichier trouvé: supabase\functions\store-by-domain\index.ts" -ForegroundColor Green

# Vérifier la connexion à Supabase
Write-Host "`n🔍 Vérification de la connexion à Supabase..." -ForegroundColor Cyan
$supabaseStatus = supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Supabase CLI n'est pas connecté à un projet." -ForegroundColor Yellow
    Write-Host "💡 Assurez-vous d'être connecté: supabase login" -ForegroundColor Yellow
    Write-Host "💡 Ou liez votre projet: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Yellow
}

# Déployer l'Edge Function
Write-Host "`n📤 Déploiement de l'Edge Function..." -ForegroundColor Cyan
supabase functions deploy store-by-domain

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Edge Function déployée avec succès !" -ForegroundColor Green
    Write-Host "`n🔗 URL de l'Edge Function:" -ForegroundColor Cyan
    Write-Host "   https://[PROJECT_REF].supabase.co/functions/v1/store-by-domain" -ForegroundColor White
    
    Write-Host "`n🧪 Test de l'Edge Function:" -ForegroundColor Cyan
    Write-Host "   curl -X GET `"https://[PROJECT_REF].supabase.co/functions/v1/store-by-domain`" `" -ForegroundColor White
    Write-Host "     -H `"x-subdomain: test-boutique`"" -ForegroundColor White
    
    Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
    Write-Host "   Voir: docs/multi-tenant/ARCHITECTURE_MULTI_TENANT_SUBDOMAINS.md" -ForegroundColor White
} else {
    Write-Host "`n❌ Erreur lors du déploiement." -ForegroundColor Red
    Write-Host "💡 Vérifiez les logs ci-dessus pour plus de détails." -ForegroundColor Yellow
    exit 1
}
