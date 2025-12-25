/**
 * Script de vérification de l'isolation des données par boutique
 * Vérifie que toutes les pages du sidebar utilisent le bon hook useStore
 */

const fs = require('fs');
const path = require('path');

// Routes du sidebar depuis AppSidebar.tsx
const sidebarRoutes = [
  // Principal
  { url: '/dashboard', page: 'Dashboard.tsx', needsStore: true },
  { url: '/dashboard/store', page: 'Store.tsx', needsStore: false }, // Gère plusieurs stores
  { url: '/marketplace', page: 'Marketplace.tsx', needsStore: false }, // Public
  
  // Produits & Cours
  { url: '/dashboard/products', page: 'Products.tsx', needsStore: true },
  { url: '/dashboard/my-courses', page: 'courses/MyCourses.tsx', needsStore: true },
  { url: '/dashboard/digital-products', page: 'digital/DigitalProductsList.tsx', needsStore: true },
  { url: '/dashboard/my-downloads', page: 'customer/MyDownloads.tsx', needsStore: false }, // User data
  { url: '/dashboard/my-licenses', page: 'digital/MyLicenses.tsx', needsStore: false }, // User data
  { url: '/dashboard/digital-products/bundles/create', page: 'digital/CreateBundle.tsx', needsStore: true },
  { url: '/dashboard/digital/updates', page: 'digital/DigitalProductUpdatesDashboard.tsx', needsStore: true },
  
  // Ventes & Logistique
  { url: '/dashboard/orders', page: 'Orders.tsx', needsStore: true },
  { url: '/dashboard/withdrawals', page: 'Withdrawals.tsx', needsStore: true },
  { url: '/dashboard/payment-methods', page: 'PaymentMethods.tsx', needsStore: true },
  { url: '/dashboard/advanced-orders', page: 'AdvancedOrderManagement.tsx', needsStore: true },
  { url: '/vendor/messaging', page: 'vendor/VendorMessaging.tsx', needsStore: true },
  { url: '/dashboard/bookings', page: 'service/BookingsManagement.tsx', needsStore: true },
  { url: '/dashboard/advanced-calendar', page: 'service/AdvancedCalendarPage.tsx', needsStore: true },
  { url: '/dashboard/service-management', page: 'service/ServiceManagementPage.tsx', needsStore: true },
  { url: '/dashboard/recurring-bookings', page: 'service/RecurringBookingsPage.tsx', needsStore: true },
  { url: '/dashboard/services/staff-availability', page: 'service/StaffAvailabilityCalendar.tsx', needsStore: true },
  { url: '/dashboard/services/resource-conflicts', page: 'service/ResourceConflictManagement.tsx', needsStore: true },
  { url: '/dashboard/inventory', page: 'inventory/InventoryDashboard.tsx', needsStore: true },
  { url: '/dashboard/shipping', page: 'shipping/ShippingDashboard.tsx', needsStore: true },
  { url: '/dashboard/shipping-services', page: 'shipping/ShippingServices.tsx', needsStore: true },
  { url: '/dashboard/contact-shipping-service', page: 'shipping/ContactShippingService.tsx', needsStore: true },
  { url: '/dashboard/batch-shipping', page: 'admin/AdminBatchShipping.tsx', needsStore: true },
  { url: '/dashboard/product-kits', page: 'admin/AdminProductKitsManagement.tsx', needsStore: true },
  { url: '/dashboard/demand-forecasting', page: 'admin/AdminDemandForecasting.tsx', needsStore: true },
  { url: '/dashboard/cost-optimization', page: 'admin/AdminCostOptimization.tsx', needsStore: true },
  { url: '/dashboard/suppliers', page: 'admin/AdminSuppliersManagement.tsx', needsStore: true },
  { url: '/dashboard/warehouses', page: 'admin/AdminWarehousesManagement.tsx', needsStore: true },
  { url: '/dashboard/physical-inventory', page: 'admin/PhysicalInventoryManagement.tsx', needsStore: true },
  { url: '/dashboard/physical-analytics', page: 'admin/PhysicalProductsAnalytics.tsx', needsStore: true },
  { url: '/dashboard/physical-lots', page: 'admin/PhysicalProductsLots.tsx', needsStore: true },
  { url: '/dashboard/physical-serial-tracking', page: 'admin/PhysicalProductsSerialTracking.tsx', needsStore: true },
  { url: '/dashboard/physical-barcode-scanner', page: 'admin/PhysicalBarcodeScanner.tsx', needsStore: true },
  { url: '/dashboard/physical-preorders', page: 'admin/PhysicalPreOrders.tsx', needsStore: true },
  { url: '/dashboard/physical-backorders', page: 'admin/PhysicalBackorders.tsx', needsStore: true },
  { url: '/dashboard/physical-bundles', page: 'admin/PhysicalBundles.tsx', needsStore: true },
  { url: '/dashboard/multi-currency', page: 'admin/PhysicalMultiCurrency.tsx', needsStore: true },
  
  // Finance & Paiements
  { url: '/dashboard/payments', page: 'Payments.tsx', needsStore: true },
  { url: '/dashboard/pay-balance', page: 'payments/PayBalanceList.tsx', needsStore: true },
  { url: '/dashboard/payment-management', page: 'payments/PaymentManagementList.tsx', needsStore: true },
  
  // Marketing & Croissance
  { url: '/dashboard/customers', page: 'Customers.tsx', needsStore: true },
  { url: '/dashboard/promotions', page: 'Promotions.tsx', needsStore: true },
  { url: '/dashboard/physical-promotions', page: 'admin/PhysicalPromotions.tsx', needsStore: true },
  { url: '/dashboard/referrals', page: 'Referrals.tsx', needsStore: true },
  { url: '/dashboard/affiliates', page: 'StoreAffiliates.tsx', needsStore: true },
  { url: '/affiliate/courses', page: 'affiliate/AffiliateCoursesDashboard.tsx', needsStore: false }, // Affiliate data
  
  // Analytics & SEO
  { url: '/dashboard/analytics', page: 'Analytics.tsx', needsStore: true },
  { url: '/dashboard/pixels', page: 'Pixels.tsx', needsStore: true },
  { url: '/dashboard/seo', page: 'SEOAnalyzer.tsx', needsStore: true },
  
  // Systèmes & Intégrations
  { url: '/dashboard/integrations', page: 'admin/IntegrationsPage.tsx', needsStore: true },
  { url: '/dashboard/webhooks', page: 'admin/AdminWebhookManagement.tsx', needsStore: true },
  { url: '/dashboard/digital-webhooks', page: 'admin/DigitalProductWebhooks.tsx', needsStore: true },
  { url: '/dashboard/physical-webhooks', page: 'admin/PhysicalProductWebhooks.tsx', needsStore: true },
  { url: '/dashboard/loyalty', page: 'admin/AdminLoyaltyManagement.tsx', needsStore: true },
  { url: '/dashboard/gift-cards', page: 'admin/AdminGiftCardManagement.tsx', needsStore: true },
  
  // Configuration
  { url: '/dashboard/kyc', page: 'KYC.tsx', needsStore: true },
  { url: '/dashboard/settings', page: 'Settings.tsx', needsStore: false }, // Gère plusieurs stores
];

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, usesOldHook: false, usesNewHook: false, error: 'File not found' };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const usesOldHook = /from\s+['"]@\/hooks\/use-store['"]|from\s+['"]\.\/use-store['"]|from\s+['"]\.\.\/.*use-store['"]/.test(content);
  const usesNewHook = /from\s+['"]@\/hooks\/useStore['"]|from\s+['"]\.\/useStore['"]|from\s+['"]\.\.\/.*useStore['"]/.test(content);
  const usesStoreContext = /useStoreContext|StoreContext/.test(content);
  const filtersByStoreId = /\.eq\(['"]store_id['"]|store\.id|storeId/.test(content);
  
  return {
    exists: true,
    usesOldHook,
    usesNewHook,
    usesStoreContext,
    filtersByStoreId,
    content: content.substring(0, 500) // First 500 chars for context
  };
}

function verifySidebarIsolation() {
  const pagesDir = path.join(__dirname, '..', 'src', 'pages');
  const results = [];
  
  console.log('🔍 Vérification de l\'isolation des données par boutique...\n');
  
  sidebarRoutes.forEach(route => {
    const filePath = path.join(pagesDir, route.page);
    const check = checkFile(filePath);
    
    results.push({
      route: route.url,
      page: route.page,
      needsStore: route.needsStore,
      ...check
    });
  });
  
  // Générer le rapport
  console.log('📊 RAPPORT DE VÉRIFICATION\n');
  console.log('='.repeat(80));
  
  const issues = [];
  const ok = [];
  const notFound = [];
  
  results.forEach(result => {
    if (!result.exists) {
      notFound.push(result);
      console.log(`❌ ${result.route} - ${result.page} - FICHIER NON TROUVÉ`);
    } else if (result.needsStore && result.usesOldHook) {
      issues.push(result);
      console.log(`⚠️  ${result.route} - ${result.page} - UTILISE L'ANCIEN HOOK use-store`);
    } else if (result.needsStore && !result.usesNewHook && !result.usesStoreContext) {
      issues.push(result);
      console.log(`⚠️  ${result.route} - ${result.page} - N'UTILISE PAS useStore`);
    } else if (result.needsStore && result.usesNewHook) {
      ok.push(result);
      console.log(`✅ ${result.route} - ${result.page} - OK`);
    } else if (!result.needsStore) {
      console.log(`ℹ️  ${result.route} - ${result.page} - Pas besoin de store (user data ou public)`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 RÉSUMÉ:`);
  console.log(`✅ Pages OK: ${ok.length}`);
  console.log(`⚠️  Pages à corriger: ${issues.length}`);
  console.log(`❌ Fichiers non trouvés: ${notFound.length}`);
  
  if (issues.length > 0) {
    console.log(`\n⚠️  PAGES À CORRIGER:`);
    issues.forEach(issue => {
      console.log(`   - ${issue.route} (${issue.page})`);
    });
  }
  
  return { ok, issues, notFound };
}

if (require.main === module) {
  verifySidebarIsolation();
}

module.exports = { verifySidebarIsolation };

