#!/bin/bash

# Script de déploiement de l'Edge Function Rate Limiter
# Date: 31 Janvier 2025

echo "🚀 Déploiement de l'Edge Function Rate Limiter..."

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "supabase/functions/rate-limiter/index.ts" ]; then
    echo "❌ Fichier Edge Function non trouvé"
    echo "Assurez-vous d'être dans la racine du projet"
    exit 1
fi

# Déployer l'Edge Function
echo "🚀 Déploiement de l'Edge Function rate-limiter..."
supabase functions deploy rate-limiter

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Déploiement terminé avec succès !"
    echo ""
    echo "📝 Vérifications:"
    echo "1. Testez la fonction avec une requête OPTIONS:"
    echo "   curl -X OPTIONS 'https://[PROJECT_REF].supabase.co/functions/v1/rate-limiter' \\"
    echo "     -H 'Origin: https://api.emarzona.com' \\"
    echo "     -H 'Access-Control-Request-Method: POST' \\"
    echo "     -v"
    echo ""
    echo "2. Vérifiez que le statut HTTP est 200 OK"
    echo "3. Vérifiez que les headers CORS sont présents:"
    echo "   - Access-Control-Allow-Origin"
    echo "   - Access-Control-Allow-Methods"
    echo "   - Access-Control-Allow-Headers"
    echo ""
    echo "4. Testez une requête POST:"
    echo "   curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/rate-limiter' \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -H 'Origin: https://api.emarzona.com' \\"
    echo "     -d '{\"endpoint\": \"default\"}'"
else
    echo ""
    echo "❌ Erreur lors du déploiement"
    echo "Vérifiez les logs ci-dessus pour plus de détails"
    exit 1
fi
