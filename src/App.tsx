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

// Pages principales
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Store from "./pages/Store";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Promotions from "./pages/Promotions";
import Analytics from "./pages/Analytics";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";
import CreateProduct from "./pages/CreateProduct";
import EditProduct from "./pages/EditProduct";
import Storefront from "./pages/Storefront";
import ProductDetail from "./pages/ProductDetail";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";
import KYC from "./pages/KYC";
import AdminKYC from "./pages/AdminKYC";
import PlatformRevenue from "./pages/PlatformRevenue";
import Referrals from "./pages/Referrals";
import SEOAnalyzer from "./pages/SEOAnalyzer";
import Pixels from "./pages/Pixels";

// Pages Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStores from "./pages/admin/AdminStores";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminSales from "./pages/admin/AdminSales";
import AdminReferrals from "./pages/admin/AdminReferrals";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNotifications from "./pages/admin/AdminNotifications";

// Pages Moneroo (paiement)
import PaymentSuccess from "./pages/payments/PaymentSuccess";
import PaymentCancel from "./pages/payments/PaymentCancel";

const AppContent = () => {
  useScrollRestoration();
  useDarkMode(); // Active le mode sombre globalement

  return (
    <>
      <PerformanceOptimizer />
      <LoadingBar />
      <ScrollToTop />
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
