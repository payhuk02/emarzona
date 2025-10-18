import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminActivity } from '@/hooks/useAdminActivity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { History, User, Store, Package, ShoppingCart, Ban, CheckCircle, Trash2 } from 'lucide-react';

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'SUSPEND_USER':
      return <Ban className="h-4 w-4" />;
    case 'UNSUSPEND_USER':
      return <CheckCircle className="h-4 w-4" />;
    case 'DELETE_USER':
      return <Trash2 className="h-4 w-4" />;
    case 'DELETE_STORE':
      return <Store className="h-4 w-4" />;
    case 'DELETE_PRODUCT':
      return <Package className="h-4 w-4" />;
    case 'ACTIVATE_PRODUCT':
      return <CheckCircle className="h-4 w-4" />;
    case 'DEACTIVATE_PRODUCT':
      return <Ban className="h-4 w-4" />;
    case 'CANCEL_ORDER':
      return <ShoppingCart className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
};

const getActionLabel = (actionType: string) => {
  const labels: Record<string, string> = {
    SUSPEND_USER: 'Suspension utilisateur',
    UNSUSPEND_USER: 'Réactivation utilisateur',
    DELETE_USER: 'Suppression utilisateur',
    DELETE_STORE: 'Suppression boutique',
    DELETE_PRODUCT: 'Suppression produit',
    ACTIVATE_PRODUCT: 'Activation produit',
    DEACTIVATE_PRODUCT: 'Désactivation produit',
    CANCEL_ORDER: 'Annulation commande',
  };
  return labels[actionType] || actionType;
};

const getActionVariant = (actionType: string): "default" | "destructive" | "secondary" => {
  if (actionType.includes('DELETE') || actionType.includes('SUSPEND') || actionType.includes('CANCEL')) {
    return 'destructive';
  }
  if (actionType.includes('ACTIVATE') || actionType.includes('UNSUSPEND')) {
    return 'default';
  }
  return 'secondary';
};

const AdminActivity = () => {
  const { actions, loading } = useAdminActivity();

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Historique des actions
            </h1>
            <p className="text-muted-foreground mt-2">
              Toutes les interventions administrateurs
            </p>
          </div>
          <History className="h-5 w-5 text-muted-foreground" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actions récentes</CardTitle>
            <CardDescription>
              Les 100 dernières actions effectuées par les administrateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 rounded-lg bg-background">
                      {getActionIcon(action.action_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getActionVariant(action.action_type)}>
                          {getActionLabel(action.action_type)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          par {action.admin_name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Type: {action.target_type}
                      </p>
                      {action.details?.reason && (
                        <p className="text-sm mt-1 text-foreground">
                          Raison: {action.details.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                    {new Date(action.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
              {actions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune action enregistrée
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminActivity;
