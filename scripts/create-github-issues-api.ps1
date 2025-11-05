# Script PowerShell pour créer les issues GitHub via API
# Usage: $env:GH_TOKEN="your_token"; .\scripts\create-github-issues-api.ps1

param(
    [string]$Token = $env:GH_TOKEN
)

if (-not $Token) {
    Write-Host "❌ Token GitHub manquant!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pour obtenir un token:" -ForegroundColor Yellow
    Write-Host "1. Allez sur: https://github.com/settings/tokens" -ForegroundColor Cyan
    Write-Host "2. Cliquez sur 'Generate new token' > 'Generate new token (classic)'" -ForegroundColor Cyan
    Write-Host "3. Nom: 'Payhula Issues Creator'" -ForegroundColor Cyan
    Write-Host "4. Cochez: 'repo' (toutes les permissions repo)" -ForegroundColor Cyan
    Write-Host "5. Cliquez sur 'Generate token'" -ForegroundColor Cyan
    Write-Host "6. Copiez le token et exécutez:" -ForegroundColor Cyan
    Write-Host "   `$env:GH_TOKEN='votre_token'; .\scripts\create-github-issues-api.ps1" -ForegroundColor Green
    exit 1
}

$repo = "payhuk02/payhula"
$baseUrl = "https://api.github.com/repos/$repo/issues"

# Headers pour l'API
$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

Write-Host "🚀 Création des issues GitHub via API..." -ForegroundColor Green
Write-Host "Repository: $repo" -ForegroundColor Cyan
Write-Host ""

# Fonction pour créer une issue
function Create-Issue {
    param(
        [string]$Title,
        [string]$Body,
        [string[]]$Labels
    )
    
    $bodyObj = @{
        title = $Title
        body = $Body
        labels = $Labels
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $bodyObj -ContentType "application/json"
        Write-Host "✅ Issue créée: #$($response.number) - $Title" -ForegroundColor Green
        return $response.number
    }
    catch {
        Write-Host "❌ Erreur lors de la création: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "   Détails: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
        return $null
    }
}

# Issue #1: API FedEx
Write-Host "Création issue #1: API FedEx..." -ForegroundColor Cyan
$issue1 = Create-Issue `
    -Title "🔴 [P0] Implémenter les appels API réels pour FedEx" `
    -Body "## Description
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
- Gestion des erreurs réseau et API" `
    -Labels @("enhancement", "shipping", "api", "high-priority")

Start-Sleep -Seconds 1

# Issue #2: API DHL
Write-Host "Création issue #2: API DHL..." -ForegroundColor Cyan
$issue2 = Create-Issue `
    -Title "🔴 [P0] Implémenter les appels API réels pour DHL" `
    -Body "## Description
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
- Le tracking fonctionne avec l'API DHL" `
    -Labels @("enhancement", "shipping", "api", "high-priority")

Start-Sleep -Seconds 1

# Issue #3: Dashboard Analytics Services
Write-Host "Création issue #3: Dashboard Analytics Services..." -ForegroundColor Cyan
$issue3 = Create-Issue `
    -Title "🟡 [P1] Implémenter le dashboard analytics des services" `
    -Body "## Description
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
- Export CSV disponible" `
    -Labels @("enhancement", "analytics", "services", "medium-priority")

Start-Sleep -Seconds 1

# Issue #4: Commandes Multi-Stores
Write-Host "Création issue #4: Commandes Multi-Stores..." -ForegroundColor Cyan
$issue4 = Create-Issue `
    -Title "🟡 [P1] Gérer les commandes multi-stores" `
    -Body "## Description
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
- L'utilisateur voit toutes ses commandes créées" `
    -Labels @("enhancement", "checkout", "orders", "medium-priority")

Start-Sleep -Seconds 1

# Issue #5: Paiement et Inscription Cours
Write-Host "Création issue #5: Paiement et Inscription Cours..." -ForegroundColor Cyan
$issue5 = Create-Issue `
    -Title "🟡 [P1] Implémenter le système de paiement et inscription aux cours" `
    -Body "## Description
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
- Redirection vers la page du cours après inscription" `
    -Labels @("feature", "courses", "payment", "high-priority")

