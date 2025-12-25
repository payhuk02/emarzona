# Script pour vérifier que l'historique Git est propre
# Vérifie l'absence de fichiers sensibles dans l'historique

param(
    [string[]]$SensitiveFiles = @(".env", ".env.local", ".env.production", ".env.development"),
    [string[]]$SensitivePatterns = @(
        "SUPABASE_URL=",
        "SUPABASE_ANON_KEY=",
        "SUPABASE_SERVICE_ROLE_KEY=",
        "VITE_SUPABASE_URL=",
        "VITE_SUPABASE_ANON_KEY=",
        "VITE_SUPABASE_SERVICE_ROLE_KEY="
    )
)

Write-Host "🔍 Vérification de l'historique Git" -ForegroundColor Cyan
Write-Host ""

$issuesFound = $false

# Vérifier les fichiers sensibles
Write-Host "📁 Vérification des fichiers sensibles..." -ForegroundColor Cyan
foreach ($file in $SensitiveFiles) {
    $commits = git log --all --full-history --oneline -- "$file" 2>&1 | Where-Object { $_ -notmatch "fatal" }
    if ($commits) {
        Write-Host "⚠️  Fichier trouvé dans l'historique: $file" -ForegroundColor Yellow
        $commits | Select-Object -First 3 | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
        $issuesFound = $true
    } else {
        Write-Host "✅ Fichier non trouvé: $file" -ForegroundColor Green
    }
}

Write-Host ""

# Vérifier les patterns sensibles dans les commits
Write-Host "🔍 Vérification des patterns sensibles dans les commits..." -ForegroundColor Cyan
foreach ($pattern in $SensitivePatterns) {
    $commits = git log --all --full-history --source -S "$pattern" --oneline 2>&1 | Where-Object { $_ -notmatch "fatal" }
    if ($commits) {
        Write-Host "⚠️  Pattern trouvé dans l'historique: $pattern" -ForegroundColor Yellow
        $commits | Select-Object -First 3 | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
        $issuesFound = $true
    } else {
        Write-Host "✅ Pattern non trouvé: $pattern" -ForegroundColor Green
    }
}

Write-Host ""

# Vérifier .gitignore
Write-Host "📋 Vérification de .gitignore..." -ForegroundColor Cyan
if (Test-Path ".gitignore") {
    $gitignore = Get-Content ".gitignore" -Raw
    $allFilesCovered = $true
    foreach ($file in $SensitiveFiles) {
        if ($gitignore -notmatch [regex]::Escape($file)) {
            Write-Host "⚠️  Fichier non ignoré: $file" -ForegroundColor Yellow
            $allFilesCovered = $false
            $issuesFound = $true
        } else {
            Write-Host "✅ Fichier ignoré: $file" -ForegroundColor Green
        }
    }
} else {
    Write-Host "⚠️  Fichier .gitignore introuvable" -ForegroundColor Yellow
    $issuesFound = $true
}

Write-Host ""

# Resume
if ($issuesFound) {
    Write-Host "ERREUR: Des problemes ont ete detectes dans l'historique Git" -ForegroundColor Red
    Write-Host "   Utilisez les scripts de nettoyage pour corriger" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "OK: Historique Git propre - Aucun fichier sensible detecte" -ForegroundColor Green
    exit 0
}

