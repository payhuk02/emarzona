#!/bin/bash
# Script pour créer les issues GitHub depuis GITHUB_ISSUES_TODOS.md
# Usage: ./scripts/create-github-issues.sh

# Vérifier que GitHub CLI est installé
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) n'est pas installé."
    echo "Installez-le depuis: https://cli.github.com/"
    exit 1
fi

# Vérifier l'authentification
if ! gh auth status &> /dev/null; then
    echo "❌ Vous n'êtes pas authentifié avec GitHub CLI."
    echo "Exécutez: gh auth login"
    exit 1
fi

echo "🚀 Création des issues GitHub..."
echo ""

# Issue #1: API FedEx
gh issue create \
  --title "🔴 [P0] Implémenter les appels API réels pour FedEx" \
  --body "## Description
Actuellement, les méthodes \`getRates()\` et \`createLabel()\` retournent des données mockées. Il faut implémenter les appels API réels vers l'API FedEx.

**Fichier**: \`src/integrations/shipping/fedex.ts\`
**Lignes**: 119, 159, 195

## Tâches
- [ ] Implémenter l'authentification OAuth pour FedEx
- [ ] Implémenter \`getRates()\` avec l'API réelle
- [ ] Implémenter \`createLabel()\` avec l'API réelle
- [ ] Ajouter gestion d'erreurs robuste
- [ ] Ajouter tests unitaires

## Acceptance Criteria
- Les tarifs sont calculés depuis l'API FedEx réelle
- Les étiquettes sont générées via l'API FedEx
- Gestion des erreurs réseau et API" \
  --label "enhancement,shipping,api,high-priority"

# Issue #2: API DHL
gh issue create \
  --title "🔴 [P0] Implémenter les appels API réels pour DHL" \
  --body "## Description
Actuellement, les méthodes \`getRates()\`, \`createLabel()\` et \`trackShipment()\` retournent des données mockées. Il faut implémenter les appels API réels vers l'API DHL.

**Fichier**: \`src/integrations/shipping/dhl.ts\`
**Lignes**: 106, 154, 198

## Tâches
- [ ] Implémenter \`getRates()\` avec l'API réelle
- [ ] Implémenter \`createLabel()\` avec l'API réelle
- [ ] Implémenter \`trackShipment()\` avec l'API réelle
- [ ] Ajouter gestion d'erreurs robuste
- [ ] Ajouter tests unitaires

## Acceptance Criteria
- Les tarifs sont calculés depuis l'API DHL réelle
- Les étiquettes sont générées via l'API DHL
- Le tracking fonctionne avec l'API DHL" \
  --label "enhancement,shipping,api,high-priority"

# Issue #3: Dashboard Analytics Services
gh issue create \
  --title "🟡 [P1] Implémenter le dashboard analytics des services" \
  --body "## Description
Le composant \`ServiceAnalyticsDashboard\` affiche actuellement un placeholder. Il faut implémenter le fetching réel des données avec React Query.

**Fichier**: \`src/components/service/ServiceAnalyticsDashboard.tsx\`
**Ligne**: 28

## Tâches
- [ ] Créer hook \`useServiceAnalytics()\` avec React Query
- [ ] Implémenter les requêtes Supabase pour les métriques
- [ ] Ajouter graphiques de réservations, tendances, revenus
- [ ] Ajouter filtres par période (jour, semaine, mois)
- [ ] Ajouter export CSV

## Acceptance Criteria
- Dashboard affiche des données réelles
- Graphiques interactifs avec Recharts
- Filtres fonctionnels
- Export CSV disponible" \
  --label "enhancement,analytics,services,medium-priority"

# Issue #4: Commandes Multi-Stores
gh issue create \
  --title "🟡 [P1] Gérer les commandes multi-stores" \
  --body "## Description
Actuellement, le checkout utilise le \`store_id\` du premier produit. Il faut gérer les commandes contenant des produits de plusieurs stores.

**Fichier**: \`src/pages/Checkout.tsx\`
**Ligne**: 289

## Tâches
- [ ] Détecter les produits de différents stores dans le panier
- [ ] Créer une commande séparée par store
- [ ] Gérer les paiements multiples si nécessaire
- [ ] Mettre à jour l'UI pour afficher les commandes multiples
- [ ] Ajouter tests E2E

## Acceptance Criteria
- Les commandes multi-stores sont créées correctement
- Chaque store reçoit sa commande
- L'utilisateur voit toutes ses commandes créées" \
  --label "enhancement,checkout,orders,medium-priority"

# Issue #5: Paiement et Inscription Cours
gh issue create \
  --title "🟡 [P1] Implémenter le système de paiement et inscription aux cours" \
  --body "## Description
Le bouton \"S'inscrire\" affiche actuellement un toast de développement. Il faut implémenter le flux complet de paiement et d'inscription.

**Fichier**: \`src/pages/courses/CourseDetail.tsx\`
**Ligne**: 178

## Tâches
- [ ] Intégrer le processus de paiement (PayDunya/Moneroo)
- [ ] Créer l'enrollment après paiement réussi
- [ ] Gérer les erreurs de paiement
- [ ] Ajouter redirection vers le cours après inscription
- [ ] Ajouter tests E2E

## Acceptance Criteria
- L'utilisateur peut payer et s'inscrire à un cours
- L'enrollment est créé automatiquement
- Redirection vers la page du cours après inscription" \
  --label "feature,courses,payment,high-priority"

# Issue #6: Upload Photos Retours
gh issue create \
  --title "🟡 [P1] Implémenter l'upload de photos pour les retours" \
  --body "## Description
Le formulaire de retour mentionne l'upload de photos mais n'a pas l'implémentation. Il faut ajouter la fonctionnalité d'upload.

**Fichier**: \`src/components/physical/returns/ReturnRequestForm.tsx\`
**Ligne**: 180

## Tâches
- [ ] Ajouter composant d'upload d'images
- [ ] Implémenter upload vers Supabase Storage
- [ ] Ajouter compression d'images
- [ ] Ajouter preview des images
- [ ] Stocker les URLs dans la table \`return_requests\`

## Acceptance Criteria
- L'utilisateur peut uploader des photos
- Les photos sont compressées et stockées
- Les URLs sont sauvegardées avec la demande de retour" \
  --label "feature,returns,upload,medium-priority"

# Issue #7: Notifications Email Versions
gh issue create \
  --title "🟡 [P1] Implémenter les notifications email pour les versions de produits" \
  --body "## Description
Quand une nouvelle version d'un produit digital est publiée, les utilisateurs qui ont acheté doivent être notifiés par email.

**Fichier**: \`src/hooks/digital/useProductVersions.ts\`
**Ligne**: 317

## Tâches
- [ ] Créer Supabase Edge Function pour l'envoi d'emails
- [ ] Récupérer la liste des utilisateurs ayant acheté le produit
- [ ] Créer template email pour nouvelles versions
- [ ] Implémenter l'envoi via SendGrid ou Supabase
- [ ] Ajouter logs et gestion d'erreurs

## Acceptance Criteria
- Les emails sont envoyés automatiquement
- Template email professionnel
- Gestion des erreurs d'envoi" \
  --label "feature,notifications,email,medium-priority"

# Issue #8: Navigation Cohorts
gh issue create \
  --title "🟢 [P2] Implémenter la navigation vers les pages de cohort" \
  --body "## Description
Le clic sur un cohort dans la liste ne navigue pas vers la page du cohort. Il faut implémenter la navigation.

**Fichier**: \`src/pages/courses/CourseDetail.tsx\`
**Ligne**: 497

## Tâches
- [ ] Créer la route \`/courses/:courseId/cohorts/:cohortId\`
- [ ] Créer la page \`CohortDetailPage\`
- [ ] Implémenter la navigation depuis \`CohortsList\`
- [ ] Ajouter tests

## Acceptance Criteria
- Navigation fonctionnelle vers la page du cohort
- Page affiche les détails du cohort" \
  --label "feature,courses,navigation,low-priority"

# Issue #9: Mark Cart Recovered
gh issue create \
  --title "🟢 [P2] Implémenter markCartRecovered dans le checkout" \
  --body "## Description
Après un checkout réussi, il faudrait marquer le panier comme récupéré pour éviter les notifications de panier abandonné.

**Fichier**: \`src/pages/Checkout.tsx\`
**Ligne**: 470

## Tâches
- [ ] Créer fonction \`markCartRecovered()\` dans le hook cart
- [ ] Appeler cette fonction après checkout réussi
- [ ] Mettre à jour la table \`abandoned_carts\`
- [ ] Ajouter tests

## Acceptance Criteria
- Le panier est marqué comme récupéré
- Plus de notifications de panier abandonné" \
  --label "feature,checkout,cart,low-priority"

# Issue #10: Vérification Disponibilité Staff
gh issue create \
  --title "🟢 [P2] Implémenter la vérification de disponibilité staff dans les réservations" \
  --body "## Description
Avant de créer une réservation, il faut vérifier si le staff est déjà réservé pour ce créneau.

**Fichier**: \`src/hooks/orders/useCreateServiceOrder.ts\`
**Ligne**: 175

## Tâches
- [ ] Créer fonction de vérification de disponibilité
- [ ] Vérifier les conflits avec les réservations existantes
- [ ] Retourner erreur si conflit
- [ ] Ajouter tests unitaires

## Acceptance Criteria
- Vérification de disponibilité avant création
- Erreur claire si conflit
- Pas de double réservation" \
  --label "feature,services,bookings,medium-priority"

# Issue #11: Logique Réservation ServiceDetail
gh issue create \
  --title "🟡 [P1] Implémenter la logique de réservation dans ServiceDetail" \
  --body "## Description
La page de détail d'un service n'a pas encore la logique de réservation implémentée.

**Fichier**: \`src/pages/service/ServiceDetail.tsx\`
**Ligne**: 118

## Tâches
- [ ] Créer formulaire de réservation
- [ ] Implémenter sélection de créneau
- [ ] Implémenter création de réservation
- [ ] Ajouter gestion des erreurs
- [ ] Ajouter tests E2E

## Acceptance Criteria
- L'utilisateur peut réserver un service
- Sélection de créneau fonctionnelle
- Réservation créée en base" \
  --label "feature,services,bookings,high-priority"

# Issue #12: Fonctionnalité Panier PhysicalProductDetail
gh issue create \
  --title "🟢 [P2] Implémenter la fonctionnalité de panier dans PhysicalProductDetail" \
  --body "## Description
La page de détail d'un produit physique n'a pas encore la fonctionnalité d'ajout au panier implémentée.

**Fichier**: \`src/pages/physical/PhysicalProductDetail.tsx\`
**Ligne**: 98

## Tâches
- [ ] Intégrer le hook \`useCart()\`
- [ ] Implémenter ajout au panier avec variants
- [ ] Gérer la quantité
- [ ] Ajouter toast de confirmation
- [ ] Ajouter tests E2E

## Acceptance Criteria
- L'utilisateur peut ajouter au panier
- Les variants sont gérés correctement
- Toast de confirmation affiché" \
  --label "feature,cart,physical-products,medium-priority"

# Issue #13: Upload Supabase Storage Retours
gh issue create \
  --title "🟢 [P2] Implémenter l'upload vers Supabase Storage pour les retours" \
  --body "## Description
Le formulaire de retour mentionne l'upload mais n'a pas l'implémentation vers Supabase Storage.

**Fichier**: \`src/components/returns/ReturnRequestForm.tsx\`
**Ligne**: 126

## Tâches
- [ ] Créer bucket \`return-requests\` dans Supabase Storage
- [ ] Implémenter upload avec \`supabase.storage\`
- [ ] Ajouter compression d'images
- [ ] Gérer les erreurs d'upload
- [ ] Stocker les URLs dans la base

## Acceptance Criteria
- Upload fonctionnel vers Supabase Storage
- Images compressées
- URLs stockées en base" \
  --label "feature,returns,storage,medium-priority"

echo ""
echo "✅ Toutes les issues ont été créées avec succès !"
echo ""
echo "Pour voir les issues créées:"
echo "  gh issue list"
echo ""
echo "Pour créer un milestone:"
echo "  gh milestone create 'TODOs Q1 2025' --description 'Issues TODO identifiées dans l'\''audit complet'"

