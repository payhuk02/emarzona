# Script de nettoyage des clés API exposées dans la documentation
# Remplace toutes les clés Supabase réelles par des placeholders

Write-Host "NETTOYAGE DES CLES API EXPOSEES" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host ""

# Definir le repertoire racine du projet
$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

# Cles a remplacer
$exposedKeys = @{
    # Project ID
    "hbdnzajbyjakdhuavrvb" = "your-project-id"
    
    # URL complete
    "https://hbdnzajbyjakdhuavrvb.supabase.co" = "https://your-project-id.supabase.co"
    
    # Cle API complete
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM" = "your_supabase_anon_key_here"
    
    # Cle API tronquee (avec ...)
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." = "your_supabase_anon_key_here"
    
    # Dashboard URL
    "https://app.supabase.com/project/hbdnzajbyjakdhuavrvb" = "https://app.supabase.com/project/your-project-id"
}

# Patterns pour les variables d'environnement
$envPatterns = @{
    'VITE_SUPABASE_PROJECT_ID="hbdnzajbyjakdhuavrvb"' = 'VITE_SUPABASE_PROJECT_ID="your-project-id"'
    'VITE_SUPABASE_PROJECT_ID=hbdnzajbyjakdhuavrvb' = 'VITE_SUPABASE_PROJECT_ID=your-project-id'
    'VITE_SUPABASE_URL="https://hbdnzajbyjakdhuavrvb.supabase.co"' = 'VITE_SUPABASE_URL="https://your-project-id.supabase.co"'
    'VITE_SUPABASE_URL=https://hbdnzajbyjakdhuavrvb.supabase.co' = 'VITE_SUPABASE_URL=https://your-project-id.supabase.co'
    'VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM"' = 'VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_anon_key_here"'
    'VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgyMzEsImV4cCI6MjA3MzE3NDIzMX0.myur8r50wIORQwfcCP4D1ZxlhKFxICdVqjUM80CgtnM' = 'VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here'
}

# Trouver tous les fichiers .md
$mdFiles = Get-ChildItem -Path $rootDir -Filter "*.md" -Recurse | Where-Object {
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\.git\\" -and
    $_.FullName -notmatch "\\dist\\" -and
    $_.FullName -notmatch "\\payhula-backup"
}

Write-Host "Fichiers trouves: $($mdFiles.Count)" -ForegroundColor Cyan
Write-Host ""

# Compteurs
$filesModified = 0
$totalReplacements = 0
$modifiedFiles = @()

# Traiter chaque fichier
foreach ($file in $mdFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileReplacements = 0
    
    # Remplacer les clés exposées
    foreach ($key in $exposedKeys.Keys) {
        if ($content -match [regex]::Escape($key)) {
            $content = $content -replace [regex]::Escape($key), $exposedKeys[$key]
            $fileReplacements++
            $totalReplacements++
        }
    }
    
    # Remplacer les patterns de variables d'environnement
    foreach ($pattern in $envPatterns.Keys) {
        if ($content -match [regex]::Escape($pattern)) {
            $content = $content -replace [regex]::Escape($pattern), $envPatterns[$pattern]
            $fileReplacements++
            $totalReplacements++
        }
    }
    
    # Sauvegarder si modifié
    if ($content -ne $originalContent) {
        try {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            $filesModified++
            $modifiedFiles += $file.Name
            Write-Host "[OK] Netoye: $($file.Name) ($fileReplacements remplacements)" -ForegroundColor Green
        }
        catch {
            Write-Host "[ERROR] Erreur lors du nettoyage de $($file.Name): $_" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "RESUME" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "Fichiers analyses: $($mdFiles.Count)" -ForegroundColor Cyan
Write-Host "Fichiers modifies: $filesModified" -ForegroundColor Green
Write-Host "Total remplacements: $totalReplacements" -ForegroundColor Green
Write-Host ""

if ($filesModified -gt 0) {
    Write-Host "Fichiers modifies:" -ForegroundColor Yellow
    foreach ($file in $modifiedFiles) {
        Write-Host "  - $file" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "[OK] NETTOYAGE TERMINE" -ForegroundColor Green
    Write-Host ""
    Write-Host "[!] ACTION REQUISE:" -ForegroundColor Yellow
    Write-Host "1. Verifier les modifications avec: git diff" -ForegroundColor White
    Write-Host "2. Commit les changements: git add ." -ForegroundColor White
    Write-Host "   Puis: git commit -m 'security: remove exposed API keys from documentation'" -ForegroundColor White
    Write-Host "3. Push vers GitHub: git push" -ForegroundColor White
    Write-Host "4. Regenerer les cles Supabase dans le Dashboard" -ForegroundColor White
    Write-Host "5. Mettre a jour Vercel avec les nouvelles cles" -ForegroundColor White
}
else {
    Write-Host "[INFO] Aucun fichier a nettoyer (deja nettoyes ou pas de cles trouvees)" -ForegroundColor Cyan
}

Write-Host ""
