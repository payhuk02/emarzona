-- Email client-safe table layout for physical order confirmation + seller notification template
-- Date: 2026-07-07

UPDATE public.email_templates
SET
  subject = jsonb_build_object(
    'fr', 'Votre commande #{{order_number}} — {{store_name}}',
    'en', 'Your order #{{order_number}} — {{store_name}}'
  ),
  html_content = jsonb_build_object(
    'fr',
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto;padding:20px;background:#f3f4f6"><div style="background:linear-gradient(135deg,#7c3aed 0%,#2563eb 100%);color:#fff;padding:28px 24px;text-align:center;border-radius:12px 12px 0 0"><h1 style="margin:0;font-size:24px">Commande confirmée</h1><p style="margin:8px 0 0;opacity:.95">Merci {{user_name}} !</p></div><div style="background:#fff;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px"><p>Votre commande a bien été enregistrée. Voici le récapitulatif :</p><table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:20px 0"><tr><td style="color:#64748b;font-size:13px;padding:10px 14px;border-bottom:1px solid #eef2f7">Boutique</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px;border-bottom:1px solid #eef2f7">{{store_name}}</td></tr><tr><td style="color:#64748b;font-size:13px;padding:10px 14px;border-bottom:1px solid #eef2f7">Produit</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px;border-bottom:1px solid #eef2f7">{{product_name}}</td></tr><tr><td style="color:#64748b;font-size:13px;padding:10px 14px;border-bottom:1px solid #eef2f7">N° commande</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px;border-bottom:1px solid #eef2f7">#{{order_number}}</td></tr><tr><td style="color:#64748b;font-size:13px;padding:10px 14px;border-bottom:1px solid #eef2f7">Date et heure</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px;border-bottom:1px solid #eef2f7">{{order_date}}</td></tr><tr><td style="color:#64748b;font-size:13px;padding:10px 14px;border-bottom:1px solid #eef2f7">Adresse de livraison</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px;border-bottom:1px solid #eef2f7">{{shipping_address}}</td></tr>{{#if delivery_date}}<tr><td style="color:#64748b;font-size:13px;padding:10px 14px">Livraison estimée</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px">{{delivery_date}}</td></tr>{{/if}}</table><div style="margin:28px 0 12px;text-align:center">{{#if whatsapp_link}}<a href="{{whatsapp_link}}" style="display:inline-block;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:700;margin:8px 6px;background:#16a34a;color:#fff">Contacter le vendeur sur WhatsApp</a>{{/if}}{{#if customer_portal_link}}<a href="{{customer_portal_link}}" style="display:inline-block;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:700;margin:8px 6px;background:#2563eb;color:#fff">Accéder à mon espace client</a><p style="font-size:13px;color:#64748b;text-align:center;margin-top:8px">Connexion automatique avec l''adresse <strong>{{user_email}}</strong></p>{{/if}}</div>{{#if tracking_link}}<p style="text-align:center"><a href="{{tracking_link}}">Suivre mon colis</a></p>{{/if}}<p>Le vendeur vous tiendra informé de l''expédition et de la livraison.</p><p>Cordialement,<br>L''équipe Emarzona</p></div><div style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px"><p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p></div></body></html>',
    'en',
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto;padding:20px;background:#f3f4f6"><div style="background:linear-gradient(135deg,#7c3aed 0%,#2563eb 100%);color:#fff;padding:28px 24px;text-align:center;border-radius:12px 12px 0 0"><h1 style="margin:0;font-size:24px">Order confirmed</h1><p style="margin:8px 0 0;opacity:.95">Thank you {{user_name}}!</p></div><div style="background:#fff;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px"><p>Your order has been recorded. Here is your summary:</p><table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:20px 0"><tr><td style="color:#64748b;font-size:13px;padding:10px 14px;border-bottom:1px solid #eef2f7">Store</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px;border-bottom:1px solid #eef2f7">{{store_name}}</td></tr><tr><td style="color:#64748b;font-size:13px;padding:10px 14px;border-bottom:1px solid #eef2f7">Product</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px;border-bottom:1px solid #eef2f7">{{product_name}}</td></tr><tr><td style="color:#64748b;font-size:13px;padding:10px 14px;border-bottom:1px solid #eef2f7">Order #</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px;border-bottom:1px solid #eef2f7">#{{order_number}}</td></tr><tr><td style="color:#64748b;font-size:13px;padding:10px 14px;border-bottom:1px solid #eef2f7">Date &amp; time</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px;border-bottom:1px solid #eef2f7">{{order_date}}</td></tr><tr><td style="color:#64748b;font-size:13px;padding:10px 14px;border-bottom:1px solid #eef2f7">Shipping address</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px;border-bottom:1px solid #eef2f7">{{shipping_address}}</td></tr>{{#if delivery_date}}<tr><td style="color:#64748b;font-size:13px;padding:10px 14px">Estimated delivery</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px">{{delivery_date}}</td></tr>{{/if}}</table><div style="margin:28px 0 12px;text-align:center">{{#if whatsapp_link}}<a href="{{whatsapp_link}}" style="display:inline-block;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:700;margin:8px 6px;background:#16a34a;color:#fff">Contact seller on WhatsApp</a>{{/if}}{{#if customer_portal_link}}<a href="{{customer_portal_link}}" style="display:inline-block;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:700;margin:8px 6px;background:#2563eb;color:#fff">Access my customer area</a><p style="font-size:13px;color:#64748b;text-align:center;margin-top:8px">Automatic sign-in with <strong>{{user_email}}</strong></p>{{/if}}</div>{{#if tracking_link}}<p style="text-align:center"><a href="{{tracking_link}}">Track my shipment</a></p>{{/if}}<p>The seller will keep you updated about shipping and delivery.</p><p>Best regards,<br>The Emarzona team</p></div><div style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px"><p>This email was sent automatically. Please do not reply directly.</p></div></body></html>'
  ),
  updated_at = NOW()
