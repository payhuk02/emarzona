import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, DollarSign, ShoppingCart, Percent } from "lucide-react";
import { usePlatformCommissions } from "@/hooks/usePlatformCommissions";
import { useAdmin } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PlatformRevenue = () => {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const { commissions, stats, loading, exportToCSV } = usePlatformCommissions(
    startDate,
    endDate
  );

  if (adminLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6 md:p-8">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!isAdmin) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6 md:p-8">
            <Alert variant="destructive">
              <AlertDescription>
                Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Revenus de la Plateforme</h1>
                <p className="text-muted-foreground mt-1">
                  Suivi des commissions (10% par vente)
                </p>
              </div>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exporter CSV
              </Button>
            </div>

            {/* Filtres de date */}
            <Card>
              <CardHeader>
                <CardTitle>Filtrer par période</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Date de début</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Date de fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Commissions
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      `${stats.totalCommissions.toLocaleString("fr-FR")} XOF`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revenus de la plateforme
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Ventes
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      `${stats.totalSales.toLocaleString("fr-FR")} XOF`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Volume total généré
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Nombre de Ventes
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-20" /> : stats.salesCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transactions complétées
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Commission Moyenne
                  </CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      `${stats.averageCommission.toLocaleString("fr-FR")} XOF`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Par transaction
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tableau des commissions */}
            <Card>
              <CardHeader>
                <CardTitle>Historique des Commissions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : commissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Aucune commission enregistrée pour cette période
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Boutique</TableHead>
                          <TableHead className="text-right">Montant Total</TableHead>
                          <TableHead className="text-right">Commission (10%)</TableHead>
                          <TableHead className="text-right">Reversement Vendeur</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell>
                              {format(new Date(commission.created_at), "dd MMM yyyy", {
                                locale: fr,
                              })}
                            </TableCell>
                            <TableCell>{commission.stores?.name || "N/A"}</TableCell>
                            <TableCell className="text-right">
                              {commission.total_amount.toLocaleString("fr-FR")} XOF
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              {commission.commission_amount.toLocaleString("fr-FR")} XOF
                            </TableCell>
                            <TableCell className="text-right">
                              {commission.seller_amount.toLocaleString("fr-FR")} XOF
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700">
                                {commission.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default PlatformRevenue;
