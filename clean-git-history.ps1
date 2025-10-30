# ============================================================================
# SCRIPT DE NETTOYAGE HISTORIQUE GIT - CLÉS SUPABASE
# ============================================================================
# Ce script retire le fichier .env de tout l'historique Git
# ATTENTION : Réécrit l'historique Git (destructif)
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NETTOYAGE HISTORIQUE GIT - .env" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# ÉTAPE 1 : VÉRIFICATIONS PRÉALABLES
# ============================================================================

Write-Host "[1/7] Vérifications préalables..." -ForegroundColor Yellow

# Vérifier si on est dans un repo Git
if (-not (Test-Path ".git")) {
    Write-Host "ERREUR: Pas de dossier .git trouvé. Êtes-vous dans le bon répertoire ?" -ForegroundColor Red
    exit 1
}

# Vérifier si le repo est clean
$status = git status --porcelain
if ($status) {
    Write-Host "ERREUR: Vous avez des changements non committés." -ForegroundColor Red
    Write-Host "Veuillez commit ou stash vos changements avant de continuer." -ForegroundColor Red
    Write-Host ""
    git status
    exit 1
}

Write-Host "✅ Repo Git propre" -ForegroundColor Green

# ============================================================================
# ÉTAPE 2 : BACKUP DE SÉCURITÉ
# ============================================================================

Write-Host ""
Write-Host "[2/7] Création d'un backup de sécurité..." -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "..\payhula_backup_$timestamp"

Write-Host "Copie du repo vers: $backupDir" -ForegroundColor Gray

