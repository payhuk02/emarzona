# ============================================================
# Script de déploiement - Intégration Emails de Confirmation
# Date: 1er Février 2025
# PowerShell Script pour Windows
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Déploiement de l'intégration emails de confirmation..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que Supabase CLI est installé
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✅ Supabase CLI détecté : $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI n'est pas installé" -ForegroundColor Red
    Write-Host "Installez-le avec: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "supabase\config.toml")) {
    Write-Host "❌ Fichier supabase\config.toml non trouvé" -ForegroundColor Red
    Write-Host "Assurez-vous d'être dans le répertoire racine du projet" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Répertoire projet détecté" -ForegroundColor Green
Write-Host ""

# Étape 1 : Déployer l'Edge Function principale
Write-Host "📦 Étape 1/3 : Déploiement de l'Edge Function send-order-confirmation-email..." -ForegroundColor Yellow
try {
    supabase functions deploy send-order-confirmation-email
    Write-Host "✅ Edge Function déployée avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du déploiement de l'Edge Function" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Étape 2 : Déployer le webhook Moneroo
Write-Host "📦 Étape 2/3 : Déploiement du webhook Moneroo..." -ForegroundColor Yellow
try {
    supabase functions deploy moneroo-webhook
    Write-Host "✅ Webhook Moneroo déployé avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du déploiement du webhook Moneroo" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Étape 3 : (supprimée) ancien webhook provider supprimé

# Résumé
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Exécuter les migrations SQL dans Supabase Dashboard :" -ForegroundColor Yellow
Write-Host "   - 20250201_fix_email_templates_complete_structure.sql"
Write-Host "   - 20250201_add_missing_email_templates.sql"
Write-Host ""
Write-Host "2. ✅ Vérifier les variables d'environnement :" -ForegroundColor Yellow
Write-Host "   - SENDGRID_API_KEY pour send-order-confirmation-email"
Write-Host ""
Write-Host "3. ✅ Tester avec une commande de test" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 Guide complet : docs\guides\DEPLOIEMENT_STEP_BY_STEP.md" -ForegroundColor Cyan
Write-Host ""

