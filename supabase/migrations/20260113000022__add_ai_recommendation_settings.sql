-- Migration: Ajouter les paramètres IA aux platform_settings
-- Date: 13 Janvier 2026
-- Description: Étend la table platform_settings pour inclure les paramètres de recommandations IA

-- Ajouter la colonne pour les paramètres IA si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'platform_settings'
    AND column_name = 'ai_recommendation_settings'
  ) THEN
    ALTER TABLE platform_settings
    ADD COLUMN ai_recommendation_settings JSONB DEFAULT '{
      "algorithms": {
        "collaborative": true,
        "contentBased": true,
        "trending": true,
        "behavioral": true,
        "crossType": false
      },
      "weights": {
        "collaborative": 25,
        "contentBased": 30,
        "trending": 20,
        "behavioral": 20,
        "crossType": 5
      },
      "similarity": {
        "categoryWeight": 30,
        "tagsWeight": 25,
        "priceWeight": 20,
        "typeWeight": 25,
        "priceTolerance": 20
      },
      "productTypes": {
        "digital": {
          "enabled": true,
          "maxRecommendations": 6,
          "similarityThreshold": 0.3
        },
        "physical": {
          "enabled": true,
          "maxRecommendations": 6,
          "similarityThreshold": 0.3
        },
        "service": {
          "enabled": true,
          "maxRecommendations": 4,
          "similarityThreshold": 0.4
        },
        "course": {
          "enabled": true,
          "maxRecommendations": 4,
          "similarityThreshold": 0.4
        },
        "artist": {
          "enabled": true,
          "maxRecommendations": 3,
          "similarityThreshold": 0.5
        }
      },
      "limits": {
        "maxRecommendationsPerPage": 8,
        "minConfidenceThreshold": 0.3,
        "cacheExpiryMinutes": 30,
        "enablePersonalization": true
      },
      "fallbacks": {
        "fallbackToTrending": true,
        "fallbackToPopular": true,
        "fallbackToCategory": true,
        "fallbackToStore": false
      }
    }'::jsonb;
  END IF;
END $$;

-- Mettre à jour l'enregistrement unique avec les paramètres IA par défaut
UPDATE platform_settings
SET ai_recommendation_settings = COALESCE(ai_recommendation_settings, '{
  "algorithms": {
    "collaborative": true,
    "contentBased": true,
    "trending": true,
    "behavioral": true,
    "crossType": false
  },
  "weights": {
    "collaborative": 25,
    "contentBased": 30,
    "trending": 20,
    "behavioral": 20,
    "crossType": 5
  },
  "similarity": {
    "categoryWeight": 30,
    "tagsWeight": 25,
    "priceWeight": 20,
    "typeWeight": 25,
    "priceTolerance": 20
  },
  "productTypes": {
    "digital": {
      "enabled": true,
      "maxRecommendations": 6,
      "similarityThreshold": 0.3
    },
    "physical": {
      "enabled": true,
      "maxRecommendations": 6,
      "similarityThreshold": 0.3
    },
    "service": {
      "enabled": true,
      "maxRecommendations": 4,
      "similarityThreshold": 0.4
    },
    "course": {
      "enabled": true,
      "maxRecommendations": 4,
      "similarityThreshold": 0.4
    },
    "artist": {
      "enabled": true,
      "maxRecommendations": 3,
      "similarityThreshold": 0.5
    }
  },
  "limits": {
    "maxRecommendationsPerPage": 8,
    "minConfidenceThreshold": 0.3,
    "cacheExpiryMinutes": 30,
    "enablePersonalization": true
  },
  "fallbacks": {
    "fallbackToTrending": true,
    "fallbackToPopular": true,
    "fallbackToCategory": true,
    "fallbackToStore": false
  }
}'::jsonb)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Ajouter un commentaire sur la nouvelle colonne
COMMENT ON COLUMN platform_settings.ai_recommendation_settings IS 'Paramètres de configuration des recommandations IA (algorithmes, poids, seuils, etc.)';

-- Créer un index pour optimiser les requêtes sur les paramètres IA
CREATE INDEX IF NOT EXISTS idx_platform_settings_ai_recommendation_settings
ON platform_settings USING GIN (ai_recommendation_settings);

-- Fonction utilitaire pour obtenir un paramètre IA spécifique
CREATE OR REPLACE FUNCTION get_ai_recommendation_setting(setting_path TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT ai_recommendation_settings #> string_to_array(setting_path, '.')
  INTO result
  FROM platform_settings
  WHERE id = '00000000-0000-0000-0000-000000000001';

  RETURN result;
END;
$$;

-- Fonction utilitaire pour mettre à jour un paramètre IA spécifique
CREATE OR REPLACE FUNCTION update_ai_recommendation_setting(setting_path TEXT, new_value JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE platform_settings
  SET ai_recommendation_settings = jsonb_set(
    ai_recommendation_settings,
    string_to_array(setting_path, '.'),
    new_value,
    true
  ),
  updated_at = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000001';
END;
$$;

-- Permissions pour les fonctions utilitaires
GRANT EXECUTE ON FUNCTION get_ai_recommendation_setting(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_ai_recommendation_setting(TEXT, JSONB) TO authenticated;

-- Commentaire sur les fonctions
COMMENT ON FUNCTION get_ai_recommendation_setting(TEXT) IS 'Récupère un paramètre spécifique des recommandations IA (ex: "algorithms.collaborative")';
COMMENT ON FUNCTION update_ai_recommendation_setting(TEXT, JSONB) IS 'Met à jour un paramètre spécifique des recommandations IA';