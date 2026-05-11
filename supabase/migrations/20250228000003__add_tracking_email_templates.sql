-- ================================================================
-- Email Templates for Shipment Tracking
-- Date: 2025-02-31
-- Description: Templates email pour les notifications de tracking
-- ================================================================

-- Template: Mise à jour de tracking générale
INSERT INTO public.email_templates (
  slug,
  name,
  subject,
  html_content,
  from_email,
  from_name,
  product_type,
  is_active,
  created_at,
  updated_at
) VALUES (
  'shipment-tracking-update',
  'Mise à jour de tracking',
  '{"fr": "Mise à jour de votre colis {{tracking_number}}", "en": "Update on your shipment {{tracking_number}}"}',
  '{"fr": "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}h1{margin:0;font-size:24px}.content{background:#f9f9f9;padding:30px;border:1px solid #ddd;border-top:none}.info-box{background:#fff;border-left:4px solid #667eea;padding:15px;margin:20px 0}.tracking-info{background:#e8f4f8;padding:15px;border-radius:5px;margin:20px 0}.btn{display:inline-block;background:#667eea;color:#fff;padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}.footer{text-align:center;color:#666;font-size:12px;margin-top:30px}</style></head><body><header><h1>📦 Mise à jour de votre colis</h1></header><div class=\"content\"><p>Bonjour {{user_name}},</p><p>Nous avons une mise à jour concernant votre colis :</p><div class=\"tracking-info\"><strong>Numéro de suivi :</strong> {{tracking_number}}<br><strong>Statut :</strong> {{status}}<br>{{#if carrier_name}}<strong>Transporteur :</strong> {{carrier_name}}<br>{{/if}}{{#if estimated_delivery}}<strong>Livraison estimée :</strong> {{estimated_delivery}}<br>{{/if}}</div>{{#if latest_event_description}}<div class=\"info-box\"><strong>Dernier événement :</strong><br>{{latest_event_description}}{{#if latest_event_location}}<br><em>📍 {{latest_event_location}}</em>{{/if}}{{#if latest_event_timestamp}}<br><em>🕐 {{latest_event_timestamp}}</em>{{/if}}</div>{{/if}}{{#if tracking_url}}<a href=\"{{tracking_url}}\" class=\"btn\">Suivre mon colis</a>{{/if}}<p>Vous recevrez une notification à chaque mise à jour importante.</p><p>Cordialement,<br>L''équipe Emarzona</p></div><div class=\"footer\"><p>Cet email a été envoyé automatiquement. Veuillez ne pas y répondre.</p></div></body></html>", "en": "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}h1{margin:0;font-size:24px}.content{background:#f9f9f9;padding:30px;border:1px solid #ddd;border-top:none}.info-box{background:#fff;border-left:4px solid #667eea;padding:15px;margin:20px 0}.tracking-info{background:#e8f4f8;padding:15px;border-radius:5px;margin:20px 0}.btn{display:inline-block;background:#667eea;color:#fff;padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}.footer{text-align:center;color:#666;font-size:12px;margin-top:30px}</style></head><body><header><h1>📦 Update on your shipment</h1></header><div class=\"content\"><p>Hello {{user_name}},</p><p>We have an update regarding your shipment:</p><div class=\"tracking-info\"><strong>Tracking number:</strong> {{tracking_number}}<br><strong>Status:</strong> {{status}}<br>{{#if carrier_name}}<strong>Carrier:</strong> {{carrier_name}}<br>{{/if}}{{#if estimated_delivery}}<strong>Estimated delivery:</strong> {{estimated_delivery}}<br>{{/if}}</div>{{#if latest_event_description}}<div class=\"info-box\"><strong>Latest event:</strong><br>{{latest_event_description}}{{#if latest_event_location}}<br><em>📍 {{latest_event_location}}</em>{{/if}}{{#if latest_event_timestamp}}<br><em>🕐 {{latest_event_timestamp}}</em>{{/if}}</div>{{/if}}{{#if tracking_url}}<a href=\"{{tracking_url}}\" class=\"btn\">Track my shipment</a>{{/if}}<p>You will receive a notification for each important update.</p><p>Best regards,<br>The Emarzona team</p></div><div class=\"footer\"><p>This email was sent automatically. Please do not reply.</p></div></body></html>"}',
  'noreply@emarzona.com',
  'Emarzona',
  'physical',
  true,
  now(),
  now()
) ON CONFLICT (slug) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  updated_at = now();

