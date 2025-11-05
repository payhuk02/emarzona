# Script PowerShell pour créer les issues GitHub depuis GITHUB_ISSUES_TODOS.md
# Usage: .\scripts\create-github-issues.ps1

# Vérifier que GitHub CLI est installé
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) n'est pas installé." -ForegroundColor Red
    Write-Host "Installez-le depuis: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Vérifier l'authentification
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vous n'êtes pas authentifié avec GitHub CLI." -ForegroundColor Red
    Write-Host "Exécutez: gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Création des issues GitHub..." -ForegroundColor Green
Write-Host ""

# Issue #1: API FedEx
Write-Host "Création issue #1: API FedEx..." -ForegroundColor Cyan
gh issue create `
  --title "🔴 [P0] Implémenter les appels API réels pour FedEx" `
  --body "## Description`nActuellement, les méthodes \`getRates()\` et \`createLabel()\` retournent des données mockées. Il faut implémenter les appels API réels vers l'API FedEx.`n`n**Fichier**: \`src/integrations/shipping/fedex.ts\``n**Lignes**: 119, 159, 195`n`n## Tâches`n- [ ] Implémenter l'authentification OAuth pour FedEx`n- [ ] Implémenter \`getRates()\` avec l'API réelle`n- [ ] Implémenter \`createLabel()\` avec l'API réelle`n- [ ] Ajouter gestion d'erreurs robuste`n- [ ] Ajouter tests unitaires`n`n## Acceptance Criteria`n- Les tarifs sont calculés depuis l'API FedEx réelle`n- Les étiquettes sont générées via l'API FedEx`n- Gestion des erreurs réseau et API" `
  --label "enhancement,shipping,api,high-priority"

# Issue #2: API DHL
Write-Host "Création issue #2: API DHL..." -ForegroundColor Cyan
gh issue create `
  --title "🔴 [P0] Implémenter les appels API réels pour DHL" `
  --body "## Description`nActuellement, les méthodes \`getRates()\`, \`createLabel()\` et \`trackShipment()\` retournent des données mockées. Il faut implémenter les appels API réels vers l'API DHL.`n`n**Fichier**: \`src/integrations/shipping/dhl.ts\``n**Lignes**: 106, 154, 198`n`n## Tâches`n- [ ] Implémenter \`getRates()\` avec l'API réelle`n- [ ] Implémenter \`createLabel()\` avec l'API réelle`n- [ ] Implémenter \`trackShipment()\` avec l'API réelle`n- [ ] Ajouter gestion d'erreurs robuste`n- [ ] Ajouter tests unitaires`n`n## Acceptance Criteria`n- Les tarifs sont calculés depuis l'API DHL réelle`n- Les étiquettes sont générées via l'API DHL`n- Le tracking fonctionne avec l'API DHL" `
  --label "enhancement,shipping,api,high-priority"

# Issue #3: Dashboard Analytics Services
Write-Host "Création issue #3: Dashboard Analytics Services..." -ForegroundColor Cyan
gh issue create `
  --title "🟡 [P1] Implémenter le dashboard analytics des services" `
  --body "## Description`nLe composant \`ServiceAnalyticsDashboard\` affiche actuellement un placeholder. Il faut implémenter le fetching réel des données avec React Query.`n`n**Fichier**: \`src/components/service/ServiceAnalyticsDashboard.tsx\``n**Ligne**: 28`n`n## Tâches`n- [ ] Créer hook \`useServiceAnalytics()\` avec React Query`n- [ ] Implémenter les requêtes Supabase pour les métriques`n- [ ] Ajouter graphiques de réservations, tendances, revenus`n- [ ] Ajouter filtres par période (jour, semaine, mois)`n- [ ] Ajouter export CSV`n`n## Acceptance Criteria`n- Dashboard affiche des données réelles`n- Graphiques interactifs avec Recharts`n- Filtres fonctionnels`n- Export CSV disponible" `
  --label "enhancement,analytics,services,medium-priority"

# Issue #4: Commandes Multi-Stores
Write-Host "Création issue #4: Commandes Multi-Stores..." -ForegroundColor Cyan
gh issue create `
  --title "🟡 [P1] Gérer les commandes multi-stores" `
  --body "## Description`nActuellement, le checkout utilise le \`store_id\` du premier produit. Il faut gérer les commandes contenant des produits de plusieurs stores.`n`n**Fichier**: \`src/pages/Checkout.tsx\``n**Ligne**: 289`n`n## Tâches`n- [ ] Détecter les produits de différents stores dans le panier`n- [ ] Créer une commande séparée par store`n- [ ] Gérer les paiements multiples si nécessaire`n- [ ] Mettre à jour l'UI pour afficher les commandes multiples`n- [ ] Ajouter tests E2E`n`n## Acceptance Criteria`n- Les commandes multi-stores sont créées correctement`n- Chaque store reçoit sa commande`n- L'utilisateur voit toutes ses commandes créées" `
  --label "enhancement,checkout,orders,medium-priority"

