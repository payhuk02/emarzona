import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  customers: { name: string } | null;
}

interface RecentOrdersCardProps {
  orders: Order[];
}

export const RecentOrdersCard = ({ orders }: RecentOrdersCardProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "secondary" as const },
      confirmed: { label: "Confirmée", variant: "default" as const },
      processing: { label: "En cours", variant: "default" as const },
      shipped: { label: "Expédiée", variant: "default" as const },
      delivered: { label: "Livrée", variant: "default" as const },
      cancelled: { label: "Annulée", variant: "destructive" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (orders.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
          <CardDescription>Vos dernières commandes apparaîtront ici</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune commande pour le moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Commandes récentes</CardTitle>
            <CardDescription>Les 5 dernières commandes</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/dashboard/orders")}
            className="gap-1"
          >
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-smooth cursor-pointer"
              onClick={() => navigate("/dashboard/orders")}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{order.order_number}</p>
                  {getStatusBadge(order.status)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.customers?.name || "Client inconnu"} •{" "}
                  {format(new Date(order.created_at), "dd MMM yyyy", { locale: fr })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{order.total_amount.toLocaleString()} FCFA</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
