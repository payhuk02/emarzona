-- Générateur IA produits : 5 verticales e-commerce (digital, physique, service, cours, artiste)

UPDATE public.platform_settings
SET ai_management_settings = jsonb_set(
  COALESCE(ai_management_settings, '{}'::jsonb),
  '{contentGenerator}',
  COALESCE(ai_management_settings->'contentGenerator', '{}'::jsonb)
    || '{
      "generateProductImage": true,
      "imageModel": "google/gemini-3.1-flash-image-preview",
      "imagePromptTemplate": "Premium e-commerce product photo for {{typeLabel}}: {{name}}. {{category}}. Professional studio lighting, clean background, high-end marketplace listing, no text overlay, photorealistic, wide landscape 3:2 aspect ratio (1536×1024 px).",
      "minWords": 350,
      "supportedTypes": ["digital", "physical", "service", "course", "artist"],
      "typeSystemPrompts": {
        "digital": "Produit numérique Emarzona : téléchargement instantané, licence, mises à jour, accès à vie.",
        "physical": "Produit physique Emarzona : qualité, expédition, variantes, stock, garantie.",
        "service": "Service Emarzona : réservation, expertise, accompagnement, résultats mesurables.",
        "course": "Cours en ligne Emarzona : modules, objectifs pédagogiques, certification, progression.",
        "artist": "Œuvre d''artiste Emarzona : authenticité, édition, provenance, valeur artistique et collection."
      }
    }'::jsonb,
  true
)
WHERE id = '00000000-0000-0000-0000-000000000001';
