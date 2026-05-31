import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Copy, Search } from 'lucide-react';
import {
  fetchAdminBroadcasts,
  type AdminBroadcastRecord,
} from '@/lib/admin/admin-broadcast-service';
import {
  STATUS_LABELS,
  broadcastToForm,
} from '@/components/admin/notifications/broadcast-constants';

interface BroadcastHistoryPanelProps {
  onDuplicate?: (form: ReturnType<typeof broadcastToForm>) => void;
}

export function BroadcastHistoryPanel({ onDuplicate }: BroadcastHistoryPanelProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<AdminBroadcastRecord | null>(null);

  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ['admin-broadcasts'],
    queryFn: () => fetchAdminBroadcasts(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return broadcasts.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        item.audience_type.toLowerCase().includes(q)
      );
    });
  }, [broadcasts, search, statusFilter]);

  const statusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      partial: 'secondary',
      failed: 'destructive',
      processing: 'outline',
      pending: 'outline',
      scheduled: 'outline',
      cancelled: 'secondary',
    };
    return (
      <Badge variant={variants[status] ?? 'secondary'}>{STATUS_LABELS[status] ?? status}</Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Historique des envois</CardTitle>
          <CardDescription>
            Consultez, filtrez et réutilisez vos messages précédents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre ou contenu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 min-h-[44px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Aucun message trouvé</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(item => {
                const stats = item.stats as Record<string, number>;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        {statusBadge(item.status)}
                        {item.channels.map(ch => (
                          <Badge key={ch} variant="outline">
                            {ch}
                          </Badge>
                        ))}
                        {item.priority && item.priority !== 'normal' && (
                          <Badge variant="secondary">{item.priority}</Badge>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-[36px]"
                          onClick={() => setSelected(item)}
                        >
                          Détails
                        </Button>
                        {onDuplicate && item.status !== 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[36px] gap-1"
                            onClick={() => onDuplicate(broadcastToForm(item))}
                          >
                            <Copy className="h-3 w-3" />
                            Réutiliser
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.message}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Audience : {item.audience_type}</span>
                      {typeof stats?.sent === 'number' && <span>Envoyés : {stats.sent}</span>}
                      {typeof stats?.failed === 'number' && stats.failed > 0 && (
                        <span className="text-destructive">Échecs : {stats.failed}</span>
                      )}
                      {item.scheduled_at && (
                        <span>
                          Programmé : {new Date(item.scheduled_at).toLocaleString('fr-FR')}
                        </span>
                      )}
                      <span>{new Date(item.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                    {item.error_message && (
                      <p className="text-xs text-destructive line-clamp-2">{item.error_message}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {new Date(selected.created_at).toLocaleString('fr-FR')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  {statusBadge(selected.status)}
                  {selected.channels.map(ch => (
                    <Badge key={ch} variant="outline">
                      {ch}
                    </Badge>
                  ))}
                </div>
                <p className="whitespace-pre-wrap">{selected.message}</p>
                <dl className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <dt>Audience</dt>
                  <dd>{selected.audience_type}</dd>
                  <dt>Priorité</dt>
                  <dd>{selected.priority}</dd>
                  {selected.action_url && (
                    <>
                      <dt>Lien</dt>
                      <dd className="truncate">{selected.action_url}</dd>
                    </>
                  )}
                  {selected.scheduled_at && (
                    <>
                      <dt>Programmé</dt>
                      <dd>{new Date(selected.scheduled_at).toLocaleString('fr-FR')}</dd>
                    </>
                  )}
                </dl>
                {selected.error_message && (
                  <p className="text-destructive text-xs">{selected.error_message}</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
