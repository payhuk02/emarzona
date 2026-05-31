import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Megaphone, Power, PowerOff } from 'lucide-react';
import { fetchPlatformPopups, updatePlatformPopup } from '@/lib/admin/admin-broadcast-service';

export function PopupsManagementPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: popups = [], isLoading } = useQuery({
    queryKey: ['admin-platform-popups'],
    queryFn: () => fetchPlatformPopups(),
  });

  const handleTogglePopup = async (id: string, isActive: boolean) => {
    const ok = await updatePlatformPopup(id, { is_active: !isActive });
    if (ok) {
      toast({ title: isActive ? 'Popup désactivée' : 'Popup activée' });
      await queryClient.invalidateQueries({ queryKey: ['admin-platform-popups'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-broadcast-stats'] });
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la popup.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popups affichées aux utilisateurs</CardTitle>
        <CardDescription>
          Gérez les messages popup visibles sur les pages utilisateurs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : popups.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Aucune popup créée</p>
        ) : (
          <div className="space-y-4">
            {popups.map(popup => (
              <div
                key={popup.id}
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-lg border"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{popup.title}</h3>
                    <Badge variant={popup.is_active ? 'default' : 'secondary'}>
                      {popup.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{popup.style}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{popup.message}</p>
                  <p className="text-xs text-muted-foreground">
                    Cible : {popup.target_audience}
                    {popup.starts_at && (
                      <> · Début : {new Date(popup.starts_at).toLocaleString('fr-FR')}</>
                    )}
                    {popup.ends_at && (
                      <> · Fin : {new Date(popup.ends_at).toLocaleString('fr-FR')}</>
                    )}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] shrink-0"
                  onClick={() => void handleTogglePopup(popup.id, popup.is_active)}
                >
                  {popup.is_active ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-2" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Activer
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
