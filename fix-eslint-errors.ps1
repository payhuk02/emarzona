# Script PowerShell pour corriger automatiquement les erreurs ESLint courantes
# Usage: .\fix-eslint-errors.ps1

Write-Host "🔧 Correction automatique des erreurs ESLint..." -ForegroundColor Cyan

# Fonction pour remplacer error: any par error: unknown avec vérification
function Fix-CatchErrors {
    param($FilePath)
    
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    $originalContent = $content
    
    # Pattern 1: catch (error: any) avec error.message
    $content = $content -replace 'catch \(error: any\) \{[^}]*error\.message([^}]*)\}', {
        param($match)
        $body = $match.Groups[1].Value
        $body = $body -replace 'error\.message', "error instanceof Error ? error.message : 'Une erreur est survenue'"
        "catch (error: unknown) {`n      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';$body"
    }
    
    # Pattern 2: catch (err: any)
    $content = $content -replace 'catch \(err: any\)', 'catch (err: unknown)'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $FilePath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✅ Corrigé: $FilePath" -ForegroundColor Green
        return $true
    }
    return $false
}

# Trouver tous les fichiers TypeScript/TSX
$files = Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Where-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    $content -match 'catch.*error: any|catch.*err: any'
}

$count = 0
foreach ($file in $files) {
    if (Fix-CatchErrors -FilePath $file.FullName) {
        $count++
    }
}

Write-Host "`n✨ $count fichiers corrigés !" -ForegroundColor Green






