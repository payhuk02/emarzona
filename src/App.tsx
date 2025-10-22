import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { LoadingBar } from "@/components/navigation/LoadingBar";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { useDarkMode } from "@/hooks/useDarkMode";
import { PerformanceOptimizer } from "@/components/optimization/PerformanceOptimizer";
import { Suspense, lazy } from "react";

// Composant de chargement pour le lazy loading
const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

// Pages principales - Lazy loading
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const Store = lazy(() => import("./pages/Store"));
const Orders = lazy(() => import("./pages/Orders"));
const Customers = lazy(() => import("./pages/Customers"));
const Promotions = lazy(() => import("./pages/Promotions"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Payments = lazy(() => import("./pages/Payments"));
const Settings = lazy(() => import("./pages/Settings"));
const CreateProduct = lazy(() => import("./pages/CreateProduct"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const Storefront = lazy(() => import("./pages/Storefront"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const NotFound = lazy(() => import("./pages/NotFound"));
const KYC = lazy(() => import("./pages/KYC"));
const AdminKYC = lazy(() => import("./pages/AdminKYC"));
const PlatformRevenue = lazy(() => import("./pages/PlatformRevenue"));
const Referrals = lazy(() => import("./pages/Referrals"));
const SEOAnalyzer = lazy(() => import("./pages/SEOAnalyzer"));
const Pixels = lazy(() => import("./pages/Pixels"));

// Pages Admin - Lazy loading
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminStores = lazy(() => import("./pages/admin/AdminStores"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminSales = lazy(() => import("./pages/admin/AdminSales"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminActivity = lazy(() => import("./pages/admin/AdminActivity"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));

// Pages Moneroo (paiement) - Lazy loading
const PaymentSuccess = lazy(() => import("./pages/payments/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/payments/PaymentCancel"));

const AppContent = () => {
  useScrollRestoration();
  useDarkMode(); // Active le mode sombre globalement

  return (
    <>
      <PerformanceOptimizer />
      <LoadingBar />
      <ScrollToTop />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* --- Routes publiques --- */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/stores/:slug" element={<Storefront />} />
          <Route path="/stores/:slug/products/:productSlug" element={<ProductDetail />} />

          {/* --- Routes Moneroo --- */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />

          {/* --- Routes utilisateur (protégées) --- */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
          <Route path="/dashboard/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/dashboard/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/dashboard/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/dashboard/promotions" element={<ProtectedRoute><Promotions /></ProtectedRoute>} />
          <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/dashboard/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/dashboard/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
          <Route path="/dashboard/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
          <Route path="/dashboard/pixels" element={<ProtectedRoute><Pixels /></ProtectedRoute>} />
          <Route path="/dashboard/seo" element={<ProtectedRoute><SEOAnalyzer /></ProtectedRoute>} />
          <Route path="/dashboard/products/new" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
          <Route path="/dashboard/products/:id/edit" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />

          {/* --- Routes administrateur --- */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/stores" element={<ProtectedRoute><AdminStores /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/sales" element={<ProtectedRoute><AdminSales /></ProtectedRoute>} />
          <Route path="/admin/referrals" element={<ProtectedRoute><AdminReferrals /></ProtectedRoute>} />
          <Route path="/admin/activity" element={<ProtectedRoute><AdminActivity /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
          <Route path="/admin/revenue" element={<ProtectedRoute><PlatformRevenue /></ProtectedRoute>} />
          <Route path="/admin/kyc" element={<ProtectedRoute><AdminKYC /></ProtectedRoute>} />

          {/* --- Route de fallback --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