# Issue #5: Paiement et Inscription Cours
Write-Host "Création issue #5: Paiement et Inscription Cours..." -ForegroundColor Cyan
gh issue create `
  --title "🟡 [P1] Implémenter le système de paiement et inscription aux cours" `
  --body "## Description`nLe bouton \"S'inscrire\" affiche actuellement un toast de développement. Il faut implémenter le flux complet de paiement et d'inscription.`n`n**Fichier**: \`src/pages/courses/CourseDetail.tsx\``n**Ligne**: 178`n`n## Tâches`n- [ ] Intégrer le processus de paiement (PayDunya/Moneroo)`n- [ ] Créer l'enrollment après paiement réussi`n- [ ] Gérer les erreurs de paiement`n- [ ] Ajouter redirection vers le cours après inscription`n- [ ] Ajouter tests E2E`n`n## Acceptance Criteria`n- L'utilisateur peut payer et s'inscrire à un cours`n- L'enrollment est créé automatiquement`n- Redirection vers la page du cours après inscription" `
  --label "feature,courses,payment,high-priority"

# Issue #6: Upload Photos Retours
Write-Host "Création issue #6: Upload Photos Retours..." -ForegroundColor Cyan
gh issue create `
  --title "🟡 [P1] Implémenter l'upload de photos pour les retours" `
  --body "## Description`nLe formulaire de retour mentionne l'upload de photos mais n'a pas l'implémentation. Il faut ajouter la fonctionnalité d'upload.`n`n**Fichier**: \`src/components/physical/returns/ReturnRequestForm.tsx\``n**Ligne**: 180`n`n## Tâches`n- [ ] Ajouter composant d'upload d'images`n- [ ] Implémenter upload vers Supabase Storage`n- [ ] Ajouter compression d'images`n- [ ] Ajouter preview des images`n- [ ] Stocker les URLs dans la table \`return_requests\``n`n## Acceptance Criteria`n- L'utilisateur peut uploader des photos`n- Les photos sont compressées et stockées`n- Les URLs sont sauvegardées avec la demande de retour" `
  --label "feature,returns,upload,medium-priority"

# Issue #7: Notifications Email Versions
Write-Host "Création issue #7: Notifications Email Versions..." -ForegroundColor Cyan
gh issue create `
  --title "🟡 [P1] Implémenter les notifications email pour les versions de produits" `
  --body "## Description`nQuand une nouvelle version d'un produit digital est publiée, les utilisateurs qui ont acheté doivent être notifiés par email.`n`n**Fichier**: \`src/hooks/digital/useProductVersions.ts\``n**Ligne**: 317`n`n## Tâches`n- [ ] Créer Supabase Edge Function pour l'envoi d'emails`n- [ ] Récupérer la liste des utilisateurs ayant acheté le produit`n- [ ] Créer template email pour nouvelles versions`n- [ ] Implémenter l'envoi via SendGrid ou Supabase`n- [ ] Ajouter logs et gestion d'erreurs`n`n## Acceptance Criteria`n- Les emails sont envoyés automatiquement`n- Template email professionnel`n- Gestion des erreurs d'envoi" `
  --label "feature,notifications,email,medium-priority"

# Issue #8: Navigation Cohorts
Write-Host "Création issue #8: Navigation Cohorts..." -ForegroundColor Cyan
gh issue create `
  --title "🟢 [P2] Implémenter la navigation vers les pages de cohort" `
  --body "## Description`nLe clic sur un cohort dans la liste ne navigue pas vers la page du cohort. Il faut implémenter la navigation.`n`n**Fichier**: \`src/pages/courses/CourseDetail.tsx\``n**Ligne**: 497`n`n## Tâches`n- [ ] Créer la route \`/courses/:courseId/cohorts/:cohortId\``n- [ ] Créer la page \`CohortDetailPage\``n- [ ] Implémenter la navigation depuis \`CohortsList\``n- [ ] Ajouter tests`n`n## Acceptance Criteria`n- Navigation fonctionnelle vers la page du cohort`n- Page affiche les détails du cohort" `
  --label "feature,courses,navigation,low-priority"

