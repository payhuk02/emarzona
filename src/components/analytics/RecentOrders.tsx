import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@/hooks/useOrders";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ShoppingCart } from "lucide-react";

interface RecentOrdersProps {
  orders: Order[];
  loading: boolean;
}

export const RecentOrders = ({ orders, loading }: RecentOrdersProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
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
    <Card>
      <CardHeader>
        <CardTitle>Commandes récentes</CardTitle>
        <CardDescription>Les 5 dernières commandes</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>
                      {order.customers?.name || "Client non spécifié"}
                    </TableCell>
                    <TableCell>
                      {order.total_amount.toLocaleString()} {order.currency}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-2" />
            <p>Aucune commande récente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
