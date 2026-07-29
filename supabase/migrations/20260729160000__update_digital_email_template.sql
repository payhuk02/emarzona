-- Update the order-confirmation-digital email template to include price, store name, and whatsapp link
UPDATE public.email_templates
SET 
  html_content = '{
    "fr": "<h1>Merci {{user_name}} !</h1><p>Votre commande #{{order_number}} sur <strong>{{store_name}}</strong> a bien été confirmée.</p><p>Produit : {{product_name}}</p><p>Prix : {{price}}</p><p><br><a href=\"{{download_link}}\" style=\"display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;\">Accéder à mes achats digitaux</a><br></p>{{#if whatsapp_link}}<p style=\"margin-top:20px;\">Besoin d''aide ? <a href=\"{{whatsapp_link}}\">Contacter le vendeur sur WhatsApp</a></p>{{/if}}",
    "en": "<h1>Thank you {{user_name}}!</h1><p>Your order #{{order_number}} on <strong>{{store_name}}</strong> is confirmed.</p><p>Product: {{product_name}}</p><p>Price: {{price}}</p><p><br><a href=\"{{download_link}}\" style=\"display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;\">Access my digital downloads</a><br></p>{{#if whatsapp_link}}<p style=\"margin-top:20px;\">Need help? <a href=\"{{whatsapp_link}}\">Contact seller on WhatsApp</a></p>{{/if}}"
  }'::jsonb,
  variables = '["{{user_name}}", "{{order_number}}", "{{product_name}}", "{{download_link}}", "{{store_name}}", "{{price}}", "{{whatsapp_link}}"]'::jsonb,
  updated_at = NOW()
WHERE slug = 'order-confirmation-digital';
