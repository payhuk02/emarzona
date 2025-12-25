# Script pour faciliter l'exécution des migrations SQL dans Supabase
# Date: 28 Janvier 2025

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  GUIDE D'EXÉCUTION DES MIGRATIONS SQL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Chemins des fichiers de migration
$migration1 = "supabase\migrations\20250128_staff_availability_settings.sql"
$migration2 = "supabase\migrations\20250128_resource_conflict_settings.sql"
$migration3 = "supabase\migrations\20250128_wizard_server_validation.sql"

Write-Host "Les migrations suivantes doivent être exécutées dans Supabase Dashboard :" -ForegroundColor Yellow
Write-Host ""

# Vérifier que les fichiers existent
$files = @($migration1, $migration2, $migration3)
$allExist = $true

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (NON TROUVÉ)" -ForegroundColor Red
        $allExist = $false
    }
}

Write-Host ""

if (-not $allExist) {
    Write-Host "ERREUR: Certains fichiers de migration sont manquants!" -ForegroundColor Red
    exit 1
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  INSTRUCTIONS D'EXÉCUTION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ouvrir Supabase Dashboard : https://app.supabase.com" -ForegroundColor Yellow
Write-Host "2. Sélectionner votre projet Payhuk" -ForegroundColor Yellow
Write-Host "3. Aller dans SQL Editor (menu de gauche)" -ForegroundColor Yellow
Write-Host "4. Créer une nouvelle requête" -ForegroundColor Yellow
Write-Host "5. Exécuter les migrations dans l'ordre suivant :" -ForegroundColor Yellow
Write-Host ""

Write-Host "   ÉTAPE 1 : Staff Availability Settings" -ForegroundColor Cyan
Write-Host "   Fichier: $migration1" -ForegroundColor Gray
Write-Host ""

Write-Host "   ÉTAPE 2 : Resource Conflict Settings" -ForegroundColor Cyan
Write-Host "   Fichier: $migration2" -ForegroundColor Gray
Write-Host ""

Write-Host "   ÉTAPE 3 : Wizard Server Validation" -ForegroundColor Cyan
Write-Host "   Fichier: $migration3" -ForegroundColor Gray
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CONTENU DES MIGRATIONS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Afficher le contenu de chaque migration
Write-Host "--- MIGRATION 1 : Staff Availability Settings ---" -ForegroundColor Magenta
Write-Host ""
Get-Content $migration1 | Write-Host
Write-Host ""
Write-Host "--- FIN MIGRATION 1 ---" -ForegroundColor Magenta
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "--- MIGRATION 2 : Resource Conflict Settings ---" -ForegroundColor Magenta
Write-Host ""
Get-Content $migration2 | Write-Host
Write-Host ""
Write-Host "--- FIN MIGRATION 2 ---" -ForegroundColor Magenta
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "--- MIGRATION 3 : Wizard Server Validation ---" -ForegroundColor Magenta
Write-Host ""
Get-Content $migration3 | Write-Host
Write-Host ""
Write-Host "--- FIN MIGRATION 3 ---" -ForegroundColor Magenta
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  VÉRIFICATION POST-MIGRATION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Après exécution, tester avec ces requêtes SQL :" -ForegroundColor Yellow
Write-Host ""

$verificationSQL = @"
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('staff_availability_settings', 'resource_conflict_settings');

-- Vérifier les fonctions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'validate_%';

-- Tester validate_product_slug
SELECT validate_product_slug('test-slug', '00000000-0000-0000-0000-000000000000'::uuid, NULL);
"@

Write-Host $verificationSQL -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MIGRATIONS PRÊTES À EXÉCUTER" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

