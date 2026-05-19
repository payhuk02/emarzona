# Architecture Emarzona

## Vue d'ensemble

Emarzona est une **SPA React (Vite)** connectée à **Supabase** (PostgreSQL, Auth, Storage, Edge Functions), déployée sur **Vercel**.

```
Navigateur → React + TanStack Query → Supabase (RLS + RPC)
                              ↘ Edge Functions → Moneroo, SendGrid, FedEx, …
```

## Cinq verticaux produits

| Type       | Table extension     | Checkout                                           |
| ---------- | ------------------- | -------------------------------------------------- |
| `digital`  | `digital_products`  | Panier ou achat direct                             |
| `physical` | `physical_products` | Panier                                             |
| `service`  | `service_products`  | Réservation sur fiche service                      |
| `course`   | `courses`           | Panier ou achat direct ; `/learn/:slug` si inscrit |
| `artist`   | `artist_products`   | Panier                                             |

Modèle unifié : `products.product_type` + `order_items` avec FK spécialisées (`digital_product_id`, `physical_product_id`, `booking_id`, etc.).

## Checkout

- `/checkout` sans `productId` → panier unifié (`pages/Checkout.tsx`, `buildOrderItemRows`, shipping FedEx).
- `/checkout?productId=…` → achat direct Moneroo (`pages/checkout/Checkout.tsx`).
- Routeur : `pages/checkout/CheckoutPage.tsx`.

## Paiements

- **Production :** Moneroo uniquement (`payment-service.ts`).
- Webhook `moneroo-webhook` : confirmation commande, bookings service, certificats artiste, emails.
- Trigger SQL `fulfill_digital_order_items_on_paid` : licences digitales après paiement (panier inclus).

## Shipping FedEx

- Edge Function `fedex-rates` : devis côté serveur (secrets `FEDEX_*` dans Supabase).
- Edge Function `fedex-ship` : création d’expédition et étiquette côté serveur.
- Edge Function `fedex-track` : suivi de colis côté serveur.
- Edge Function `fedex-cancel` : annulation d’expédition côté serveur.
- Clients : `fedex-rates-client.ts` (checkout), `fedex-ship-client.ts`, `fedex-track-client.ts`, `fedex-cancel-client.ts` (`FedexService`).
- Sans credentials FedEx → tarifs / étiquettes **mock** cohérents (XOF).
- Désactiver l’Edge côté client : `VITE_FEDEX_USE_EDGE=false`.

## Notifications

- Moteur unifié : `unified-notifications.ts` (`sendUnifiedNotification`) — email, SMS, push, in-app, rate limit, retry.
- Règles intelligentes : `smart-notification-engine.ts` délègue au moteur unifié (type `system_announcement`, metadata `rule_id`).
- Campagnes marketing : `marketingAutomationEngine.ts` → `sendUnifiedNotification` (email / push / SMS / in-app).

## Affiliation

- Cookie `emarzona_affiliate`, paramètre URL `?aff=` (`AffiliateLinkHandler`).
- Liens courts `/aff/:code` → `ShortLinkRedirect`.
- Commissions : triggers SQL + `useCreateOrder` (cookie tracking).
- E2E : `tests/e2e/affiliate-workflow.spec.ts`.

## Multi-tenant

- Plateforme : `emarzona.com`
- Boutiques : `*.myemarzona.shop` + domaines personnalisés (`SubdomainMiddleware`)

## Routes client clés

- `/account` — portail client
- `/account/bookings` — réservations services
- `/account/artist` — achats & certificats œuvres
- `/learn/:slug` — expérience cours (lecteur prioritaire si inscrit)

## Retours produits

- Photos client : `upload-return-photos.ts` → bucket Storage `attachments` (`returns/{userId}/{orderId}/`).

## Types Supabase

- Régénération : `npm run supabase:types` → `src/integrations/supabase/types.ts`
- Voir `src/integrations/supabase/README.md`

## Tests E2E checkout

- `tests/e2e/cart-checkout-workflow.spec.ts` — routage panier vs achat direct, gardes panier vide
- `npm run test:e2e:cart`

## Documentation complémentaire

- `README.md` — installation et scripts
- `supabase/migrations/` — schéma et triggers
- `SECURE_DEPLOY_CHECKLIST.md` — déploiement sécurisé
