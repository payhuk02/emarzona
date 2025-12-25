import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@/hooks/useOrders";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ShoppingCart } from '@/components/icons';

interface RecentOrdersProps {
  orders: Order[];
  loading: boolean;
}

export const RecentOrders = ({ orders, loading }: RecentOrdersProps) => {
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 sm:h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      completed: "outline",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "En attente",
      processing: "En cours",
      completed: "Terminée",
      cancelled: "Annulée",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Commandes récentes</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Les 5 dernières commandes</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs sm:text-sm font-semibold">N° Commande</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold">Client</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold">Montant</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold">Statut</TableHead>
                      <TableHead className="text-xs sm:text-sm font-semibold">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-xs sm:text-sm font-medium">{order.order_number}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {order.customers?.name || "Client non spécifié"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm font-semibold">
                          {order.total_amount.toLocaleString()} {order.currency}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {format(new Date(order.created_at), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base sm:text-lg mb-1">{order.order_number}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                          {order.customers?.name || "Client non spécifié"}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm sm:text-base font-semibold">
                            {order.total_amount.toLocaleString()} {order.currency}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <div className="ml-2">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground">
            <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
              <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 opacity-20" />
            </div>
            <p className="text-sm sm:text-base">Aucune commande récente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
