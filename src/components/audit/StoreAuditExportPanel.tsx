/**
 * Epic 4.4 — Export audit logs SOC2 (boutique Enterprise)
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, Download, Loader2 } from 'lucide-react';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import {
  hasPhysicalFeatureAccess,
  type PhysicalPlanSlug,
} from '@/lib/billing/physical-plan-capabilities';
import {
  useUnifiedAuditLogs,
  useExportAuditLogs,
  downloadAuditExport,
} from '@/hooks/audit/useAuditLogs';
import { useToast } from '@/hooks/use-toast';

interface Props {
  storeId: string;
}

export function StoreAuditExportPanel({ storeId }: Props) {
  const { planSlug } = useStorePhysicalAccess(storeId);
  const auditAllowed = hasPhysicalFeatureAccess(planSlug as PhysicalPlanSlug, 'audit.export');
  const { toast } = useToast();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [logSource, setLogSource] = useState('');

  const filters = useMemo(
    () => ({
      storeId,
      from: fromDate ? new Date(fromDate).toISOString() : null,
      to: toDate ? new Date(`${toDate}T23:59:59`).toISOString() : null,
      logSource: logSource || null,
      limit: 200,
      offset: 0,
    }),
    [storeId, fromDate, toDate, logSource]
  );

  const { data: rows = [], isLoading, error } = useUnifiedAuditLogs(filters, auditAllowed);
  const exportMutation = useExportAuditLogs();

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const result = await exportMutation.mutateAsync({ ...filters, format, maxRows: 10000 });
      const exportRows = (result.rows as typeof rows) ?? rows;
      downloadAuditExport(exportRows, format, `store_audit_${storeId.slice(0, 8)}`);
      toast({
        title: 'Export terminé',
        description: `${result.row_count} événements exportés (${format.toUpperCase()})`,
      });
    } catch (e) {
      toast({
        title: 'Erreur export',
        description: e instanceof Error ? e.message : 'Échec',
        variant: 'destructive',
      });
    }
  };

  if (!auditAllowed) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Audit logs SOC2
          </CardTitle>
          <CardDescription>
            Export compliance disponible sur le plan <strong>Physique Enterprise</strong>.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Journal d&apos;audit boutique
        </CardTitle>
        <CardDescription>
          Événements équipe, SSO et API — exportable CSV/JSON pour audits SOC2.
        </CardDescription>
        <div className="flex flex-wrap gap-2 mt-4">
          <Input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="w-auto"
          />
          <Input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="w-auto"
          />
          <select
            className="border rounded px-2 py-2 text-sm"
            value={logSource}
            onChange={e => setLogSource(e.target.value)}
          >
            <option value="">Toutes sources</option>
            <option value="store_event">Boutique</option>
            <option value="sso_login">SSO</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            disabled={exportMutation.isPending}
          >
            JSON
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-destructive mb-4">
            {error instanceof Error ? error.message : 'Erreur de chargement'}
          </p>
        )}
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Chargement…</div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun événement sur la période.</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Acteur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {r.log_source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.action}</TableCell>
                    <TableCell className="text-xs">{r.actor_email || r.actor_id || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
