import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Shield, 
  Download, 
  TrendingUp, 
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Link2,
  Copy,
  Ban,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  useDownloadAnalytics,
  useProductDownloadTokens,
  useRevokeDownloadToken,
} from '@/hooks/digital/useSecureDownload';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES
// ============================================================================

interface DownloadProtectionDashboardProps {
  productId: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DownloadProtectionDashboard({ productId }: DownloadProtectionDashboardProps) {
  const { data: analytics, isLoading: analyticsLoading } = useDownloadAnalytics(productId);
  const { data: tokens, isLoading: tokensLoading } = useProductDownloadTokens(productId);
  const { mutate: revokeToken } = useRevokeDownloadToken();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '📋 Copié !',
      description: 'Le lien a été copié dans le presse-papier.',
    });
  };

  if (analyticsLoading || tokensLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Téléchargements</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalDownloads || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.recentDownloads || 0} ces 7 derniers jours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics?.completionRate.toFixed(1) || 0}%
            </div>
            <Progress value={analytics?.completionRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bande passante</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics?.totalBytesGB.toFixed(2) || 0} GB
            </div>
            <p className="text-xs text-muted-foreground">
              Données transférées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Actifs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tokens?.filter(t => !t.is_revoked && new Date(t.expires_at) > new Date()).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Sur {tokens?.length || 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Download Tokens Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tokens de Téléchargement Sécurisés</CardTitle>
          <CardDescription>
            Gérez les liens de téléchargement temporaires et sécurisés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tokens || tokens.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun token généré</p>
              <p className="text-sm">Les tokens seront créés automatiquement lors des téléchargements</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Téléchargements</TableHead>
                  <TableHead>Expire</TableHead>
                  <TableHead>Créé</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.slice(0, 20).map((token) => {
                  const isExpired = new Date(token.expires_at) < new Date();
                  const isActive = !token.is_revoked && !isExpired;

                  return (
                    <TableRow key={token.id}>
                      <TableCell>
                        <div className="font-mono text-xs bg-muted px-2 py-1 rounded max-w-[120px] truncate">
                          {token.token.substring(0, 16)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        {token.is_revoked ? (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="h-3 w-3" />
                            Révoqué
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Expiré
                          </Badge>
                        ) : (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Actif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{token.current_downloads}</span>
                          <span className="text-muted-foreground">/ {token.max_downloads}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(token.expires_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(token.created_at), 'PPp', { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(token.token)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {isActive && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (confirm('Révoquer ce token ?')) {
                                  revokeToken(token.id);
                                }
                              }}
                            >
                              <Ban className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Download Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
          <CardDescription>
            Les 10 derniers téléchargements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analytics?.logs || analytics.logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune activité récente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {analytics.logs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    {log.download_completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <div className="text-sm font-medium">
                        {log.download_completed ? 'Téléchargement réussi' : 'Téléchargement échoué'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.ip_address && `IP: ${log.ip_address}`}
                        {log.bytes_downloaded && ` • ${(log.bytes_downloaded / (1024 * 1024)).toFixed(2)} MB`}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