WHERE slug = 'order-confirmation-physical';

INSERT INTO public.email_templates (
  slug,
  name,
  category,
  subject,
  html_content,
  text_content,
  from_email,
  from_name,
  product_type,
  is_active,
  variables
)
SELECT
  'seller-order-notification',
  'Notification vendeur — nouvelle commande',
  'transactional',
  jsonb_build_object(
    'fr', 'Nouvelle commande #{{order_number}} — {{product_name}}',
    'en', 'New order #{{order_number}} — {{product_name}}'
  ),
  jsonb_build_object(
    'fr',
    '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto;padding:20px"><h1 style="color:#2563eb">Nouvelle commande reçue</h1><p>Bonjour {{seller_name}},</p><p>Vous avez reçu une nouvelle commande sur <strong>{{store_name}}</strong>.</p><table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;margin:16px 0"><tr><td style="color:#64748b">Commande</td><td style="font-weight:600;text-align:right">#{{order_number}}</td></tr><tr><td style="color:#64748b">Produit</td><td style="font-weight:600;text-align:right">{{product_name}}</td></tr><tr><td style="color:#64748b">Client</td><td style="font-weight:600;text-align:right">{{customer_name}}</td></tr><tr><td style="color:#64748b">Email</td><td style="font-weight:600;text-align:right">{{customer_email}}</td></tr><tr><td style="color:#64748b">Téléphone</td><td style="font-weight:600;text-align:right">{{customer_phone}}</td></tr><tr><td style="color:#64748b">Montant</td><td style="font-weight:600;text-align:right">{{total_amount}} {{currency}}</td></tr><tr><td style="color:#64748b">Paiement</td><td style="font-weight:600;text-align:right">{{payment_status}}</td></tr><tr><td style="color:#64748b">Livraison</td><td style="font-weight:600;text-align:right">{{shipping_address}}</td></tr></table><p style="text-align:center"><a href="{{dashboard_link}}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Voir la commande</a>{{#if whatsapp_customer_link}} <a href="{{whatsapp_customer_link}}" style="display:inline-block;padding:12px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Contacter le client</a>{{/if}}</p><p>Cordialement,<br>L''équipe Emarzona</p></body></html>',
    'en',
    '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto;padding:20px"><h1 style="color:#2563eb">New order received</h1><p>Hello {{seller_name}},</p><p>You received a new order on <strong>{{store_name}}</strong>.</p><table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;margin:16px 0"><tr><td style="color:#64748b">Order</td><td style="font-weight:600;text-align:right">#{{order_number}}</td></tr><tr><td style="color:#64748b">Product</td><td style="font-weight:600;text-align:right">{{product_name}}</td></tr><tr><td style="color:#64748b">Customer</td><td style="font-weight:600;text-align:right">{{customer_name}}</td></tr><tr><td style="color:#64748b">Email</td><td style="font-weight:600;text-align:right">{{customer_email}}</td></tr><tr><td style="color:#64748b">Phone</td><td style="font-weight:600;text-align:right">{{customer_phone}}</td></tr><tr><td style="color:#64748b">Amount</td><td style="font-weight:600;text-align:right">{{total_amount}} {{currency}}</td></tr><tr><td style="color:#64748b">Payment</td><td style="font-weight:600;text-align:right">{{payment_status}}</td></tr><tr><td style="color:#64748b">Shipping</td><td style="font-weight:600;text-align:right">{{shipping_address}}</td></tr></table><p style="text-align:center"><a href="{{dashboard_link}}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">View order</a>{{#if whatsapp_customer_link}} <a href="{{whatsapp_customer_link}}" style="display:inline-block;padding:12px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Contact customer</a>{{/if}}</p><p>Best regards,<br>The Emarzona team</p></body></html>'
  ),
  NULL,
  'noreply@emarzona.com',
  'Emarzona',
  'physical',
  true,
  '[
    "{{seller_name}}",
    "{{store_name}}",
    "{{order_number}}",
    "{{order_id}}",
    "{{product_name}}",
    "{{customer_name}}",
    "{{customer_email}}",
    "{{customer_phone}}",
    "{{total_amount}}",
    "{{currency}}",
    "{{payment_status}}",
    "{{shipping_address}}",
    "{{dashboard_link}}",
    "{{whatsapp_customer_link}}"
  ]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates WHERE slug = 'seller-order-notification'
);
