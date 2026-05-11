-- ================================================================
-- Notification System - Vendor Messages Templates
-- Date: 2 Février 2025
-- Description: Templates pour les notifications de messages vendeur
-- ================================================================

-- Templates Email Français
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('vendor_message_received', 'Message Vendeur Reçu', 'email', 'fr',
   '💬 Nouveau message client',
   'Bonjour {{user_name}},\n\nVous avez reçu un nouveau message{{#if product_name}} concernant "{{product_name}}"{{/if}}.\n\n{{#if message_preview}}"{{message_preview}}"\n\n{{/if}}Répondre maintenant : {{action_url}}',
   '<h2>💬 Nouveau message client</h2><p>Bonjour {{user_name}},</p><p>Vous avez reçu un nouveau message{{#if product_name}} concernant "<strong>{{product_name}}</strong>"{{/if}}.</p>{{#if message_preview}}<blockquote>"{{message_preview}}"</blockquote>{{/if}}<p><a href="{{action_url}}">Répondre maintenant</a></p>',
   ARRAY['user_name', 'product_name', 'message_preview', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('customer_message_received', 'Message Client Reçu', 'email', 'fr',
   '💬 Nouvelle réponse du vendeur',
   'Bonjour {{user_name}},\n\n{{store_name}} vous a répondu.\n\n{{#if message_preview}}"{{message_preview}}"\n\n{{/if}}Voir la réponse : {{action_url}}',
   '<h2>💬 Nouvelle réponse du vendeur</h2><p>Bonjour {{user_name}},</p><p><strong>{{store_name}}</strong> vous a répondu.</p>{{#if message_preview}}<blockquote>"{{message_preview}}"</blockquote>{{/if}}<p><a href="{{action_url}}">Voir la réponse</a></p>',
   ARRAY['user_name', 'store_name', 'message_preview', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('vendor_conversation_started', 'Nouvelle Conversation Vendeur', 'email', 'fr',
   '💬 Nouvelle conversation client',
   'Bonjour {{user_name}},\n\nUn client a démarré une nouvelle conversation{{#if product_name}} concernant "{{product_name}}"{{/if}}.\n\n{{#if subject}}Sujet : {{subject}}\n\n{{/if}}Voir la conversation : {{action_url}}',
   '<h2>💬 Nouvelle conversation client</h2><p>Bonjour {{user_name}},</p><p>Un client a démarré une nouvelle conversation{{#if product_name}} concernant "<strong>{{product_name}}</strong>"{{/if}}.</p>{{#if subject}}<p><strong>Sujet :</strong> {{subject}}</p>{{/if}}<p><a href="{{action_url}}">Voir la conversation</a></p>',
   ARRAY['user_name', 'product_name', 'subject', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('vendor_conversation_closed', 'Conversation Vendeur Fermée', 'email', 'fr',
   '✅ Conversation fermée',
   'Bonjour {{user_name}},\n\nLa conversation{{#if product_name}} concernant "{{product_name}}"{{/if}} a été fermée.\n\n{{action_url}}',
   '<h2>✅ Conversation fermée</h2><p>Bonjour {{user_name}},</p><p>La conversation{{#if product_name}} concernant "<strong>{{product_name}}</strong>"{{/if}} a été fermée.</p><p><a href="{{action_url}}">Voir les détails</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

-- Templates Email Anglais
INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('vendor_message_received', 'Vendor Message Received', 'email', 'en',
   '💬 New customer message',
   'Hello {{user_name}},\n\nYou have received a new message{{#if product_name}} regarding "{{product_name}}"{{/if}}.\n\n{{#if message_preview}}"{{message_preview}}"\n\n{{/if}}Reply now: {{action_url}}',
   '<h2>💬 New customer message</h2><p>Hello {{user_name}},</p><p>You have received a new message{{#if product_name}} regarding "<strong>{{product_name}}</strong>"{{/if}}.</p>{{#if message_preview}}<blockquote>"{{message_preview}}"</blockquote>{{/if}}<p><a href="{{action_url}}">Reply now</a></p>',
   ARRAY['user_name', 'product_name', 'message_preview', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('customer_message_received', 'Customer Message Received', 'email', 'en',
   '💬 New vendor reply',
   'Hello {{user_name}},\n\n{{store_name}} has replied to you.\n\n{{#if message_preview}}"{{message_preview}}"\n\n{{/if}}View reply: {{action_url}}',
   '<h2>💬 New vendor reply</h2><p>Hello {{user_name}},</p><p><strong>{{store_name}}</strong> has replied to you.</p>{{#if message_preview}}<blockquote>"{{message_preview}}"</blockquote>{{/if}}<p><a href="{{action_url}}">View reply</a></p>',
   ARRAY['user_name', 'store_name', 'message_preview', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('vendor_conversation_started', 'New Vendor Conversation', 'email', 'en',
   '💬 New customer conversation',
   'Hello {{user_name}},\n\nA customer has started a new conversation{{#if product_name}} regarding "{{product_name}}"{{/if}}.\n\n{{#if subject}}Subject: {{subject}}\n\n{{/if}}View conversation: {{action_url}}',
   '<h2>💬 New customer conversation</h2><p>Hello {{user_name}},</p><p>A customer has started a new conversation{{#if product_name}} regarding "<strong>{{product_name}}</strong>"{{/if}}.</p>{{#if subject}}<p><strong>Subject:</strong> {{subject}}</p>{{/if}}<p><a href="{{action_url}}">View conversation</a></p>',
   ARRAY['user_name', 'product_name', 'subject', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

INSERT INTO public.notification_templates (slug, name, channel, language, subject, body, html, variables, is_active, created_at, updated_at)
VALUES
  ('vendor_conversation_closed', 'Vendor Conversation Closed', 'email', 'en',
   '✅ Conversation closed',
   'Hello {{user_name}},\n\nThe conversation{{#if product_name}} regarding "{{product_name}}"{{/if}} has been closed.\n\n{{action_url}}',
   '<h2>✅ Conversation closed</h2><p>Hello {{user_name}},</p><p>The conversation{{#if product_name}} regarding "<strong>{{product_name}}</strong>"{{/if}} has been closed.</p><p><a href="{{action_url}}">View details</a></p>',
   ARRAY['user_name', 'product_name', 'action_url'],
   true, NOW(), NOW())
ON CONFLICT (slug, channel, language, store_id) DO NOTHING;

-- Traductions i18n
INSERT INTO public.notification_translations (notification_type, language, title, message, action_label, created_at, updated_at)
VALUES
  ('vendor_message_received', 'fr', '💬 Nouveau message client', 
   'Vous avez reçu un nouveau message{{#if product_name}} concernant "{{product_name}}"{{/if}}.', 
   'Répondre', NOW(), NOW()),
  ('customer_message_received', 'fr', '💬 Nouvelle réponse du vendeur', 
   '{{store_name}} vous a répondu.', 
   'Voir la réponse', NOW(), NOW()),
  ('vendor_conversation_started', 'fr', '💬 Nouvelle conversation client', 
   'Un client a démarré une nouvelle conversation{{#if product_name}} concernant "{{product_name}}"{{/if}}.', 
   'Voir la conversation', NOW(), NOW()),
  ('vendor_conversation_closed', 'fr', '✅ Conversation fermée', 
   'La conversation{{#if product_name}} concernant "{{product_name}}"{{/if}} a été fermée.', 
   'Voir les détails', NOW(), NOW()),
  ('vendor_message_received', 'en', '💬 New customer message', 
   'You have received a new message{{#if product_name}} regarding "{{product_name}}"{{/if}}.', 
   'Reply', NOW(), NOW()),
  ('customer_message_received', 'en', '💬 New vendor reply', 
   '{{store_name}} has replied to you.', 
   'View reply', NOW(), NOW()),
  ('vendor_conversation_started', 'en', '💬 New customer conversation', 
   'A customer has started a new conversation{{#if product_name}} regarding "{{product_name}}"{{/if}}.', 
   'View conversation', NOW(), NOW()),
  ('vendor_conversation_closed', 'en', '✅ Conversation closed', 
   'The conversation{{#if product_name}} regarding "{{product_name}}"{{/if}} has been closed.', 
   'View details', NOW(), NOW())
ON CONFLICT (notification_type, language) DO NOTHING;

