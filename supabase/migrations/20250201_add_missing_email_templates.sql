-- ============================================================
-- AJOUT TEMPLATES EMAIL MANQUANTS
-- Date: 1er Février 2025
-- Description: Créer tous les templates de confirmation manquants (service, course, artist)
-- 
-- IMPORTANT: Cette migration doit être exécutée APRÈS:
-- - 20250201_fix_email_templates_complete_structure.sql
-- ============================================================

-- ============================================================
-- TEMPLATE 1: Order Confirmation - Service
-- ============================================================
INSERT INTO public.email_templates (slug, name, category, product_type, subject, html_content, variables, is_active, is_default)
VALUES (
  'order-confirmation-service',
  'Confirmation de commande - Service',
  'transactional',
  'service',
  '{"fr": "Commande confirmée - Votre service est réservé ✅", "en": "Order Confirmed - Your Service is Booked ✅"}',
  '{"fr": "<h1>Merci {{user_name}} !</h1><p>Commande #{{order_id}}</p><p>Service: {{service_name}}</p><p>Prestataire: {{provider_name}}</p>{{#if booking_date}}<p>Date de réservation: {{booking_date}}</p>{{/if}}{{#if booking_time}}<p>Heure: {{booking_time}}</p>{{/if}}{{#if booking_link}}<p><a href=\"{{booking_link}}\">Gérer votre réservation</a></p>{{/if}}", "en": "<h1>Thank you {{user_name}}!</h1><p>Order #{{order_id}}</p><p>Service: {{service_name}}</p><p>Provider: {{provider_name}}</p>{{#if booking_date}}<p>Booking date: {{booking_date}}</p>{{/if}}{{#if booking_time}}<p>Time: {{booking_time}}</p>{{/if}}{{#if booking_link}}<p><a href=\"{{booking_link}}\">Manage your booking</a></p>{{/if}}"}',
  '["{{user_name}}", "{{order_id}}", "{{service_name}}", "{{provider_name}}", "{{booking_date}}", "{{booking_time}}", "{{booking_link}}"]'::jsonb,
  TRUE,
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  product_type = EXCLUDED.product_type,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- ============================================================
-- TEMPLATE 2: Course Enrollment Confirmation
-- ============================================================
INSERT INTO public.email_templates (slug, name, category, product_type, subject, html_content, variables, is_active, is_default)
VALUES (
  'course-enrollment-confirmation',
  'Confirmation d''inscription - Cours en ligne',
  'transactional',
  'course',
  '{"fr": "Inscription confirmée - Bienvenue au cours 🎓", "en": "Enrollment Confirmed - Welcome to the Course 🎓"}',
  '{"fr": "<h1>Félicitations {{user_name}} !</h1><p>Vous êtes inscrit au cours: <strong>{{course_name}}</strong></p><p>Instructeur: {{instructor_name}}</p><p>Date d''inscription: {{enrollment_date}}</p>{{#if course_duration}}<p>Durée: {{course_duration}}</p>{{/if}}<p><a href=\"{{course_link}}\">Accéder au cours maintenant</a></p>{{#if certificate_available}}<p>✅ Un certificat sera délivré à la fin du cours</p>{{/if}}", "en": "<h1>Congratulations {{user_name}}!</h1><p>You are enrolled in: <strong>{{course_name}}</strong></p><p>Instructor: {{instructor_name}}</p><p>Enrollment date: {{enrollment_date}}</p>{{#if course_duration}}<p>Duration: {{course_duration}}</p>{{/if}}<p><a href=\"{{course_link}}\">Access the course now</a></p>{{#if certificate_available}}<p>✅ A certificate will be issued upon completion</p>{{/if}}"}',
  '["{{user_name}}", "{{course_name}}", "{{instructor_name}}", "{{enrollment_date}}", "{{course_link}}", "{{course_duration}}", "{{certificate_available}}"]'::jsonb,
  TRUE,
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  product_type = EXCLUDED.product_type,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- ============================================================
-- TEMPLATE 3: Order Confirmation - Artist Product
-- ============================================================
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
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  product_type = EXCLUDED.product_type,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- Mettre à jour le commentaire de la table
COMMENT ON TABLE public.email_templates IS 
  'Templates d''emails universels pour tous types de produits (digital, physical, service, course, artist)';

