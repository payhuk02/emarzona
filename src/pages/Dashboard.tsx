import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Clock } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useStore } from "@/hooks/use-store";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentOrdersCard } from "@/components/dashboard/RecentOrdersCard";
import { TopProductsCard } from "@/components/dashboard/TopProductsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { store, loading: storeLoading } = useStore();
  const { stats, loading } = useDashboardStats();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-card shadow-soft">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
              <SidebarTrigger />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Tableau de bord</h1>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-hero overflow-x-hidden">
            {storeLoading || loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-muted-foreground">Chargement...</p>
                </div>
              </div>
            ) : !store ? (
              <div className="max-w-3xl mx-auto text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Bienvenue ! 🎉</h2>
                <p className="text-muted-foreground mb-6">
                  Commencez par créer votre boutique pour accéder au tableau de bord
                </p>
                <Button onClick={() => navigate("/dashboard/store")}>
                  Créer ma boutique
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
                {/* Stats Grid */}
                <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                  <StatsCard
                    title="Produits"
                    value={stats.totalProducts}
                    description={`${stats.activeProducts} actif${stats.activeProducts > 1 ? "s" : ""}`}
                    icon={Package}
                  />
                  <StatsCard
                    title="Commandes"
                    value={stats.totalOrders}
                    description={`${stats.pendingOrders} en attente`}
                    icon={ShoppingCart}
                  />
                  <StatsCard
                    title="Clients"
                    value={stats.totalCustomers}
                    description="Clients enregistrés"
                    icon={Users}
                  />
                  <StatsCard
                    title="Revenus"
                    value={`${stats.totalRevenue.toLocaleString()} FCFA`}
                    description="Total des ventes"
                    icon={DollarSign}
                  />
                </div>

                {/* Quick Actions */}
                <QuickActions />

                {/* Recent Activity Grid */}
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                  <RecentOrdersCard orders={stats.recentOrders} />
                  <TopProductsCard products={stats.topProducts} />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