# Issue #9: Mark Cart Recovered
Write-Host "Création issue #9: Mark Cart Recovered..." -ForegroundColor Cyan
gh issue create `
  --title "🟢 [P2] Implémenter markCartRecovered dans le checkout" `
  --body "## Description`nAprès un checkout réussi, il faudrait marquer le panier comme récupéré pour éviter les notifications de panier abandonné.`n`n**Fichier**: \`src/pages/Checkout.tsx\``n**Ligne**: 470`n`n## Tâches`n- [ ] Créer fonction \`markCartRecovered()\` dans le hook cart`n- [ ] Appeler cette fonction après checkout réussi`n- [ ] Mettre à jour la table \`abandoned_carts\``n- [ ] Ajouter tests`n`n## Acceptance Criteria`n- Le panier est marqué comme récupéré`n- Plus de notifications de panier abandonné" `
  --label "feature,checkout,cart,low-priority"

# Issue #10: Vérification Disponibilité Staff
Write-Host "Création issue #10: Vérification Disponibilité Staff..." -ForegroundColor Cyan
gh issue create `
  --title "🟢 [P2] Implémenter la vérification de disponibilité staff dans les réservations" `
  --body "## Description`nAvant de créer une réservation, il faut vérifier si le staff est déjà réservé pour ce créneau.`n`n**Fichier**: \`src/hooks/orders/useCreateServiceOrder.ts\``n**Ligne**: 175`n`n## Tâches`n- [ ] Créer fonction de vérification de disponibilité`n- [ ] Vérifier les conflits avec les réservations existantes`n- [ ] Retourner erreur si conflit`n- [ ] Ajouter tests unitaires`n`n## Acceptance Criteria`n- Vérification de disponibilité avant création`n- Erreur claire si conflit`n- Pas de double réservation" `
  --label "feature,services,bookings,medium-priority"

# Issue #11: Logique Réservation ServiceDetail
Write-Host "Création issue #11: Logique Réservation ServiceDetail..." -ForegroundColor Cyan
gh issue create `
  --title "🟡 [P1] Implémenter la logique de réservation dans ServiceDetail" `
  --body "## Description`nLa page de détail d'un service n'a pas encore la logique de réservation implémentée.`n`n**Fichier**: \`src/pages/service/ServiceDetail.tsx\``n**Ligne**: 118`n`n## Tâches`n- [ ] Créer formulaire de réservation`n- [ ] Implémenter sélection de créneau`n- [ ] Implémenter création de réservation`n- [ ] Ajouter gestion des erreurs`n- [ ] Ajouter tests E2E`n`n## Acceptance Criteria`n- L'utilisateur peut réserver un service`n- Sélection de créneau fonctionnelle`n- Réservation créée en base" `
  --label "feature,services,bookings,high-priority"

# Issue #12: Fonctionnalité Panier PhysicalProductDetail
Write-Host "Création issue #12: Fonctionnalité Panier PhysicalProductDetail..." -ForegroundColor Cyan
gh issue create `
  --title "🟢 [P2] Implémenter la fonctionnalité de panier dans PhysicalProductDetail" `
  --body "## Description`nLa page de détail d'un produit physique n'a pas encore la fonctionnalité d'ajout au panier implémentée.`n`n**Fichier**: \`src/pages/physical/PhysicalProductDetail.tsx\``n**Ligne**: 98`n`n## Tâches`n- [ ] Intégrer le hook \`useCart()\``n- [ ] Implémenter ajout au panier avec variants`n- [ ] Gérer la quantité`n- [ ] Ajouter toast de confirmation`n- [ ] Ajouter tests E2E`n`n## Acceptance Criteria`n- L'utilisateur peut ajouter au panier`n- Les variants sont gérés correctement`n- Toast de confirmation affiché" `
  --label "feature,cart,physical-products,medium-priority"

# Issue #13: Upload Supabase Storage Retours
Write-Host "Création issue #13: Upload Supabase Storage Retours..." -ForegroundColor Cyan
gh issue create `
  --title "🟢 [P2] Implémenter l'upload vers Supabase Storage pour les retours" `
  --body "## Description`nLe formulaire de retour mentionne l'upload mais n'a pas l'implémentation vers Supabase Storage.`n`n**Fichier**: \`src/components/returns/ReturnRequestForm.tsx\``n**Ligne**: 126`n`n## Tâches`n- [ ] Créer bucket \`return-requests\` dans Supabase Storage`n- [ ] Implémenter upload avec \`supabase.storage\``n- [ ] Ajouter compression d'images`n- [ ] Gérer les erreurs d'upload`n- [ ] Stocker les URLs dans la base`n`n## Acceptance Criteria`n- Upload fonctionnel vers Supabase Storage`n- Images compressées`n- URLs stockées en base" `
  --label "feature,returns,storage,medium-priority"

Write-Host ""
Write-Host "✅ Toutes les issues ont été créées avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "Pour voir les issues créées:" -ForegroundColor Yellow
Write-Host "  gh issue list" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour créer un milestone:" -ForegroundColor Yellow
Write-Host "  gh milestone create 'TODOs Q1 2025' --description 'Issues TODO identifiées dans l''audit complet'" -ForegroundColor Cyan

