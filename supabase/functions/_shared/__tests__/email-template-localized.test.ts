import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { pickLocalized, replaceVariables } from '../email-template-utils.ts';

Deno.test('pickLocalized parses JSON string stored in TEXT column', () => {
  const field = '{"fr":"Bonjour {{name}}","en":"Hello {{name}}"}';
  assertEquals(pickLocalized(field, 'fr'), 'Bonjour {{name}}');
  assertEquals(pickLocalized(field, 'en'), 'Hello {{name}}');
});

Deno.test('pickLocalized keeps plain string subjects', () => {
  assertEquals(pickLocalized('Sujet simple', 'fr'), 'Sujet simple');
});

Deno.test('replaceVariables renders single-language template', () => {
  const html =
    '<p>Produit : {{product_name}}</p>{{#if customer_portal_link}}<a href="{{customer_portal_link}}">Espace client</a>{{/if}}';
  const out = replaceVariables(html, {
    product_name: 'HP EliteBook',
    customer_portal_link: 'https://example.com/login',
  });
  assertEquals(out.includes('Produit : HP EliteBook'), true);
  assertEquals(out.includes('Espace client'), true);
});
