import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, ShoppingCart, Users, Tag, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Ajouter un produit",
      description: "Créer un nouveau produit",
      icon: Package,
      onClick: () => navigate("/dashboard/products"),
      variant: "default" as const,
    },
    {
      title: "Créer un cours",
      description: "Créer un cours en ligne",
      icon: GraduationCap,
      onClick: () => navigate("/dashboard/courses/new"),
      variant: "default" as const,
    },
    {
      title: "Nouvelle commande",
      description: "Enregistrer une commande",
      icon: ShoppingCart,
      onClick: () => navigate("/dashboard/orders"),
      variant: "secondary" as const,
    },
    {
      title: "Ajouter un client",
      description: "Enregistrer un nouveau client",
      icon: Users,
      onClick: () => navigate("/dashboard/customers"),
      variant: "outline" as const,
    },
    {
      title: "Créer une promotion",
      description: "Nouvelle offre promotionnelle",
      icon: Tag,
      onClick: () => navigate("/dashboard/promotions"),
      variant: "outline" as const,
    },
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
        <CardDescription>Accédez rapidement aux fonctions principales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant={action.variant}
              className="h-auto flex-col items-start p-4 gap-2 hover-scale"
              onClick={action.onClick}
            >
              <div className="flex items-center gap-2 w-full">
                <action.icon className="h-5 w-5" />
                <span className="font-semibold">{action.title}</span>
              </div>
              <span className="text-xs text-muted-foreground font-normal">
                {action.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
