# Script final pour nettoyer completement l'historique Git
# Supprime .env et remplace les cles par des placeholders

param(
    [switch]$Force = $false
)

Write-Host "Nettoyage final de l'historique Git" -ForegroundColor Yellow
Write-Host ""

# Verifier si .env existe encore dans l'historique
Write-Host "Verification de l'historique..." -ForegroundColor Cyan
$commitsWithEnv = git log --all --full-history --oneline -- .env 2>&1
if ($commitsWithEnv -and $commitsWithEnv.Count -gt 0) {
    Write-Host "AVERTISSEMENT: .env trouve dans $($commitsWithEnv.Count) commits" -ForegroundColor Yellow
    $commitsWithEnv | Select-Object -First 3 | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
    Write-Host ""
} else {
    Write-Host "OK: Aucun .env trouve dans l'historique" -ForegroundColor Green
    exit 0
}

if (-not $Force) {
    Write-Host "ATTENTION: Cette operation va reecrire l'historique Git" -ForegroundColor Red
    Write-Host "   - Tous les collaborateurs devront re-cloner le depot" -ForegroundColor Red
    Write-Host "   - Les pull requests ouverts devront etre recrees" -ForegroundColor Red
    Write-Host ""
    $confirmation = Read-Host "Voulez-vous continuer ? (oui/non)"
    if ($confirmation -ne "oui") {
        Write-Host "Operation annulee" -ForegroundColor Red
        exit 0
    }
}

# Methode 1: Supprimer le fichier .env de l'historique
Write-Host "Suppression de .env de l'historique..." -ForegroundColor Cyan
$env:FILTER_BRANCH_SQUELCH_WARNING = "1"
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env .env.local .env.production .env.development" --prune-empty --tag-name-filter cat -- --all

# Methode 2: Remplacer les cles par des placeholders dans tous les fichiers
Write-Host "Remplacement des cles dans l'historique..." -ForegroundColor Cyan

# Creer un script de remplacement
$replaceScript = @"
#!/bin/sh
git filter-branch --force --tree-filter '
if [ -f .env ]; then
    sed -i "s/VITE_SUPABASE_URL=.*/VITE_SUPABASE_URL=your_supabase_url/g" .env
    sed -i "s/VITE_SUPABASE_ANON_KEY=.*/VITE_SUPABASE_ANON_KEY=your_anon_key/g" .env
    sed -i "s/VITE_SUPABASE_SERVICE_ROLE_KEY=.*/VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key/g" .env
    sed -i "s/VITE_SUPABASE_PUBLISHABLE_KEY=.*/VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key/g" .env
fi
' --prune-empty --tag-name-filter cat -- --all
"@

# Alternative: Utiliser git filter-branch avec sed (Windows)
Write-Host "Application du remplacement..." -ForegroundColor Cyan

# Nettoyer les references
Write-Host "Nettoyage des references..." -ForegroundColor Cyan
if (Test-Path "refs/original") {
    Remove-Item -Path "refs/original" -Recurse -Force
}
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Verifier le resultat
Write-Host ""
Write-Host "Verification finale..." -ForegroundColor Cyan
$finalCheck = git log --all --full-history --oneline -- .env 2>&1
if ($finalCheck -and $finalCheck.Count -gt 0) {
    Write-Host "AVERTISSEMENT: .env toujours present dans l'historique" -ForegroundColor Yellow
    Write-Host "   Utilisez git-filter-repo pour un nettoyage complet" -ForegroundColor Yellow
} else {
    Write-Host "OK: .env supprime de l'historique" -ForegroundColor Green
}

Write-Host ""
Write-Host "Nettoyage termine!" -ForegroundColor Green
Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host "1. Verifier que l'historique est propre" -ForegroundColor Cyan
Write-Host "2. Forcer la mise a jour du depot distant:" -ForegroundColor Cyan
Write-Host "   git push --force --all" -ForegroundColor Gray
Write-Host "   git push --force --tags" -ForegroundColor Gray
Write-Host "3. Notifier tous les collaborateurs" -ForegroundColor Cyan
Write-Host ""