Start-Sleep -Seconds 1

# Issue #6: Upload Photos Retours
Write-Host "Création issue #6: Upload Photos Retours..." -ForegroundColor Cyan
$issue6 = Create-Issue `
    -Title "🟡 [P1] Implémenter l'upload de photos pour les retours" `
    -Body "## Description
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
- Les URLs sont sauvegardées avec la demande de retour" `
    -Labels @("feature", "returns", "upload", "medium-priority")

Start-Sleep -Seconds 1

# Issue #7: Notifications Email Versions
Write-Host "Création issue #7: Notifications Email Versions..." -ForegroundColor Cyan
$issue7 = Create-Issue `
    -Title "🟡 [P1] Implémenter les notifications email pour les versions de produits" `
    -Body "## Description
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
- Gestion des erreurs d'envoi" `
    -Labels @("feature", "notifications", "email", "medium-priority")

Start-Sleep -Seconds 1

# Issue #8: Navigation Cohorts
Write-Host "Création issue #8: Navigation Cohorts..." -ForegroundColor Cyan
$issue8 = Create-Issue `
    -Title "🟢 [P2] Implémenter la navigation vers les pages de cohort" `
    -Body "## Description
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
- Page affiche les détails du cohort" `
    -Labels @("feature", "courses", "navigation", "low-priority")

Start-Sleep -Seconds 1

# Issue #9: Mark Cart Recovered
Write-Host "Création issue #9: Mark Cart Recovered..." -ForegroundColor Cyan
$issue9 = Create-Issue `
    -Title "🟢 [P2] Implémenter markCartRecovered dans le checkout" `
    -Body "## Description
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
- Plus de notifications de panier abandonné" `
    -Labels @("feature", "checkout", "cart", "low-priority")

Start-Sleep -Seconds 1

# Issue #10: Vérification Disponibilité Staff
Write-Host "Création issue #10: Vérification Disponibilité Staff..." -ForegroundColor Cyan
$issue10 = Create-Issue `
    -Title "🟢 [P2] Implémenter la vérification de disponibilité staff dans les réservations" `
    -Body "## Description
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
- Pas de double réservation" `
    -Labels @("feature", "services", "bookings", "medium-priority")

Start-Sleep -Seconds 1

# Issue #11: Logique Réservation ServiceDetail
Write-Host "Création issue #11: Logique Réservation ServiceDetail..." -ForegroundColor Cyan
$issue11 = Create-Issue `
    -Title "🟡 [P1] Implémenter la logique de réservation dans ServiceDetail" `
    -Body "## Description
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
- Réservation créée en base" `
    -Labels @("feature", "services", "bookings", "high-priority")

Start-Sleep -Seconds 1

# Issue #12: Fonctionnalité Panier PhysicalProductDetail
Write-Host "Création issue #12: Fonctionnalité Panier PhysicalProductDetail..." -ForegroundColor Cyan
$issue12 = Create-Issue `
    -Title "🟢 [P2] Implémenter la fonctionnalité de panier dans PhysicalProductDetail" `
    -Body "## Description
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
- Toast de confirmation affiché" `
    -Labels @("feature", "cart", "physical-products", "medium-priority")

Start-Sleep -Seconds 1

# Issue #13: Upload Supabase Storage Retours
Write-Host "Création issue #13: Upload Supabase Storage Retours..." -ForegroundColor Cyan
$issue13 = Create-Issue `
    -Title "🟢 [P2] Implémenter l'upload vers Supabase Storage pour les retours" `
    -Body "## Description
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
- URLs stockées en base" `
    -Labels @("feature", "returns", "storage", "medium-priority")

Write-Host ""
Write-Host "✅ Toutes les issues ont été créées !" -ForegroundColor Green
Write-Host ""
Write-Host "Résumé:" -ForegroundColor Yellow
Write-Host "  - Issues créées: 13" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour voir les issues:" -ForegroundColor Yellow
Write-Host "  https://github.com/$repo/issues" -ForegroundColor Cyan