try {
    Copy-Item -Path "." -Destination $backupDir -Recurse -Force
    Write-Host "✅ Backup créé avec succès" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Impossible de créer le backup" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# ============================================================================
# ÉTAPE 3 : INSTALLATION GIT-FILTER-REPO (SI NÉCESSAIRE)
# ============================================================================

Write-Host ""
Write-Host "[3/7] Vérification de git-filter-repo..." -ForegroundColor Yellow

# Vérifier si git-filter-repo est installé
$filterRepoInstalled = $false
try {
    git filter-repo --version 2>&1 | Out-Null
    $filterRepoInstalled = $true
    Write-Host "✅ git-filter-repo déjà installé" -ForegroundColor Green
} catch {
    Write-Host "⚠️  git-filter-repo non trouvé" -ForegroundColor Yellow
}

if (-not $filterRepoInstalled) {
    Write-Host ""
    Write-Host "Installation de git-filter-repo via pip..." -ForegroundColor Yellow
    
    # Vérifier si Python/pip est installé
    try {
        python --version | Out-Null
        pip --version | Out-Null
        
        Write-Host "Installation en cours..." -ForegroundColor Gray
        pip install git-filter-repo --quiet
        
        Write-Host "✅ git-filter-repo installé" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "ERREUR: Python/pip non trouvé." -ForegroundColor Red
        Write-Host ""
        Write-Host "OPTIONS:" -ForegroundColor Yellow
        Write-Host "1. Installer Python depuis https://www.python.org/downloads/" -ForegroundColor White
        Write-Host "2. OU utiliser BFG Repo-Cleaner (alternative)" -ForegroundColor White
        Write-Host ""
        Write-Host "Pour BFG :" -ForegroundColor Cyan
        Write-Host "  1. Télécharger: https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor White
        Write-Host "  2. Placer bfg.jar dans ce dossier" -ForegroundColor White
        Write-Host "  3. Relancer ce script" -ForegroundColor White
        Write-Host ""
        exit 1
    }
}

# ============================================================================
# ÉTAPE 4 : VÉRIFIER QUEL FICHIER .env EXISTE DANS L'HISTORIQUE
# ============================================================================

Write-Host ""
Write-Host "[4/7] Recherche de fichiers .env dans l'historique..." -ForegroundColor Yellow

# Chercher tous les fichiers .env* dans l'historique
$envFiles = @()
$gitLog = git log --all --pretty=format: --name-only --diff-filter=A | Sort-Object -Unique

foreach ($file in $gitLog) {
    if ($file -like ".env*" -and $file -notlike "*.example" -and $file -notlike "*.template") {
        $envFiles += $file
    }
}

if ($envFiles.Count -eq 0) {
    Write-Host "✅ Aucun fichier .env trouvé dans l'historique Git" -ForegroundColor Green
    Write-Host "Le repo est déjà propre !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Nettoyage du backup..." -ForegroundColor Gray
    Remove-Item -Path $backupDir -Recurse -Force
    exit 0
}

Write-Host "⚠️  Fichiers .env trouvés dans l'historique:" -ForegroundColor Yellow
foreach ($file in $envFiles) {
    Write-Host "   - $file" -ForegroundColor Red
}

# ============================================================================
# ÉTAPE 5 : CONFIRMATION UTILISATEUR
# ============================================================================

Write-Host ""
Write-Host "[5/7] Confirmation..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  ATTENTION: Cette opération va:" -ForegroundColor Red
Write-Host "   1. Réécrire tout l'historique Git" -ForegroundColor White
Write-Host "   2. Supprimer les fichiers .env de tous les commits" -ForegroundColor White
Write-Host "   3. Nécessiter un force push" -ForegroundColor White
Write-Host "   4. Tous les collaborateurs devront re-cloner le repo" -ForegroundColor White
Write-Host ""
Write-Host "✅ Backup créé dans: $backupDir" -ForegroundColor Green
Write-Host ""

$confirmation = Read-Host "Êtes-vous sûr de vouloir continuer? (tapez 'OUI' en majuscules)"

if ($confirmation -ne "OUI") {
    Write-Host ""
    Write-Host "Opération annulée par l'utilisateur." -ForegroundColor Yellow
    Write-Host "Nettoyage du backup..." -ForegroundColor Gray
    Remove-Item -Path $backupDir -Recurse -Force
    exit 0
}

# ============================================================================
# ÉTAPE 6 : NETTOYAGE DE L'HISTORIQUE
# ============================================================================

Write-Host ""
Write-Host "[6/7] Nettoyage de l'historique Git..." -ForegroundColor Yellow
Write-Host "Cela peut prendre quelques minutes..." -ForegroundColor Gray
Write-Host ""

try {
    # Construire la commande pour supprimer tous les fichiers .env
    $pathsToRemove = ($envFiles | ForEach-Object { "--path `"$_`"" }) -join " "
    
    # Exécuter git-filter-repo
    $command = "git filter-repo --invert-paths $pathsToRemove --force"
    
    Write-Host "Commande: $command" -ForegroundColor Gray
    Write-Host ""
    
    Invoke-Expression $command
    
    Write-Host ""
    Write-Host "✅ Historique nettoyé avec succès" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "ERREUR lors du nettoyage:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Le backup est disponible dans: $backupDir" -ForegroundColor Yellow
    Write-Host "Vous pouvez restaurer avec:" -ForegroundColor Yellow
    Write-Host "  Remove-Item -Path .git -Recurse -Force" -ForegroundColor White
    Write-Host "  Copy-Item -Path '$backupDir\.git' -Destination . -Recurse" -ForegroundColor White
    exit 1
}

# ============================================================================
# ÉTAPE 7 : RESTAURER L'ORIGIN REMOTE
# ============================================================================

Write-Host ""
Write-Host "[7/7] Restauration du remote origin..." -ForegroundColor Yellow

# git-filter-repo supprime le remote, il faut le rajouter
$remoteUrl = "https://github.com/payhuk02/payhula.git"

git remote add origin $remoteUrl 2>&1 | Out-Null

Write-Host "✅ Remote origin restauré" -ForegroundColor Green

# ============================================================================
# RÉSUMÉ ET INSTRUCTIONS
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  NETTOYAGE TERMINÉ AVEC SUCCÈS !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📊 RÉSUMÉ:" -ForegroundColor Cyan
Write-Host "   ✅ Fichiers .env supprimés de l'historique" -ForegroundColor White
Write-Host "   ✅ Remote origin restauré" -ForegroundColor White
Write-Host "   ✅ Backup disponible: $backupDir" -ForegroundColor White
Write-Host ""

Write-Host "🚀 PROCHAINES ÉTAPES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. VÉRIFIER le repo:" -ForegroundColor Yellow
Write-Host "   git log --all --oneline --graph" -ForegroundColor White
Write-Host ""
Write-Host "2. RECHERCHER .env dans l'historique:" -ForegroundColor Yellow
Write-Host "   git log --all --full-history -- .env" -ForegroundColor White
Write-Host "   (Ne devrait rien retourner)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. FORCE PUSH vers GitHub:" -ForegroundColor Yellow
Write-Host "   git push origin main --force" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  ATTENTION:" -ForegroundColor Red
Write-Host "   Après le force push, tous les collaborateurs devront:" -ForegroundColor White
Write-Host "   1. Sauvegarder leurs changements locaux" -ForegroundColor White
Write-Host "   2. Supprimer leur dossier local" -ForegroundColor White
Write-Host "   3. Re-cloner le repo: git clone https://github.com/payhuk02/payhula.git" -ForegroundColor White
Write-Host ""

Write-Host "📝 NOTES IMPORTANTES:" -ForegroundColor Cyan
Write-Host "   • Les clés Supabase sont retirées de l'historique Git" -ForegroundColor White
Write-Host "   • Mais elles peuvent avoir été copiées avant" -ForegroundColor White
Write-Host "   • Surveillez vos logs Supabase pour toute activité suspecte" -ForegroundColor White
Write-Host "   • Envisagez de régénérer les clés si activité douteuse" -ForegroundColor White
Write-Host ""

Write-Host "💾 BACKUP:" -ForegroundColor Cyan
Write-Host "   Un backup complet est disponible dans:" -ForegroundColor White
Write-Host "   $backupDir" -ForegroundColor Yellow
Write-Host "   Vous pouvez le supprimer après vérification." -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Demander si l'utilisateur veut faire le force push maintenant
Write-Host "Voulez-vous faire le FORCE PUSH maintenant? (o/n): " -ForegroundColor Yellow -NoNewline
$pushNow = Read-Host

if ($pushNow -eq "o" -or $pushNow -eq "O") {
    Write-Host ""
    Write-Host "Force push en cours..." -ForegroundColor Yellow
    
    try {
        git push origin main --force
        
        Write-Host ""
        Write-Host "✅ FORCE PUSH RÉUSSI !" -ForegroundColor Green
        Write-Host ""
        Write-Host "Les clés .env ont été supprimées de l'historique GitHub !" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  N'oubliez pas d'avertir vos collaborateurs de re-cloner le repo." -ForegroundColor Yellow
        Write-Host ""
        
    } catch {
        Write-Host ""
        Write-Host "ERREUR lors du push:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
        Write-Host "Vous pouvez réessayer manuellement avec:" -ForegroundColor Yellow
        Write-Host "  git push origin main --force" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host ""
    Write-Host "OK. Vous pouvez faire le force push plus tard avec:" -ForegroundColor Yellow
    Write-Host "  git push origin main --force" -ForegroundColor White
    Write-Host ""
}

Write-Host "Script terminé." -ForegroundColor Green
Write-Host ""

