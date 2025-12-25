# Script simple pour nettoyer l'historique Git des fichiers .env
# Utilise git filter-branch (methode standard)

param(
    [switch]$DryRun = $false
)

Write-Host "Nettoyage de l'historique Git des fichiers sensibles" -ForegroundColor Yellow
Write-Host ""

# Verifier si on est dans un depot Git
if (-not (Test-Path ".git")) {
    Write-Host "ERREUR: Ce n'est pas un depot Git" -ForegroundColor Red
    exit 1
}

# Creer un backup
Write-Host "Creation d'un backup du depot..." -ForegroundColor Cyan
$backupDir = "payhula-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item -Path . -Destination $backupDir -Recurse -Exclude @("node_modules", ".git", "dist")
Write-Host "Backup cree dans: $backupDir" -ForegroundColor Green
Write-Host ""

# Afficher les commits concernes
Write-Host "Commits contenant .env:" -ForegroundColor Cyan
git log --all --full-history --oneline -- .env | ForEach-Object {
    Write-Host "   $_" -ForegroundColor Gray
}
Write-Host ""

if ($DryRun) {
    Write-Host "MODE DRY-RUN : Aucune modification ne sera effectuee" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour effectuer le nettoyage, executez:" -ForegroundColor Cyan
    Write-Host "   .\scripts\clean-git-history-simple.ps1" -ForegroundColor Gray
    exit 0
}

# Demander confirmation
Write-Host "ATTENTION : Cette operation va reecrire l'historique Git" -ForegroundColor Red
Write-Host "   - Tous les collaborateurs devront re-cloner le depot" -ForegroundColor Red
Write-Host "   - Les pull requests ouverts devront etre recrees" -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "Voulez-vous continuer ? (oui/non)"
if ($confirmation -ne "oui") {
    Write-Host "Operation annulee" -ForegroundColor Red
    exit 0
}

# Methode 1: Utiliser git filter-branch (standard)
Write-Host "Nettoyage avec git filter-branch..." -ForegroundColor Cyan
Write-Host "   Suppression de .env de l'historique..." -ForegroundColor Gray

# Supprimer .env de l'historique
git filter-branch --force --index-filter `
    "git rm --cached --ignore-unmatch .env" `
    --prune-empty --tag-name-filter cat -- --all

# Nettoyer les references
Write-Host "Nettoyage des references..." -ForegroundColor Cyan
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "Nettoyage termine !" -ForegroundColor Green
Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host "1. Verifier que l'historique est propre:" -ForegroundColor Cyan
Write-Host "   .\scripts\verify-git-history-clean.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Si tout est correct, forcer la mise a jour du depot distant:" -ForegroundColor Cyan
Write-Host "   git push --force --all" -ForegroundColor Gray
Write-Host "   git push --force --tags" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Notifier tous les collaborateurs de re-cloner le depot" -ForegroundColor Cyan
Write-Host ""

