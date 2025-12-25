/**
 * WebhookLogs - Affichage des logs d'un webhook produits physiques
 * Date: 2025-01-27
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWebhookLogs } from '@/hooks/physical/usePhysicalWebhooks';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WebhookLogsProps {
  webhookId: string;
}

export const WebhookLogs = ({ webhookId }: WebhookLogsProps) => {
  const { data: logs, isLoading, error } = useWebhookLogs(webhookId);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement des logs. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-500 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Succès
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Échec
          </Badge>
        );
      case 'retrying':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Nouvelle tentative
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {!logs || logs.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun log</h3>
          <p className="text-muted-foreground">
            Aucun webhook n'a encore été déclenché
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Événement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Code HTTP</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Tentative</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <span className="text-sm">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.event_type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>
                    {log.response_status_code ? (
                      <span className="text-sm font-mono">
                        {log.response_status_code}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.duration_ms ? (
                      <span className="text-sm">{log.duration_ms}ms</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {log.attempt_count}/{log.max_attempts}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      {/* Log Details Dialog */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du log</DialogTitle>
              <DialogDescription>
                Informations complètes sur l'envoi du webhook
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Payload</Label>
                <ScrollArea className="h-64 rounded-md border p-4 mt-2">
                  <pre className="text-xs">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
              {selectedLog.response_body && (
                <div>
                  <Label className="text-sm font-semibold">Réponse</Label>
                  <ScrollArea className="h-32 rounded-md border p-4 mt-2">
                    <pre className="text-xs">{selectedLog.response_body}</pre>
                  </ScrollArea>
                </div>
              )}
              {selectedLog.error_message && (
                <div>
                  <Label className="text-sm font-semibold text-destructive">Erreur</Label>
                  <div className="rounded-md border border-destructive bg-destructive/10 p-4 mt-2">
                    <p className="text-sm text-destructive">{selectedLog.error_message}</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
