# 🚀 PLAN D'IMPLÉMENTATION: GUEST CHECKOUT & AUTO-PROVISIONING

_Objectif : Débloquer les ventes "Invités" pour les produits digitaux avec DRM sans compromettre l'intégrité de la base de données (RLS & auth.users)._

## 1. Contexte & Défi Architectural

Actuellement, les licences (`digital_licenses`) et téléchargements exigent cryptographiquement un `user_id` valide (lié à `auth.users`).
Si nous enlevons simplement le blocage frontend, la base de données rejettera la commande (violation de contrainte de clé étrangère et RLS).

Pour contourner cela de manière élégante et invisible pour le client (comme Stripe ou Lemonsqueezy), nous allons déporter la création de la licence vers une **Edge Function sécurisée**.

## 2. Composants à créer / modifier

### 🛠️ A. Création de l'Edge Function : `guest-checkout-provisioning`

Cette fonction (hébergée sur Supabase Edge Functions) s'exécutera avec les droits administrateur (Service Role Key) et sera appelée par le frontend si le client n'est pas connecté.

**Workflow de la fonction :**

1. **Reçoit** : `email`, `customer_name`, `digital_product_id`, `license_type`, etc.
2. **Vérification** : Cherche si l'utilisateur existe déjà dans `auth.users` via l'Admin API.
3. **Auto-Provisioning** : S'il n'existe pas, crée un compte `auth.users` silencieusement avec un mot de passe aléatoire sécurisé (le client recevra un Magic Link ou définira son mot de passe plus tard via un email de bienvenue "Réclamez votre achat").
4. **Création de la Licence** : Génère la clé (via l'RPC existant) et insère la ligne dans `digital_licenses` en statut `pending` en contournant le RLS (puisque le client n'est pas encore connecté).
5. **Retourne** : `license_id` et `user_id` au frontend.

### 💻 B. Modification du Frontend : `useCreateDigitalOrder.ts`

1. Suppression de la condition bloquante (`if (!user?.id) throw Error(...)`).
2. Ajout de la logique de routage :
   - Si utilisateur connecté ➔ Procédure actuelle (insertion directe de la licence).
   - Si utilisateur anonyme (Guest) ➔ Appel de l'Edge Function `guest-checkout-provisioning` via `supabase.functions.invoke()`.
3. Le reste du flux (Création de l'Order, de l'Order Item et appel à Moneroo/Stripe) reste inchangé puisque la table `orders` gère déjà très bien les clients anonymes via la table `customers`.

### 📧 C. Expérience Post-Achat (Emailing)

Lors de la confirmation de paiement, le webhook de paiement devra déclencher l'envoi d'un email au client contenant non seulement sa facture et sa clé de licence, mais aussi un lien "Magic Link" pour se connecter à son espace client et télécharger ses fichiers. _(Note : Cette étape d'emailing dépendra du système de mailing déjà en place sur la plateforme, je m'assurerai de l'intégrer avec votre architecture)._

## User Review Required

Ce plan modifie l'architecture de checkout pour introduire l'auto-provisioning sécurisé.

> [!IMPORTANT]  
> En créant automatiquement des comptes `auth.users` silencieux, vos statistiques d'utilisateurs inscrits vont mécaniquement augmenter pour inclure tous vos acheteurs "Guests". C'est le standard de l'industrie (Shopify fait pareil).

**Êtes-vous d'accord avec cette architecture (Edge Function + Auto-provisioning) ? Si oui, je commence le développement.**
