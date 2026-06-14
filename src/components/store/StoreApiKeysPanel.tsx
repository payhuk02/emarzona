/**
 * Epic 4.6 — Panneau clés API REST vendeur
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyRound, Plus, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import {
  hasPhysicalFeatureAccess,
  type PhysicalPlanSlug,
} from '@/lib/billing/physical-plan-capabilities';
import {
  useStoreApiKeys,
  useCreateStoreApiKey,
  useRevokeStoreApiKey,
  getApiBaseUrl,
} from '@/hooks/store/useStoreApiKeys';
import { useToast } from '@/hooks/use-toast';

interface Props {
  storeId: string;
}

export function StoreApiKeysPanel({ storeId }: Props) {
  const { planSlug } = useStorePhysicalAccess(storeId);
  const apiAllowed = hasPhysicalFeatureAccess(planSlug as PhysicalPlanSlug, 'api.public');
  const { data: keys = [], isLoading } = useStoreApiKeys(storeId);
  const createKey = useCreateStoreApiKey();
  const revokeKey = useRevokeStoreApiKey();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);

  const apiBase = getApiBaseUrl();

  const handleCreate = async () => {
    if (!name.trim()) return;
    const result = await createKey.mutateAsync({ storeId, name: name.trim() });
    setNewKeySecret(result.key);
    setName('');
    setDialogOpen(false);
  };

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copié dans le presse-papiers' });
  };

  if (!apiAllowed) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5" />
            API REST vendeur
          </CardTitle>
          <CardDescription>
            Disponible à partir du plan <strong>Physique Professionnel</strong>. Connectez votre
            ERP, CRM ou outils internes via l&apos;API REST Emarzona.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Upgrade requis</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Clés API REST
            </CardTitle>
            <CardDescription className="mt-1">
              Authentification Bearer — endpoint{' '}
              <code className="text-xs bg-muted px-1 rounded">{apiBase || '/api/v1'}</code>
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nouvelle clé
          </Button>
        </CardHeader>
        <CardContent>
          {apiBase && (
            <Button variant="outline" size="sm" className="mb-4" asChild>
              <a href={apiBase} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation endpoint
              </a>
            </Button>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Chargement…</div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Aucune clé API. Créez-en une pour connecter vos systèmes externes.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Préfixe</TableHead>
                    <TableHead>Dernière utilisation</TableHead>
                    <TableHead>Actif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map(row => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {row.key_prefix}…
                        </code>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.last_used_at
                          ? format(new Date(row.last_used_at), 'dd MMM yyyy HH:mm', { locale: fr })
                          : 'Jamais'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(row.is_active)}
                          onCheckedChange={v => {
                            if (!v) revokeKey.mutate({ id: row.id, storeId });
                          }}
                          disabled={!row.is_active}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {newKeySecret && (
        <Alert>
          <AlertDescription className="space-y-2">
            <p className="font-medium">
              Clé créée — copiez-la maintenant, elle ne sera plus affichée.
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted p-2 rounded flex-1 break-all">{newKeySecret}</code>
              <Button size="sm" variant="outline" onClick={() => copyKey(newKeySecret)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setNewKeySecret(null)}>
              J&apos;ai sauvegardé la clé
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une clé API</DialogTitle>
            <DialogDescription>
              Permissions par défaut : lecture produits, commandes, clients et analytics.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="api-key-name">Nom de la clé</Label>
            <Input
              id="api-key-name"
              placeholder="ERP production"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={createKey.isPending || !name.trim()}>
              {createKey.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
