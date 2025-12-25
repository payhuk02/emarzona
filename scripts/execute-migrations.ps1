# Script PowerShell pour exécuter les migrations Supabase
# Date: 31/01/2025

Write-Host "🚀 Exécution des migrations Supabase" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Supabase CLI est installé
$supabaseVersion = supabase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI n'est pas installé" -ForegroundColor Red
    Write-Host "Installez-le via: scoop install supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI installé: $supabaseVersion" -ForegroundColor Green
Write-Host ""

# Vérifier la connexion
Write-Host "🔍 Vérification de la connexion..." -ForegroundColor Cyan
$projects = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur de connexion. Essayez: supabase login" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Connecté à Supabase" -ForegroundColor Green
Write-Host ""

# Afficher les migrations en attente
Write-Host "📋 Migrations en attente:" -ForegroundColor Cyan
supabase migration list
Write-Host ""

# Demander confirmation
$confirmation = Read-Host "Voulez-vous exécuter les migrations? (O/N)"
if ($confirmation -ne "O" -and $confirmation -ne "o" -and $confirmation -ne "Y" -and $confirmation -ne "y") {
    Write-Host "❌ Opération annulée" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔄 Exécution des migrations..." -ForegroundColor Cyan
Write-Host ""

# Exécuter les migrations
supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migrations exécutées avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Vérification de l'état:" -ForegroundColor Cyan
    supabase migration list
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'exécution des migrations" -ForegroundColor Red
    Write-Host "Vérifiez les erreurs ci-dessus" -ForegroundColor Yellow
    exit 1
}

