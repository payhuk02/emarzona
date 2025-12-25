-- ============================================================
-- AJOUT TEMPLATE EMAIL POUR PRODUITS ARTISTE
-- Date: 1er Février 2025
-- Description: Créer le template de confirmation pour les œuvres d'artiste
-- ============================================================

-- Template: Order Confirmation - Artist Product
INSERT INTO public.email_templates (slug, name, category, product_type, subject, html_content, variables, is_active, is_default)
VALUES (
  'order-confirmation-artist',
  'Confirmation de commande - Œuvre d''Artiste',
  'transactional',
  'artist',
  '{"fr": "Commande confirmée - Votre œuvre d''artiste 🎨", "en": "Order Confirmed - Your Artist Work 🎨"}',
  '{"fr": "<h1>Merci {{user_name}} !</h1><p>Commande #{{order_id}}</p><p>Œuvre: {{product_name}}</p><p>Artiste: {{artist_name}}</p>{{#if edition_number}}<p>Édition: {{edition_number}}{{#if total_editions}}/{{total_editions}}{{/if}}</p>{{/if}}{{#if certificate_available}}<p>Certificat d''authenticité disponible</p>{{/if}}{{#if shipping_address}}<p>Livraison estimée: {{delivery_date}}</p><p>Adresse: {{shipping_address}}</p>{{#if tracking_number}}<p>Numéro de suivi: {{tracking_number}}</p>{{/if}}{{/if}}", "en": "<h1>Thank you {{user_name}}!</h1><p>Order #{{order_id}}</p><p>Artwork: {{product_name}}</p><p>Artist: {{artist_name}}</p>{{#if edition_number}}<p>Edition: {{edition_number}}{{#if total_editions}}/{{total_editions}}{{/if}}</p>{{/if}}{{#if certificate_available}}<p>Certificate of authenticity available</p>{{/if}}{{#if shipping_address}}<p>Estimated delivery: {{delivery_date}}</p><p>Address: {{shipping_address}}</p>{{#if tracking_number}}<p>Tracking number: {{tracking_number}}</p>{{/if}}{{/if}}"}',
  '["{{user_name}}", "{{order_id}}", "{{product_name}}", "{{artist_name}}", "{{edition_number}}", "{{total_editions}}", "{{certificate_available}}", "{{authenticity_certificate_link}}", "{{shipping_address}}", "{{delivery_date}}", "{{tracking_number}}", "{{tracking_link}}"]'::jsonb,
  TRUE,
  TRUE
) ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE public.email_templates IS 'Templates d''emails universels pour tous types de produits (digital, physical, service, course, artist)';

