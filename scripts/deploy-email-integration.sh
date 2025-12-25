#!/bin/bash

# ============================================================
# Script de déploiement - Intégration Emails de Confirmation
# Date: 1er Février 2025
# ============================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement de l'intégration emails de confirmation..."
echo ""

# Couleurs pour la sortie
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI n'est pas installé${NC}"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI détecté${NC}"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ Fichier supabase/config.toml non trouvé${NC}"
    echo "Assurez-vous d'être dans le répertoire racine du projet"
    exit 1
fi

echo -e "${GREEN}✅ Répertoire projet détecté${NC}"
echo ""

# Étape 1 : Déployer l'Edge Function principale
echo -e "${YELLOW}📦 Étape 1/3 : Déploiement de l'Edge Function send-order-confirmation-email...${NC}"
if supabase functions deploy send-order-confirmation-email; then
    echo -e "${GREEN}✅ Edge Function déployée avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du déploiement de l'Edge Function${NC}"
    exit 1
fi
echo ""

# Étape 2 : Déployer le webhook Moneroo
echo -e "${YELLOW}📦 Étape 2/3 : Déploiement du webhook Moneroo...${NC}"
if supabase functions deploy moneroo-webhook; then
    echo -e "${GREEN}✅ Webhook Moneroo déployé avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du déploiement du webhook Moneroo${NC}"
    exit 1
fi
echo ""

# Étape 3 : (supprimée) ancien webhook provider supprimé

# Résumé
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1. ✅ Exécuter les migrations SQL dans Supabase Dashboard :"
echo "   - 20250201_fix_email_templates_complete_structure.sql"
echo "   - 20250201_add_missing_email_templates.sql"
echo ""
echo "2. ✅ Vérifier les variables d'environnement :"
echo "   - SENDGRID_API_KEY pour send-order-confirmation-email"
echo ""
echo "3. ✅ Tester avec une commande de test"
echo ""
echo "📖 Guide complet : docs/guides/DEPLOIEMENT_STEP_BY_STEP.md"
echo ""

