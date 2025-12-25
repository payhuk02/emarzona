# 📍 Documentation des Routes - Payhula

**Dernière mise à jour** : Janvier 2025  
**Total de routes** : 100+

---

## 📋 Table des Matières

- [Routes Publiques](#routes-publiques)
- [Routes Protégées (Utilisateur)](#routes-protégées-utilisateur)
- [Routes Customer Portal](#routes-customer-portal)
- [Routes Admin](#routes-admin)
- [Routes Produits](#routes-produits)
- [Routes Cours](#routes-cours)
- [Routes Services](#routes-services)
- [Routes Paiements](#routes-paiements)
- [Routes Légales](#routes-légales)
- [Routes Spéciales](#routes-spéciales)

---

## 🔓 Routes Publiques

Routes accessibles sans authentification.

| Path | Composant | Description |
|------|-----------|-------------|
| `/` | `Landing` | Page d'accueil publique |
| `/auth` | `Auth` | Page d'authentification (login/register) |
| `/marketplace` | `Marketplace` | Marketplace publique avec tous les produits |
| `/cart` | `Cart` | Panier d'achat |
| `/checkout` | `Checkout` | Page de paiement |
| `/stores/:slug` | `Storefront` | Page publique d'une boutique |
| `/stores/:slug/products/:productSlug` | `ProductDetail` | Détail d'un produit (boutique) |
| `/digital/search` | `DigitalProductsSearch` | Recherche de produits digitaux |
| `/digital/compare` | `DigitalProductsCompare` | Comparaison de produits digitaux |
| `/digital/:productId` | `DigitalProductDetail` | Détail d'un produit digital |
| `/physical/:productId` | `PhysicalProductDetail` | Détail d'un produit physique |
| `/service/:serviceId` | `ServiceDetail` | Détail d'un service |
| `/courses/:slug` | `CourseDetail` | Détail d'un cours |
| `/bundles/:bundleId` | `BundleDetail` | Détail d'un bundle |
| `/wishlist/shared/:token` | `SharedWishlist` | Liste de souhaits partagée |

---

## 🔒 Routes Protégées (Utilisateur)

Routes nécessitant une authentification. Utilisent le composant `ProtectedRoute`.

### Dashboard Principal

| Path | Composant | Description |
|------|-----------|-------------|
| `/dashboard` | `Dashboard` | Tableau de bord principal |
| `/dashboard/store` | `Store` | Gestion de la boutique |
| `/dashboard/products` | `Products` | Liste des produits |
| `/dashboard/products/new` | `CreateProduct` | Création d'un nouveau produit |
| `/dashboard/products/:id/edit` | `EditProduct` | Édition d'un produit |

### Commandes et Clients

| Path | Composant | Description |
|------|-----------|-------------|
| `/dashboard/orders` | `Orders` | Liste des commandes |
| `/dashboard/advanced-orders` | `AdvancedOrderManagement` | Gestion avancée des commandes |
| `/dashboard/advanced-orders-test` | `AdvancedOrderManagementSimple` | Version simplifiée (test) |
| `/dashboard/customers` | `Customers` | Liste des clients |

### Paiements et Retraits

| Path | Composant | Description |
|------|-----------|-------------|
| `/dashboard/payments` | `Payments` | Historique des paiements |
| `/dashboard/withdrawals` | `Withdrawals` | Demandes de retrait |
| `/dashboard/payment-methods` | `PaymentMethods` | Méthodes de paiement |
| `/dashboard/payment-management` | `PaymentManagementList` | Gestion des paiements |
| `/dashboard/pay-balance` | `PayBalanceList` | Solde à payer |

### Analytics et Promotions

| Path | Composant | Description |
|------|-----------|-------------|
| `/dashboard/analytics` | `Analytics` | Analytics de la boutique |
| `/dashboard/promotions` | `Promotions` | Gestion des promotions |
| `/dashboard/pixels` | `Pixels` | Pixels de tracking |
| `/dashboard/seo` | `SEOAnalyzer` | Analyseur SEO |

### Paramètres et Autres

| Path | Composant | Description |
|------|-----------|-------------|
| `/dashboard/settings` | `Settings` | Paramètres de la boutique |
| `/dashboard/kyc` | `KYC` | Vérification d'identité |
| `/dashboard/referrals` | `Referrals` | Programme de parrainage |
| `/dashboard/store-affiliates` | `StoreAffiliateManagement` | Gestion des affiliés |
| `/dashboard/affiliates` | `StoreAffiliates` | Liste des affiliés |
| `/dashboard/webhooks` | `AdminWebhookManagement` | Gestion des webhooks |
| `/dashboard/digital-webhooks` | `DigitalProductWebhooks` | Webhooks produits digitaux |
| `/dashboard/physical-webhooks` | `PhysicalProductWebhooks` | Webhooks produits physiques |

### Produits Physiques

| Path | Composant | Description |
|------|-----------|-------------|
| `/dashboard/physical-inventory` | `PhysicalInventoryManagement` | Gestion de l'inventaire |
| `/dashboard/physical-promotions` | `PhysicalPromotions` | Promotions produits physiques |
| `/dashboard/physical-analytics` | `PhysicalProductsAnalytics` | Analytics produits physiques |
| `/dashboard/physical-lots` | `PhysicalProductsLots` | Gestion des lots |
| `/dashboard/physical-serial-tracking` | `PhysicalProductsSerialTracking` | Suivi des numéros de série |
| `/dashboard/physical-barcode-scanner` | `PhysicalBarcodeScanner` | Scanner de codes-barres |
| `/dashboard/physical-preorders` | `PhysicalPreOrders` | Précommandes |
| `/dashboard/physical-backorders` | `PhysicalBackorders` | Commandes en attente |
| `/dashboard/physical-bundles` | `PhysicalBundles` | Bundles produits physiques |
| `/dashboard/multi-currency` | `PhysicalMultiCurrency` | Multi-devises |

### Services Avancés

| Path | Composant | Description |
|------|-----------|-------------|
| `/dashboard/loyalty` | `AdminLoyaltyManagement` | Programme de fidélité |
| `/dashboard/gift-cards` | `AdminGiftCardManagement` | Cartes cadeaux |
| `/dashboard/suppliers` | `AdminSuppliersManagement` | Fournisseurs |
| `/dashboard/warehouses` | `AdminWarehousesManagement` | Entrepôts |
| `/dashboard/product-kits` | `AdminProductKitsManagement` | Kits de produits |
| `/dashboard/demand-forecasting` | `AdminDemandForecasting` | Prévision de la demande |
| `/dashboard/cost-optimization` | `AdminCostOptimization` | Optimisation des coûts |
| `/dashboard/batch-shipping` | `AdminBatchShipping` | Expédition groupée |

### Services

| Path | Composant | Description |
|------|-----------|-------------|
| `/dashboard/services/staff-availability` | `StaffAvailabilityCalendar` | Disponibilité du personnel |
| `/dashboard/services/resource-conflicts` | `ResourceConflictManagement` | Gestion des conflits de ressources |
| `/dashboard/services/recurring-bookings` | `RecurringBookingsManagement` | Réservations récurrentes |
| `/dashboard/advanced-calendar` | `AdvancedCalendarPage` | Calendrier avancé |
| `/dashboard/recurring-bookings` | `RecurringBookingsPage` | Page réservations récurrentes |
| `/dashboard/service-management` | `ServiceManagementPage` | Gestion des services |
| `/dashboard/bookings` | `BookingsManagement` | Gestion des réservations |
| `/dashboard/gamification` | `GamificationPage` | Gamification |

### Intégrations

| Path | Composant | Description |
|------|-----------|-------------|
| `/dashboard/integrations` | `IntegrationsPage` | Page d'intégrations |

---

## 👤 Routes Customer Portal

Routes pour le portail client.

| Path | Composant | Description |
|------|-----------|-------------|
| `/account` | `CustomerPortal` | Portail client principal |
| `/account/orders` | `CustomerMyOrders` | Mes commandes |
| `/account/downloads` | `CustomerMyDownloads` | Mes téléchargements |
| `/account/digital` | `CustomerDigitalPortal` | Portail produits digitaux |
| `/account/physical` | `CustomerPhysicalPortal` | Portail produits physiques |
| `/account/courses` | `CustomerMyCourses` | Mes cours |
| `/account/profile` | `CustomerMyProfile` | Mon profil |
| `/account/wishlist` | `CustomerMyWishlist` | Ma liste de souhaits |
| `/account/alerts` | `PriceStockAlerts` | Alertes prix/stock |
| `/account/invoices` | `CustomerMyInvoices` | Mes factures |
| `/account/returns` | `CustomerMyReturns` | Mes retours |
| `/account/loyalty` | `CustomerLoyaltyPage` | Programme de fidélité |
| `/account/gift-cards` | `CustomerMyGiftCardsPage` | Mes cartes cadeaux |

---

## 🎓 Routes Cours

| Path | Composant | Description |
|------|-----------|-------------|
| `/dashboard/my-courses` | `MyCourses` | Mes cours (créateur) |
| `/dashboard/courses/new` | `CreateCourse` | Créer un cours |
| `/courses/:slug` | `CourseDetail` | Détail d'un cours (public) |
| `/courses/:slug/analytics` | `CourseAnalytics` | Analytics d'un cours |

---

## 📦 Routes Produits Digitaux

| Path | Composant | Description |
|------|-----------|-------------|
| `/dashboard/digital-products` | `DigitalProductsList` | Liste des produits digitaux |
| `/dashboard/my-downloads` | `MyDownloads` | Mes téléchargements |
| `/dashboard/digital-products/bundles/create` | `CreateBundle` | Créer un bundle |
| `/dashboard/my-licenses` | `MyLicenses` | Mes licences |
| `/dashboard/licenses/manage/:id` | `LicenseManagement` | Gestion d'une licence |
| `/dashboard/license-management` | `MyLicenses` | Gestion des licences |
| `/dashboard/digital/analytics/:productId` | `DigitalProductAnalytics` | Analytics d'un produit digital |
| `/dashboard/digital/updates` | `DigitalProductUpdatesDashboard` | Mises à jour produits digitaux |

---

## 🚚 Routes Shipping

| Path | Composant | Description |
|------|-----------|-------------|
| `/dashboard/shipping` | `ShippingDashboard` | Dashboard shipping |
| `/dashboard/shipping-services` | `ShippingServices` | Services de livraison |
| `/dashboard/contact-shipping-service` | `ContactShippingService` | Contacter un service |
| `/dashboard/shipping-service-messages/:conversationId` | `ShippingServiceMessages` | Messages avec service |
| `/shipping` | `ShippingDashboard` | Dashboard shipping (route alternative) |

---

## 💬 Routes Messaging

| Path | Composant | Description |
|------|-----------|-------------|
| `/orders/:orderId/messaging` | `OrderMessaging` | Messaging pour une commande |
| `/vendor/messaging` | `VendorMessaging` | Messaging vendeur |
| `/vendor/messaging/:storeId/:productId?` | `VendorMessaging` | Messaging vendeur (avec params) |

---

## 💳 Routes Paiements

| Path | Composant | Description |
|------|-----------|-------------|
| `/payment/success` | `PaymentSuccess` | Paiement réussi |
| `/payment/cancel` | `PaymentCancel` | Paiement annulé |
| `/payments/:orderId/manage` | `PaymentManagement` | Gestion d'un paiement |
| `/payments/:orderId/balance` | `PayBalance` | Solde d'une commande |
| `/disputes/:disputeId` | `DisputeDetail` | Détail d'un litige |

---

## 🔔 Routes Notifications

| Path | Composant | Description |
|------|-----------|-------------|
| `/notifications` | `NotificationsCenter` | Centre de notifications |
| `/settings/notifications` | `NotificationSettings` | Paramètres de notifications |

---

## 👥 Routes Affiliation

| Path | Composant | Description |
|------|-----------|-------------|
| `/affiliate/dashboard` | `AffiliateDashboard` | Dashboard affilié |
| `/affiliate/courses` | `AffiliateCoursesDashboard` | Dashboard cours affiliés |
| `/affiliate/courses/:slug` | `CourseAffiliate` | Page d'affiliation d'un cours |

---

## ⚖️ Routes Légales

Routes publiques pour les pages légales.

| Path | Composant | Description |
|------|-----------|-------------|
| `/legal/terms` | `TermsOfService` | Conditions d'utilisation |
| `/legal/privacy` | `PrivacyPolicy` | Politique de confidentialité |
| `/legal/cookies` | `CookiePolicy` | Politique des cookies |
| `/legal/refund` | `RefundPolicy` | Politique de remboursement |

---

## 👨‍💼 Routes Admin

Routes réservées aux administrateurs de la plateforme.

### Dashboard et Vue d'ensemble

| Path | Composant | Description |
|------|-----------|-------------|
| `/admin` | `AdminDashboard` | Dashboard admin |
| `/admin/analytics` | `AdminAnalytics` | Analytics plateforme |
| `/admin/activity` | `AdminActivity` | Activité de la plateforme |
| `/admin/monitoring` | `AdminMonitoring` | Monitoring système |
| `/admin/error-monitoring` | `AdminErrorMonitoring` | Monitoring des erreurs |
| `/admin/accessibility` | `AdminAccessibilityReport` | Rapport d'accessibilité |

### Gestion des Utilisateurs et Boutiques

| Path | Composant | Description |
|------|-----------|-------------|
| `/admin/users` | `AdminUsers` | Gestion des utilisateurs |
| `/admin/stores` | `AdminStores` | Gestion des boutiques |
| `/admin/products` | `AdminProducts` | Gestion des produits |
| `/admin/orders` | `AdminOrders` | Gestion des commandes |

### Finances et Commissions

| Path | Composant | Description |
|------|-----------|-------------|
| `/admin/sales` | `AdminSales` | Ventes de la plateforme |
| `/admin/revenue` | `PlatformRevenue` | Revenus de la plateforme |
| `/admin/commission-settings` | `AdminCommissionSettings` | Paramètres de commission |
| `/admin/commission-payments` | `AdminCommissionPayments` | Paiements de commission |
| `/admin/payments` | `AdminPayments` | Gestion des paiements |
| `/admin/store-withdrawals` | `AdminStoreWithdrawals` | Retraits des boutiques |

### Parrainage et Affiliation

| Path | Composant | Description |
|------|-----------|-------------|
| `/admin/referrals` | `AdminReferrals` | Programme de parrainage |
| `/admin/affiliates` | `AdminAffiliates` | Gestion des affiliés |

### KYC et Sécurité

| Path | Composant | Description |
|------|-----------|-------------|
| `/admin/kyc` | `AdminKYC` | Vérification d'identité |
| `/admin/security` | `AdminSecurity` | Sécurité de la plateforme |
| `/admin/audit` | `AdminAudit` | Audit de sécurité |

### Gestion du Contenu

| Path | Composant | Description |
|------|-----------|-------------|
| `/admin/reviews` | `AdminReviews` | Gestion des avis |
| `/admin/courses` | `AdminCourses` | Gestion des cours |
| `/admin/inventory` | `AdminInventory` | Gestion de l'inventaire |

### Support et Litiges

| Path | Composant | Description |
|------|-----------|-------------|
| `/admin/support` | `AdminSupport` | Support client |
| `/admin/disputes` | `AdminDisputes` | Gestion des litiges |
| `/admin/notifications` | `AdminNotifications` | Notifications admin |

### Shipping et Logistique

| Path | Composant | Description |
|------|-----------|-------------|
| `/admin/shipping` | `AdminShipping` | Gestion du shipping |
| `/admin/shipping-conversations` | `AdminShippingConversations` | Conversations shipping |
| `/admin/vendor-conversations` | `AdminVendorConversations` | Conversations vendeurs |

### Paramètres et Configuration

| Path | Composant | Description |
|------|-----------|-------------|
| `/admin/settings` | `AdminSettings` | Paramètres admin |
| `/admin/platform-customization` | `PlatformCustomization` | Personnalisation plateforme |
| `/admin/integrations` | `IntegrationsPage` | Intégrations |
| `/admin/webhooks` | `AdminWebhookManagement` | Gestion des webhooks |

### Taxes et Retours

| Path | Composant | Description |
|------|-----------|-------------|
| `/admin/taxes` | `AdminTaxManagement` | Gestion des taxes |
| `/admin/returns` | `AdminReturnManagement` | Gestion des retours |

### Moneroo et Paiements

| Path | Composant | Description |
|------|-----------|-------------|
| `/admin/moneroo-analytics` | `MonerooAnalytics` | Analytics Moneroo |
| `/admin/moneroo-reconciliation` | `MonerooReconciliation` | Réconciliation Moneroo |
| `/admin/transaction-monitoring` | `TransactionMonitoring` | Monitoring des transactions |

---

## 🔧 Routes Spéciales

| Path | Composant | Description |
|------|-----------|-------------|
| `/inventory` | `InventoryDashboard` | Dashboard inventaire |
| `/i18n-test` | `I18nTest` | Test i18n (dev uniquement) |
| `*` | `NotFound` | Page 404 |

---

## 📝 Notes

- Toutes les routes protégées utilisent le composant `ProtectedRoute`
- Les routes admin nécessitent des permissions administrateur
- Les routes avec `:param` sont des routes dynamiques
- Les routes marquées "dev uniquement" ne sont disponibles qu'en développement

---

## 🔄 Redirections

| Ancienne Route | Nouvelle Route |
|----------------|----------------|
| `/store/:slug/product/:productSlug` | `/stores/:slug/products/:productSlug` |

---

**Dernière mise à jour** : Janvier 2025  
**Maintenu par** : Équipe Payhula

