# Guide vendeur — Connexions paiement (Stripe, PayPal, Moneroo)

**Public** : vendeurs Emarzona · **Dernière mise à jour** : 2026-06-30  
**Dashboard** : `/dashboard/payment-connections`

---

## 1. Vue d’ensemble

| Rail                | Régions / devises                       | Compte encaissement           | Délai onboarding       |
| ------------------- | --------------------------------------- | ----------------------------- | ---------------------- |
| **Moneroo**         | Afrique francophone, XOF, mobile money  | Wallet Emarzona → reversement | Inclus (aucune action) |
| **Stripe Connect**  | International, EUR / USD / GBP / cartes | Votre compte Stripe Express   | 5–10 min               |
| **PayPal Commerce** | US, EU, UK, PayPal + cartes             | Votre compte PayPal Business  | 5–10 min               |

Emarzona prélève une commission plateforme sur chaque vente (voir votre plan). **Aucune carte ne transite par Emarzona** — conformité PCI SAQ-A via redirect PSP.

---

## 2. Activer Stripe Connect

1. Ouvrez **Dashboard → Connexions paiement**.
2. Cliquez **Connecter Stripe** (ou **Compléter Stripe** si déjà entamé).
3. Remplissez l’onboarding Express Stripe (identité, IBAN, activité).
4. Revenez sur Emarzona — le statut doit passer à **Actif**.
5. Testez une commande sandbox ou 1 € en staging.

**Statuts possibles**

| Statut              | Action                                                 |
| ------------------- | ------------------------------------------------------ |
| En attente          | Terminer l’onboarding Stripe                           |
| Action requise      | Informations manquantes — cliquez **Compléter Stripe** |
| Actif               | Prêt pour le checkout carte                            |
| Désactivé / Révoqué | Contactez le support ou reconnectez                    |

---

## 3. Activer PayPal Commerce

1. **Dashboard → Connexions paiement → Connecter PayPal**.
2. Connectez un compte **PayPal Business** (pas un compte personnel).
3. Autorisez Emarzona en tant que partenaire plateforme.
4. Statut **Actif** requis pour afficher PayPal au checkout.

Les acheteurs sont redirigés vers PayPal pour payer ; le retour se fait sur `/payment/success?provider=paypal`.

---

## 4. Moneroo (plateforme)

Moneroo reste **toujours actif** pour mobile money et XOF. Aucune connexion vendeur requise. Les reversements suivent votre wallet vendeur Emarzona.

---

## 5. Checkout acheteur — comportement

Avec **Orchestration V2** activée (production progressive) :

- L’acheteur voit les moyens de paiement disponibles selon **votre boutique**, **sa devise** et **votre pays**.
- Stripe si Connect actif + devise compatible.
- PayPal si Commerce actif.
- Moneroo pour XOF / mobile money.

Si aucun PSP international n’est connecté, seuls Moneroo et les options locales restent proposés.

---

## 6. Rollout canary (production)

Emarzona déploie V2 par phases (10 % → 50 % → 100 % des boutiques). Votre boutique peut être incluse ou en attente selon le pourcentage affiché sur la page Connexions paiement.

**Rollback** : l’équipe plateforme peut repasser à Moneroo seul via variable Vercel — vos connexions Stripe/PayPal restent enregistrées.

---

## 7. Dépannage

| Problème                                 | Solution                                                           |
| ---------------------------------------- | ------------------------------------------------------------------ |
| Stripe « Action requise »                | Reprendre l’onboarding ; vérifier IBAN et KYC Stripe               |
| PayPal ne s’affiche pas au checkout      | Statut PayPal **Actif** + devise boutique EUR/USD/GBP              |
| Erreur 500 au clic Connecter             | Vérifier que les Edge Functions sont déployées (support)           |
| Paiement réussi mais commande en attente | Webhook en retard — voir `/status` ; contacter support si > 15 min |

---

## 8. Ressources techniques

- Runbook prod : [PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md](./PAYMENT_ORCHESTRATION_V2_PROD_RUNBOOK.md)
- Stripe : [STRIPE_CONNECT_SETUP.md](./STRIPE_CONNECT_SETUP.md)
- PayPal : [PAYPAL_COMMERCE_SETUP.md](./PAYPAL_COMMERCE_SETUP.md)
- Remboursements sandbox : [QA_STRIPE_REFUND_SANDBOX_CHECKLIST.md](./QA_STRIPE_REFUND_SANDBOX_CHECKLIST.md)

---

## 9. Support

- Page statut : [emarzona.com/status](https://www.emarzona.com/status)
- Email : support@emarzona.com (joindre `store_id` et numéro de commande)
