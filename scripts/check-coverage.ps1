# Script pour vérifier la couverture de tests
# Affiche un résumé de la couverture et identifie les zones à améliorer

Write-Host "[INFO] Verification de la couverture de tests..." -ForegroundColor Cyan

# Exécuter les tests avec couverture
$coverageOutput = npm run test:coverage 2>&1

# Afficher le résumé
Write-Host "`n[INFO] Résumé de la couverture:" -ForegroundColor Yellow
$coverageOutput | Select-String -Pattern "Statements|Branches|Functions|Lines|Coverage" | ForEach-Object {
    Write-Host $_.Line -ForegroundColor Gray
}

# Vérifier si la couverture est suffisante (objectif: 50%)
$coverageMatch = $coverageOutput | Select-String -Pattern "All files\s+\|\s+(\d+\.\d+)"
if ($coverageMatch) {
    $coverage = [double]$coverageMatch.Matches[0].Groups[1].Value
    if ($coverage -ge 50) {
        Write-Host "`n[OK] Couverture: $coverage% (Objectif atteint: >= 50%)" -ForegroundColor Green
    } else {
        Write-Host "`n[WARN] Couverture: $coverage% (Objectif: >= 50%)" -ForegroundColor Yellow
        Write-Host "[INFO] Amélioration recommandée" -ForegroundColor Gray
    }
}

Write-Host "`n[INFO] Rapport détaillé disponible dans coverage/" -ForegroundColor Cyan


