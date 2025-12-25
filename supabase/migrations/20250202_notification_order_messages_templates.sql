-- ================================================================
-- Notification System - Order Messages Templates
-- Date: 2 Février 2025
-- Description: Templates pour les notifications de messages de commandes
-- ================================================================

-- Templates Email Français
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('order_message_received', 'Message Commande Reçu', 'email', 'fr',
   '💬 Nouveau message - Commande #{{order_number}}',
   'Bonjour {{user_name}},\n\nVous avez reçu un nouveau message concernant la commande #{{order_number}}.\n\n{{#if message_preview}}"{{message_preview}}"\n\n{{/if}}Voir le message : {{action_url}}',
   '<h2>💬 Nouveau message - Commande #{{order_number}}</h2><p>Bonjour {{user_name}},</p><p>Vous avez reçu un nouveau message concernant la commande <strong>#{{order_number}}</strong>.</p>{{#if message_preview}}<blockquote>"{{message_preview}}"</blockquote>{{/if}}<p><a href="{{action_url}}">Voir le message</a></p>',
   ARRAY['user_name', 'order_number', 'message_preview', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

-- Templates Email Anglais
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('order_message_received', 'Order Message Received', 'email', 'en',
   '💬 New message - Order #{{order_number}}',
   'Hello {{user_name}},\n\nYou have received a new message regarding order #{{order_number}}.\n\n{{#if message_preview}}"{{message_preview}}"\n\n{{/if}}View message: {{action_url}}',
   '<h2>💬 New message - Order #{{order_number}}</h2><p>Hello {{user_name}},</p><p>You have received a new message regarding order <strong>#{{order_number}}</strong>.</p>{{#if message_preview}}<blockquote>"{{message_preview}}"</blockquote>{{/if}}<p><a href="{{action_url}}">View message</a></p>',
   ARRAY['user_name', 'order_number', 'message_preview', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

-- Traductions i18n
INSERT INTO public.notification_translations (notification_type, language, title, message, action_label, created_at, updated_at)
VALUES
  ('order_message_received', 'fr', '💬 Nouveau message - Commande #{{order_number}}', 
   'Vous avez reçu un nouveau message concernant la commande #{{order_number}}.', 
   'Voir le message', NOW(), NOW()),
  ('order_message_received', 'en', '💬 New message - Order #{{order_number}}', 
   'You have received a new message regarding order #{{order_number}}.', 
   'View message', NOW(), NOW())
ON CONFLICT (notification_type, language) DO NOTHING;

