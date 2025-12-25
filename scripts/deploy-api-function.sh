#!/bin/bash

# Script de déploiement de l'Edge Function API
# Date: 28 Janvier 2025

echo "🚀 Déploiement de l'Edge Function API Publique..."

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "supabase/functions/api/v1/index.ts" ]; then
    echo "❌ Fichier Edge Function non trouvé"
    echo "Assurez-vous d'être dans la racine du projet"
    exit 1
fi

# Appliquer les migrations SQL
echo "📦 Application des migrations SQL..."
supabase db push

# Déployer l'Edge Function
echo "🚀 Déploiement de l'Edge Function..."
supabase functions deploy api/v1

echo "✅ Déploiement terminé !"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Créez une clé API via SQL:"
echo "   SELECT * FROM create_api_key("
echo "     p_user_id := auth.uid(),"
echo "     p_store_id := 'VOTRE_STORE_ID',"
echo "     p_name := 'Ma clé API'"
echo "   );"
echo ""
echo "2. Testez l'API:"
echo "   curl -X GET 'https://[PROJECT_REF].supabase.co/functions/v1/api/v1/products' \\"
echo "     -H 'Authorization: Bearer VOTRE_CLE_API'"

