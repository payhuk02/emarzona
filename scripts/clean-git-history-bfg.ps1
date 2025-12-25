# Script alternatif utilisant BFG Repo Cleaner pour nettoyer l'historique Git
# ATTENTION : Cette opération réécrit l'historique Git

param(
    [switch]$DryRun = $false
)

Write-Host "🔍 Nettoyage de l'historique Git avec BFG Repo Cleaner" -ForegroundColor Yellow
Write-Host ""

# Vérifier si BFG est installé
$bfgInstalled = $false
try {
    $null = bfg --version 2>&1
    $bfgInstalled = $true
} catch {
    Write-Host "⚠️  BFG Repo Cleaner n'est pas installé" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour installer BFG:" -ForegroundColor Cyan
    Write-Host "  choco install bfg" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ou télécharger depuis: https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Créer un backup
Write-Host "📦 Création d'un backup du dépôt..." -ForegroundColor Cyan
$backupDir = "payhula-backup-bfg-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
git clone --mirror . "$backupDir"
Write-Host "✅ Backup créé dans: $backupDir" -ForegroundColor Green
Write-Host ""

# Créer un fichier avec les patterns à supprimer
Write-Host "📝 Création du fichier de patterns..." -ForegroundColor Cyan
$patternsFile = "sensitive-patterns.txt"
@"
SUPABASE_URL=.*
SUPABASE_ANON_KEY=.*
SUPABASE_SERVICE_ROLE_KEY=.*
VITE_SUPABASE_URL=.*
VITE_SUPABASE_ANON_KEY=.*
VITE_SUPABASE_SERVICE_ROLE_KEY=.*
"@ | Out-File -FilePath $patternsFile -Encoding UTF8
Write-Host "✅ Fichier créé: $patternsFile" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 MODE DRY-RUN : Aucune modification ne sera effectuée" -ForegroundColor Yellow
    Write-Host ""
}

# Demander confirmation
if (-not $DryRun) {
    Write-Host "⚠️  ATTENTION : Cette opération va réécrire l'historique Git" -ForegroundColor Red
    Write-Host "   - Tous les collaborateurs devront re-cloner le dépôt" -ForegroundColor Red
    Write-Host "   - Les pull requests ouverts devront être recréés" -ForegroundColor Red
    Write-Host ""
    $confirmation = Read-Host "Voulez-vous continuer ? (oui/non)"
    if ($confirmation -ne "oui") {
        Write-Host "❌ Opération annulée" -ForegroundColor Red
        Remove-Item $patternsFile -ErrorAction SilentlyContinue
        exit 0
    }
}

# Nettoyer avec BFG
Write-Host "🧹 Nettoyage avec BFG..." -ForegroundColor Cyan
if (-not $DryRun) {
    try {
        # Créer un clone bare pour BFG
        $bfgRepo = "payhula-bfg-repo"
        git clone --mirror . "$bfgRepo"
        
        # Exécuter BFG
        bfg --replace-text $patternsFile "$bfgRepo"
        
        # Nettoyer les références
        Push-Location "$bfgRepo"
        git reflog expire --expire=now --all
        git gc --prune=now --aggressive
        Pop-Location
        
        Write-Host "✅ BFG terminé avec succès" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  Pour appliquer les changements, vous devez :" -ForegroundColor Yellow
        Write-Host "1. Copier le contenu de $bfgRepo vers le dépôt principal" -ForegroundColor Cyan
        Write-Host "2. Forcer la mise à jour du dépôt distant" -ForegroundColor Cyan
        Write-Host ""
    } catch {
        Write-Host "❌ Erreur lors de l'exécution de BFG : $_" -ForegroundColor Red
    }
} else {
    Write-Host "🔍 Mode DRY-RUN : BFG serait exécuté avec:" -ForegroundColor Yellow
    Write-Host "   bfg --replace-text $patternsFile <repo>" -ForegroundColor Gray
}

# Nettoyer
Remove-Item $patternsFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Script terminé !" -ForegroundColor Green

