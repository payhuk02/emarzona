const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.from('email_templates').update({
    html_content: {
      'fr': '<h1>Merci {{user_name}} !</h1><p>Votre commande #{{order_number}} sur <strong>{{store_name}}</strong> a bien été confirmée.</p><p>Produit : {{product_name}}</p><p>Prix : {{price}}</p><p><br><a href="{{download_link}}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Accéder à mes achats digitaux</a><br></p>{{#if whatsapp_link}}<p style="margin-top:20px;">Besoin d\'aide ? <a href="{{whatsapp_link}}">Contacter le vendeur sur WhatsApp</a></p>{{/if}}',
      'en': '<h1>Thank you {{user_name}}!</h1><p>Your order #{{order_number}} on <strong>{{store_name}}</strong> is confirmed.</p><p>Product: {{product_name}}</p><p>Price: {{price}}</p><p><br><a href="{{download_link}}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Access my digital downloads</a><br></p>{{#if whatsapp_link}}<p style="margin-top:20px;">Need help? <a href="{{whatsapp_link}}">Contact seller on WhatsApp</a></p>{{/if}}'
    },
    variables: ['{{user_name}}', '{{order_number}}', '{{product_name}}', '{{download_link}}', '{{store_name}}', '{{price}}', '{{whatsapp_link}}']
  }).eq('slug', 'order-confirmation-digital');

  if (error) {
    console.error('Error updating template:', error);
    process.exit(1);
  } else {
    console.log('Template updated successfully');
  }
}
run();
