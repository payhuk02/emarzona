-- Enrichit le récap email commande physique : boutique, produit, date, WhatsApp, espace client
-- Date: 2026-07-07

UPDATE public.email_templates
SET
  subject = jsonb_build_object(
    'fr', 'Votre commande #{{order_number}} — {{store_name}}',
    'en', 'Your order #{{order_number}} — {{store_name}}'
  ),
  html_content = jsonb_build_object(
    'fr',
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto;padding:20px;background:#f3f4f6}header{background:linear-gradient(135deg,#7c3aed 0%,#2563eb 100%);color:#fff;padding:28px 24px;text-align:center;border-radius:12px 12px 0 0}h1{margin:0;font-size:24px}.content{background:#fff;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px}.summary{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:20px 0}.summary-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eef2f7}.summary-row:last-child{border-bottom:none}.label{color:#64748b;font-size:13px}.value{color:#0f172a;font-weight:600;text-align:right}.actions{margin:28px 0 12px;text-align:center}.btn{display:inline-block;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:700;margin:8px 6px}.btn-primary{background:#2563eb;color:#fff}.btn-whatsapp{background:#16a34a;color:#fff}.note{font-size:13px;color:#64748b;text-align:center;margin-top:8px}.footer{text-align:center;color:#94a3b8;font-size:12px;margin-top:24px}</style></head><body><header><h1>Commande confirmée</h1><p style="margin:8px 0 0;opacity:.95">Merci {{user_name}} !</p></header><div class="content"><p>Votre commande a bien été enregistrée. Voici le récapitulatif :</p><div class="summary"><div class="summary-row"><span class="label">Boutique</span><span class="value">{{store_name}}</span></div><div class="summary-row"><span class="label">Produit</span><span class="value">{{product_name}}</span></div><div class="summary-row"><span class="label">N° commande</span><span class="value">#{{order_number}}</span></div><div class="summary-row"><span class="label">Date et heure</span><span class="value">{{order_date}}</span></div><div class="summary-row"><span class="label">Adresse de livraison</span><span class="value">{{shipping_address}}</span></div>{{#if delivery_date}}<div class="summary-row"><span class="label">Livraison estimée</span><span class="value">{{delivery_date}}</span></div>{{/if}}</div><div class="actions">{{#if whatsapp_link}}<a href="{{whatsapp_link}}" class="btn btn-whatsapp">Contacter le vendeur sur WhatsApp</a>{{/if}}{{#if customer_portal_link}}<a href="{{customer_portal_link}}" class="btn btn-primary">Accéder à mon espace client</a><p class="note">Connexion automatique avec l''adresse <strong>{{user_email}}</strong></p>{{/if}}</div>{{#if tracking_link}}<p style="text-align:center"><a href="{{tracking_link}}">Suivre mon colis</a></p>{{/if}}<p>Le vendeur vous tiendra informé de l''expédition et de la livraison.</p><p>Cordialement,<br>L''équipe Emarzona</p></div><div class="footer"><p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p></div></body></html>',
    'en',
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto;padding:20px;background:#f3f4f6}header{background:linear-gradient(135deg,#7c3aed 0%,#2563eb 100%);color:#fff;padding:28px 24px;text-align:center;border-radius:12px 12px 0 0}h1{margin:0;font-size:24px}.content{background:#fff;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px}.summary{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:20px 0}.summary-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eef2f7}.summary-row:last-child{border-bottom:none}.label{color:#64748b;font-size:13px}.value{color:#0f172a;font-weight:600;text-align:right}.actions{margin:28px 0 12px;text-align:center}.btn{display:inline-block;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:700;margin:8px 6px}.btn-primary{background:#2563eb;color:#fff}.btn-whatsapp{background:#16a34a;color:#fff}.note{font-size:13px;color:#64748b;text-align:center;margin-top:8px}.footer{text-align:center;color:#94a3b8;font-size:12px;margin-top:24px}</style></head><body><header><h1>Order confirmed</h1><p style="margin:8px 0 0;opacity:.95">Thank you {{user_name}}!</p></header><div class="content"><p>Your order has been recorded. Here is your summary:</p><div class="summary"><div class="summary-row"><span class="label">Store</span><span class="value">{{store_name}}</span></div><div class="summary-row"><span class="label">Product</span><span class="value">{{product_name}}</span></div><div class="summary-row"><span class="label">Order #</span><span class="value">#{{order_number}}</span></div><div class="summary-row"><span class="label">Date & time</span><span class="value">{{order_date}}</span></div><div class="summary-row"><span class="label">Shipping address</span><span class="value">{{shipping_address}}</span></div>{{#if delivery_date}}<div class="summary-row"><span class="label">Estimated delivery</span><span class="value">{{delivery_date}}</span></div>{{/if}}</div><div class="actions">{{#if whatsapp_link}}<a href="{{whatsapp_link}}" class="btn btn-whatsapp">Contact seller on WhatsApp</a>{{/if}}{{#if customer_portal_link}}<a href="{{customer_portal_link}}" class="btn btn-primary">Access my customer area</a><p class="note">Automatic sign-in with <strong>{{user_email}}</strong></p>{{/if}}</div>{{#if tracking_link}}<p style="text-align:center"><a href="{{tracking_link}}">Track my shipment</a></p>{{/if}}<p>The seller will keep you updated about shipping and delivery.</p><p>Best regards,<br>The Emarzona team</p></div><div class="footer"><p>This email was sent automatically. Please do not reply directly.</p></div></body></html>'
  ),
  variables = '[
    "{{user_name}}",
    "{{user_email}}",
    "{{order_id}}",
    "{{order_number}}",
    "{{store_name}}",
    "{{product_name}}",
    "{{order_date}}",
    "{{shipping_address}}",
    "{{delivery_date}}",
    "{{tracking_number}}",
    "{{tracking_link}}",
    "{{whatsapp_link}}",
    "{{customer_portal_link}}"
  ]'::jsonb,
  updated_at = NOW()
WHERE slug = 'order-confirmation-physical';

COMMENT ON TABLE public.email_templates IS
  'Templates email — order-confirmation-physical enrichi (boutique, WhatsApp, espace client)';
