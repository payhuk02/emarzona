import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Users, Tag, GraduationCap } from '@/components/icons';
import { Link } from 'react-router-dom';

const ACTIONS = [
  {
    title: 'Ajouter un produit',
    description: 'Créer un nouveau produit',
    icon: Package,
    to: '/dashboard/products',
    variant: 'default' as const,
  },
  {
    title: 'Créer un cours',
    description: 'Créer un cours en ligne',
    icon: GraduationCap,
    to: '/dashboard/courses/new',
    variant: 'default' as const,
  },
  {
    title: 'Nouvelle commande',
    description: 'Enregistrer une commande',
    icon: ShoppingCart,
    to: '/dashboard/orders',
    variant: 'secondary' as const,
  },
  {
    title: 'Ajouter un client',
    description: 'Enregistrer un nouveau client',
    icon: Users,
    to: '/dashboard/customers',
    variant: 'outline' as const,
  },
  {
    title: 'Créer une promotion',
    description: 'Nouvelle offre promotionnelle',
    icon: Tag,
    to: '/dashboard/promotions',
    variant: 'outline' as const,
  },
] as const;

export const QuickActions = () => {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
        <CardDescription>Accédez rapidement aux fonctions principales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTIONS.map(action => (
            <Button
              key={action.title}
              asChild
              variant={action.variant}
              className="h-auto flex-col items-start p-4 gap-2 hover-scale"
            >
              <Link to={action.to}>
                <div className="flex items-center gap-2 w-full">
                  <action.icon className="h-5 w-5" />
                  <span className="font-semibold">{action.title}</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal">
                  {action.description}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