-- Template: Colis livré
INSERT INTO public.email_templates (
  slug,
  name,
  subject,
  html_content,
  from_email,
  from_name,
  product_type,
  is_active,
  created_at,
  updated_at
) VALUES (
  'shipment-delivered',
  'Colis livré',
  '{"fr": "✅ Votre colis {{tracking_number}} a été livré", "en": "✅ Your shipment {{tracking_number}} has been delivered"}',
  '{"fr": "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}header{background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}h1{margin:0;font-size:24px}.content{background:#f9f9f9;padding:30px;border:1px solid #ddd;border-top:none}.success-box{background:#d1fae5;border:2px solid #10b981;padding:20px;border-radius:5px;margin:20px 0;text-align:center}.info-box{background:#fff;border-left:4px solid #10b981;padding:15px;margin:20px 0}.btn{display:inline-block;background:#10b981;color:#fff;padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}.footer{text-align:center;color:#666;font-size:12px;margin-top:30px}</style></head><body><header><h1>✅ Colis livré !</h1></header><div class=\"content\"><p>Bonjour {{user_name}},</p><div class=\"success-box\"><h2 style=\"margin:0;color:#059669\">🎉 Votre colis a été livré avec succès !</h2></div><div class=\"info-box\"><strong>Numéro de suivi :</strong> {{tracking_number}}<br>{{#if carrier_name}}<strong>Transporteur :</strong> {{carrier_name}}<br>{{/if}}{{#if latest_event_location}}<strong>Lieu de livraison :</strong> {{latest_event_location}}<br>{{/if}}{{#if latest_event_timestamp}}<strong>Date de livraison :</strong> {{latest_event_timestamp}}{{/if}}</div><p>Nous espérons que vous serez satisfait de votre achat. N''hésitez pas à nous laisser un avis !</p>{{#if tracking_url}}<a href=\"{{tracking_url}}\" class=\"btn\">Voir les détails</a>{{/if}}<p>Cordialement,<br>L''équipe Emarzona</p></div><div class=\"footer\"><p>Cet email a été envoyé automatiquement. Veuillez ne pas y répondre.</p></div></body></html>", "en": "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}header{background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}h1{margin:0;font-size:24px}.content{background:#f9f9f9;padding:30px;border:1px solid #ddd;border-top:none}.success-box{background:#d1fae5;border:2px solid #10b981;padding:20px;border-radius:5px;margin:20px 0;text-align:center}.info-box{background:#fff;border-left:4px solid #10b981;padding:15px;margin:20px 0}.btn{display:inline-block;background:#10b981;color:#fff;padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}.footer{text-align:center;color:#666;font-size:12px;margin-top:30px}</style></head><body><header><h1>✅ Shipment Delivered!</h1></header><div class=\"content\"><p>Hello {{user_name}},</p><div class=\"success-box\"><h2 style=\"margin:0;color:#059669\">🎉 Your shipment has been successfully delivered!</h2></div><div class=\"info-box\"><strong>Tracking number:</strong> {{tracking_number}}<br>{{#if carrier_name}}<strong>Carrier:</strong> {{carrier_name}}<br>{{/if}}{{#if latest_event_location}}<strong>Delivery location:</strong> {{latest_event_location}}<br>{{/if}}{{#if latest_event_timestamp}}<strong>Delivery date:</strong> {{latest_event_timestamp}}{{/if}}</div><p>We hope you are satisfied with your purchase. Feel free to leave us a review!</p>{{#if tracking_url}}<a href=\"{{tracking_url}}\" class=\"btn\">View details</a>{{/if}}<p>Best regards,<br>The Emarzona team</p></div><div class=\"footer\"><p>This email was sent automatically. Please do not reply.</p></div></body></html>"}',
  'noreply@emarzona.com',
  'Emarzona',
  'physical',
  true,
  now(),
  now()
) ON CONFLICT (slug) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  updated_at = now();

