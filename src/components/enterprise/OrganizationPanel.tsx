/**
 * Epic 6.5 — Panneau organisations multi-boutiques Enterprise
 */
import { useState } from 'react';
import { Building2, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useStoreOrganizations,
  createStoreOrganization,
} from '@/hooks/organization/useStoreOrganizations';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

type OrganizationPanelProps = {
  storeId?: string;
};

export function OrganizationPanel({ storeId }: OrganizationPanelProps) {
  const { data, isLoading } = useStoreOrganizations();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCreate = async () => {
    if (name.trim().length < 2) return;
    setCreating(true);
    try {
      await createStoreOrganization(name.trim(), storeId);
      setName('');
      await queryClient.invalidateQueries({ queryKey: ['store-organizations'] });
      toast({ title: 'Organisation créée' });
    } catch (err) {
      toast({
        title: 'Plan Enterprise requis',
        description:
          err instanceof Error ? err.message : 'Disponible avec le plan Physique Enterprise',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <Skeleton className="h-36 w-full rounded-xl" />;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">Organisation multi-boutiques</CardTitle>
        </div>
        <CardDescription>
          Regroupez plusieurs boutiques sous une entité Enterprise (SSO, audit, API centralisés)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune organisation — créez-en une pour lier vos boutiques.
          </p>
        ) : (
          <ul className="space-y-2">
            {data?.map(org => (
              <li
                key={org.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {org.store_count} boutique{org.store_count > 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant="secondary">Enterprise</Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Nom de l’organisation"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Button onClick={handleCreate} disabled={creating || name.trim().length < 2}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="ml-2">Créer</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
