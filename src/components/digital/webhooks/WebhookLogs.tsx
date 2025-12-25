/**
 * WebhookLogs - Historique des webhooks envoyés
 * Date: 2025-01-27
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useWebhookLogs } from '@/hooks/digital/useWebhooks';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WebhookLogsProps {
  webhookId: string;
}

export const WebhookLogs = ({ webhookId }: WebhookLogsProps) => {
  const { data: logs, isLoading, error, refetch } = useWebhookLogs(webhookId, 100);
  const [viewingPayload, setViewingPayload] = useState<Record<string, any> | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des logs. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun log</h3>
        <p className="text-muted-foreground">
          Les logs des webhooks envoyés apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Historique ({logs.length})</h3>
          <p className="text-sm text-muted-foreground">
            Derniers webhooks envoyés
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Événement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Tentatives</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.sent_at), 'dd/MM/yyyy HH:mm:ss', {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.event_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.success ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {log.response_status} OK
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          {log.response_status || 'Erreur'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.attempts} tentative{log.attempts > 1 ? 's' : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.duration_ms ? (
                        <div className="text-sm">{log.duration_ms}ms</div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingPayload(log.payload)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Détails du webhook</DialogTitle>
                            <DialogDescription>
                              Payload et réponse du webhook
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Payload</h4>
                              <ScrollArea className="h-64 w-full border rounded p-4">
                                <pre className="text-xs">
                                  {JSON.stringify(log.payload, null, 2)}
                                </pre>
                              </ScrollArea>
                            </div>
                            {log.response_body && (
                              <div>
                                <h4 className="font-semibold mb-2">Réponse</h4>
                                <ScrollArea className="h-32 w-full border rounded p-4">
                                  <pre className="text-xs">{log.response_body}</pre>
                                </ScrollArea>
                              </div>
                            )}
                            {log.error_message && (
                              <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Erreur:</strong> {log.error_message}
                                  {log.error_code && (
                                    <span className="block text-xs mt-1">
                                      Code: {log.error_code}
                                    </span>
                                  )}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

