import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, DollarSign, TrendingUp, Crown, Eye, Edit } from "lucide-react";

export default function AdminTemplatesPremium() {
  // Mock data
  const premiumTemplates = [
    {
      id: "1",
      name: "Ultimate E-book Premium",
      type: "digital",
      price: 9.99,
      sales: 45,
      revenue: 449.55,
      rating: 4.8,
    },
    {
      id: "2",
      name: "Executive MBA Course",
      type: "course",
      price: 49.99,
      sales: 12,
      revenue: 599.88,
      rating: 5.0,
    },
    {
      id: "3",
      name: "Creator Bundle Premium",
      type: "digital",
      price: 19.99,
      sales: 28,
      revenue: 559.72,
      rating: 4.9,
    },
  ];

  const totalRevenue = premiumTemplates.reduce((acc, t) => acc + t.revenue, 0);
  const totalSales = premiumTemplates.reduce((acc, t) => acc + t.sales, 0);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Crown className="h-8 w-8 text-yellow-500" />
                  Templates Premium
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gestion des templates payants et de leurs performances
                </p>
              </div>
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                Nouveau Template Premium
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    Templates Premium
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{premiumTemplates.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Actifs sur la plateforme
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Revenu Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ventes de templates
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Ventes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSales}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Templates vendus
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Prix Moyen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    $
                    {(
                      premiumTemplates.reduce((acc, t) => acc + t.price, 0) /
                      premiumTemplates.length
                    ).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Par template</p>
                </CardContent>
              </Card>
            </div>

            {/* Templates List */}
            <Card>
              <CardHeader>
                <CardTitle>Templates Premium</CardTitle>
                <CardDescription>
                  Gérez les prix, performances et disponibilité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {premiumTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                          <Crown className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {template.name}
                            <Badge
                              variant="outline"
                              className="bg-yellow-500/10 text-yellow-700 border-yellow-200"
                            >
                              Premium
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {template.sales} ventes • {template.revenue.toFixed(2)}$ de
                            revenu • ⭐ {template.rating}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ${template.price}
                          </div>
                          <div className="text-xs text-muted-foreground">Prix</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

