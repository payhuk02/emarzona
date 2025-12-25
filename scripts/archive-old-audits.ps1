# Script d'archivage des anciens audits
# Déplace les audits non-2025 dans docs/audits/archive/

Write-Host "[INFO] Archivage des anciens audits..." -ForegroundColor Cyan

$archiveDir = "docs\audits\archive"
if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Force -Path $archiveDir | Out-Null
}

# Audits à archiver (ceux qui ne sont pas de 2025 ou qui sont obsolètes)
$auditsToArchive = @(
    "AUDIT_ADVANCED_FEATURES_COMPARISON.md",
    "AUDIT_AFFICHAGE_PRODUITS_COMPLET.md",
    "AUDIT_AMELIORATIONS_SUPPLEMENTAIRES.md",
    "AUDIT_COMPLET_APPLICATION.md",
    "AUDIT_COMPLET_COMPOSANTS_MOBILE.md",
    "AUDIT_COMPLET_FONCTIONNALITES_V2.md",
    "AUDIT_COMPLET_PERSONNALISATION.md",
    "AUDIT_COMPLET_PLATEFORME.md",
    "AUDIT_FONCTIONALITES_COMPLETE.md",
    "AUDIT_INTEGRATION_COMPLETE.md",
    "AUDIT_MOBILE_COMPLET_PLATEFORME.md",
    "AUDIT_SOUS_COMPOSANTS_MOBILE.md",
    "AUDIT_STABILITE_MOBILE.md",
    "AUDIT_STABILITE_MAINTENABILITE_MOBILE.md",
    "AUDIT_GRILLES_MOBILE.md",
    "AUDIT_COMPLET_SYSTEMES_TRANSACTIONS.md",
    "AUDIT_SYSTEME_TRANSACTIONS.md",
    "AUDIT_COMPLET_SYSTEME_PRODUITS.md",
    "AUDIT_SYSTEME_PRODUITS_DIGITAUX.md",
    "AUDIT_SYSTEME_PARRAINAGE.md",
    "AUDIT_OPTIMISATION_FINAL.md",
    "AUDIT_PROFOND_OPTIMISATION_FINALE.md",
    "AUDIT_PLATFORM_CUSTOMIZATION_COMPLET.md"
)

$moved = 0
foreach ($audit in $auditsToArchive) {
    $sourcePath = "docs\audits\$audit"
    if (Test-Path $sourcePath) {
        Move-Item -Path $sourcePath -Destination $archiveDir -Force
        Write-Host "  [OK] Archive: $audit" -ForegroundColor Gray
        $moved++
    }
}

Write-Host "`n[OK] $moved audits archives dans docs/audits/archive/" -ForegroundColor Green

