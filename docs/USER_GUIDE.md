# Guide utilisateur — Emarzona

Emarzona est une plateforme e-commerce multi-verticale : produits **digitaux**, **physiques**, **services**, **cours (LMS)** et **œuvres d'artiste**.

## Vendeurs

### Démarrage

1. Créez un compte sur [emarzona.com](https://emarzona.com).
2. Ouvrez le **tableau de bord** → créez votre boutique.
3. Choisissez votre plan et les types de commerce autorisés (digital, physical, service, course, artist).
4. Publiez votre premier produit.

### Paiements

- **Afrique UEMOA (production actuelle)** : Moneroo (plateforme).
- **International (Payment V2)** : Stripe Connect + PayPal Commerce par boutique — voir [USER_GUIDE_PAYMENT_CONNECTIONS.md](./USER_GUIDE_PAYMENT_CONNECTIONS.md).

### Par verticale

| Verticale | Actions clés                              |
| --------- | ----------------------------------------- |
| Digital   | Licences auto, téléchargements, DRM       |
| Physical  | Inventaire WMS, expédition FedEx, retours |
| Service   | Réservations, créneaux, staff             |
| Cours     | LMS, inscriptions, `/learn/:slug`         |
| Artiste   | Enchères, certificats d'authenticité      |

### Outils vendeur

- **⌘K** — recherche rapide (Command-K)
- **Connexions paiement** — `/dashboard/payment-connections`
- **API vendeur v1** — voir [API.md](./API.md)
- **Webhooks** — notifications commandes / fulfillment

## Acheteurs

- **Portail client** : `/account` (commandes, téléchargements, réservations).
- **Cours** : `/learn/:slug` après inscription.
- **Œuvres** : `/account/artist` (certificats, enchères gagnées).
- **Emarzona Protect** : protection litiges — `/protect`.

## Support & statut

- Page statut SLA : `/status`
- Centre légal : `/legal/dpa`, export GDPR depuis les paramètres compte.

## Guides spécialisés

- [USER_GUIDE_PAYMENT_CONNECTIONS.md](./USER_GUIDE_PAYMENT_CONNECTIONS.md)
- [PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md](./PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md)
- [STRIPE_CONNECT_SETUP.md](./STRIPE_CONNECT_SETUP.md)
- [PAYPAL_COMMERCE_SETUP.md](./PAYPAL_COMMERCE_SETUP.md)
