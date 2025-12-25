# Script pour migrer les imports lucide-react vers l'index centralisé
# Remplace les imports directs par des imports depuis @/components/icons

Write-Host "[INFO] Migration des imports lucide-react vers l'index centralise..." -ForegroundColor Cyan

$iconIndexPath = "src\components\icons\index.ts"
$iconIndexContent = Get-Content $iconIndexPath -Raw

# Extraire toutes les icônes exportées de l'index
$exportedIcons = @()
$exportMatches = [regex]::Matches($iconIndexContent, 'export\s*\{([^}]+)\}')
foreach ($match in $exportMatches) {
    $icons = $match.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() }
    $exportedIcons += $icons
}

Write-Host "[INFO] $($exportedIcons.Count) icones disponibles dans l'index" -ForegroundColor Yellow

# Fonction pour vérifier si toutes les icônes d'un import sont dans l'index
function AllIconsInIndex($importLine) {
    if ($importLine -notmatch 'from\s+[''"]lucide-react[''"]') {
        return $false
    }
    
    if ($importLine -match '\{([^}]+)\}') {
        $icons = $matches[1] -split ',' | ForEach-Object { $_.Trim() -replace 'as\s+\w+', '' }
        foreach ($icon in $icons) {
            if ($exportedIcons -notcontains $icon) {
                return $false
            }
        }
        return $true
    }
    return $false
}

# Fonction pour migrer un import
function MigrateImport($filePath) {
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    $migrated = $false
    
    # Pattern pour trouver les imports lucide-react
    $importPattern = 'import\s+(\{[^}]+\})\s+from\s+[''"]lucide-react[''"]'
    $matches = [regex]::Matches($content, $importPattern)
    
    foreach ($match in $matches) {
        $importLine = $match.Value
        if (AllIconsInIndex $importLine) {
            $newImport = $importLine -replace 'from\s+[''"]lucide-react[''"]', 'from ''@/components/icons'''
            $content = $content -replace [regex]::Escape($importLine), $newImport
            $migrated = $true
        }
    }
    
    if ($migrated) {
        Set-Content -Path $filePath -Value $content -NoNewline
        return $true
    }
    return $false
}

# Trouver tous les fichiers .tsx et .ts dans src/components
$files = Get-ChildItem -Path "src\components" -Recurse -Include "*.tsx", "*.ts" -File | Where-Object {
    $_.FullName -notmatch '\\__tests__\\' -and
    $_.FullName -notmatch '\\icons\\index\.ts$'
}

$migratedCount = 0
foreach ($file in $files) {
    if (MigrateImport $file.FullName) {
        $migratedCount++
        Write-Host "  [OK] $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "`n[OK] $migratedCount fichiers migres" -ForegroundColor Green

