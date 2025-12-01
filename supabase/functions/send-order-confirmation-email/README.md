# Edge Function: send-order-confirmation-email

## Description
Cette Edge Function envoie automatiquement des emails de confirmation de commande après qu'un paiement soit complété, en fonction du type de produit (digital, physical, service, course, artist).

## Déclenchement
L'envoi est déclenché automatiquement par un trigger SQL sur la table `orders` lorsque `payment_status` passe à `'paid'`.

## Payload attendu
```json
{
  "order_id": "uuid",
  "customer_email": "email@example.com",
  "customer_name": "Nom du client",
  "customer_id": "uuid (optionnel)"
}
```

## Fonctionnalités
- Identifie automatiquement le type de produit pour chaque item de la commande
- Envoie l'email approprié selon le type :
  - **Digital** : `order-confirmation-digital` avec lien de téléchargement
  - **Physical** : `order-confirmation-physical` avec adresse de livraison
  - **Service** : `order-confirmation-service` avec détails de réservation
  - **Course** : `course-enrollment-confirmation` avec lien d'accès au cours
  - **Artist** : `order-confirmation-artist` avec détails de l'œuvre

## Variables d'environnement requises
- `SUPABASE_URL` : URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé de service pour accès administrateur
- `SENDGRID_API_KEY` : Clé API SendGrid (ou autre service d'email configuré)

## Déploiement
```bash
supabase functions deploy send-order-confirmation-email
```

## Configuration
Assurez-vous que les templates d'email suivants existent dans la table `email_templates` :
- `order-confirmation-digital`
- `order-confirmation-physical`
- `order-confirmation-service`
- `course-enrollment-confirmation`
- `order-confirmation-artist`

## Logs
La fonction log toutes les opérations dans la console Supabase pour faciliter le debugging.