-- Template: En cours de livraison
INSERT INTO public.email_templates (
  slug,
  name,
  subject,
  html_content,
  from_email,
  from_name,
  product_type,
  is_active,
  created_at,
  updated_at
) VALUES (
  'shipment-out-for-delivery',
  'En cours de livraison',
  '{"fr": "🚚 Votre colis {{tracking_number}} est en cours de livraison", "en": "🚚 Your shipment {{tracking_number}} is out for delivery"}',
  '{"fr": "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}header{background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}h1{margin:0;font-size:24px}.content{background:#f9f9f9;padding:30px;border:1px solid #ddd;border-top:none}.alert-box{background:#fef3c7;border:2px solid #f59e0b;padding:20px;border-radius:5px;margin:20px 0;text-align:center}.info-box{background:#fff;border-left:4px solid #f59e0b;padding:15px;margin:20px 0}.btn{display:inline-block;background:#f59e0b;color:#fff;padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}.footer{text-align:center;color:#666;font-size:12px;margin-top:30px}</style></head><body><header><h1>🚚 En cours de livraison</h1></header><div class=\"content\"><p>Bonjour {{user_name}},</p><div class=\"alert-box\"><h2 style=\"margin:0;color:#d97706\">📦 Votre colis est en route vers vous !</h2></div><div class=\"info-box\"><strong>Numéro de suivi :</strong> {{tracking_number}}<br>{{#if carrier_name}}<strong>Transporteur :</strong> {{carrier_name}}<br>{{/if}}{{#if estimated_delivery}}<strong>Livraison estimée :</strong> {{estimated_delivery}}<br>{{/if}}{{#if latest_event_location}}<strong>Dernière localisation :</strong> {{latest_event_location}}<br>{{/if}}</div><p>Votre colis devrait arriver sous peu. Assurez-vous qu''une personne soit présente pour la réception.</p>{{#if tracking_url}}<a href=\"{{tracking_url}}\" class=\"btn\">Suivre en temps réel</a>{{/if}}<p>Cordialement,<br>L''équipe Emarzona</p></div><div class=\"footer\"><p>Cet email a été envoyé automatiquement. Veuillez ne pas y répondre.</p></div></body></html>", "en": "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}header{background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}h1{margin:0;font-size:24px}.content{background:#f9f9f9;padding:30px;border:1px solid #ddd;border-top:none}.alert-box{background:#fef3c7;border:2px solid #f59e0b;padding:20px;border-radius:5px;margin:20px 0;text-align:center}.info-box{background:#fff;border-left:4px solid #f59e0b;padding:15px;margin:20px 0}.btn{display:inline-block;background:#f59e0b;color:#fff;padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}.footer{text-align:center;color:#666;font-size:12px;margin-top:30px}</style></head><body><header><h1>🚚 Out for Delivery</h1></header><div class=\"content\"><p>Hello {{user_name}},</p><div class=\"alert-box\"><h2 style=\"margin:0;color:#d97706\">📦 Your shipment is on its way to you!</h2></div><div class=\"info-box\"><strong>Tracking number:</strong> {{tracking_number}}<br>{{#if carrier_name}}<strong>Carrier:</strong> {{carrier_name}}<br>{{/if}}{{#if estimated_delivery}}<strong>Estimated delivery:</strong> {{estimated_delivery}}<br>{{/if}}{{#if latest_event_location}}<strong>Last location:</strong> {{latest_event_location}}<br>{{/if}}</div><p>Your shipment should arrive shortly. Please ensure someone is available to receive it.</p>{{#if tracking_url}}<a href=\"{{tracking_url}}\" class=\"btn\">Track in real-time</a>{{/if}}<p>Best regards,<br>The Emarzona team</p></div><div class=\"footer\"><p>This email was sent automatically. Please do not reply.</p></div></body></html>"}',
  'noreply@emarzona.com',
  'Emarzona',
  'physical',
  true,
  now(),
  now()
) ON CONFLICT (slug) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  updated_at = now();

-- Commentaire
COMMENT ON TABLE public.email_templates IS 'Templates email pour les notifications de tracking de colis';

