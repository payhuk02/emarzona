/**
 * Composant pour les alertes d'expiration
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Calendar, CheckCircle2, Package, Clock, TrendingDown } from '@/components/icons';
import { useExpirationAlerts, useResolveExpirationAlert } from '@/hooks/physical/useLotsExpiration';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

export function ExpirationAlerts() {
  const [resolvingAlert, setResolvingAlert] = useState<string | null>(null);
  const [resolutionAction, setResolutionAction] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: alerts, isLoading } = useExpirationAlerts({ resolved: false });
  const resolveAlert = useResolveExpirationAlert();

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const alertsRef = useScrollAnimation<HTMLDivElement>();

  const handleResolve = async (alertId: string) => {
    if (!resolutionAction) {
      alert('Veuillez sélectionner une action de résolution');
      return;
    }

    try {
      await resolveAlert.mutateAsync({
        alertId,
        resolutionAction: resolutionAction as any,
        resolutionNotes: resolutionNotes || undefined,
      });
      setResolvingAlert(null);
      setResolutionAction('');
      setResolutionNotes('');
    } catch (error) {
      logger.error('Error resolving alert', { error, alertId: resolvingAlert?.id });
    }
  };

  const getAlertTypeBadge = (type: string) => {
    switch (type) {
      case 'expiring_today':
        return <Badge variant="destructive">Expire aujourd'hui</Badge>;
      case 'expiring_soon':
        return <Badge variant="default" className="bg-orange-500">Expire bientôt</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expiré</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // Stats calculées
  const stats = useMemo(() => {
    if (!alerts) return { total: 0, expired: 0, expiringToday: 0, expiringSoon: 0 };
    const unresolved = alerts.filter((alert) => !alert.is_resolved);
    const total = unresolved.length;
    const expired = unresolved.filter(a => a.alert_type === 'expired').length;
    const expiringToday = unresolved.filter(a => a.alert_type === 'expiring_today').length;
    const expiringSoon = unresolved.filter(a => a.alert_type === 'expiring_soon').length;
    return { total, expired, expiringToday, expiringSoon };
  }, [alerts]);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full">
        <Skeleton className="h-10 sm:h-12 w-full" />
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 sm:h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 sm:h-80 w-full" />
      </div>
    );
  }

  const unresolvedAlerts = alerts?.filter((alert) => !alert.is_resolved) || [];

  if (unresolvedAlerts.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            Alertes d'Expiration
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Aucune alerte d'expiration en cours
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 sm:py-12 text-center">
          <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-green-500 mb-4 animate-in zoom-in-95 duration-500" />
          <p className="text-sm sm:text-base text-muted-foreground">
            Tous vos lots sont à jour
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards - Responsive */}
      <div 
        ref={statsRef}
        className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {[
          { label: 'Total Alertes', value: stats.total, icon: AlertTriangle, color: 'from-red-600 to-orange-600' },
          { label: 'Expirés', value: stats.expired, icon: Package, color: 'from-red-600 to-pink-600' },
          { label: 'Expirent Aujourd\'hui', value: stats.expiringToday, icon: Clock, color: 'from-orange-600 to-red-600' },
          { label: 'Expirent Bientôt', value: stats.expiringSoon, icon: TrendingDown, color: 'from-yellow-600 to-orange-600' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            Alertes d'Expiration ({unresolvedAlerts.length})
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Produits expirés ou expirant bientôt nécessitant une action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <>
            {/* Mobile View - Cards */}
            <div className="block md:hidden space-y-3 sm:space-y-4">
              {unresolvedAlerts.map((alert, index) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  getAlertTypeBadge={getAlertTypeBadge}
                  onResolve={() => setResolvingAlert(alert.id)}
                  animationDelay={index * 50}
                />
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Lot</TableHead>
                    <TableHead className="min-w-[150px]">Produit</TableHead>
                    <TableHead className="min-w-[150px]">Date Expiration</TableHead>
                    <TableHead className="min-w-[120px]">Jours Restants</TableHead>
                    <TableHead className="min-w-[130px]">Type</TableHead>
                    <TableHead className="min-w-[100px]">Quantité</TableHead>
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unresolvedAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.lot.lot_number}</TableCell>
                      <TableCell>
                        <span className="truncate block">
                          Produit #{alert.lot.physical_product_id.slice(0, 8)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {alert.lot.expiration_date ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {format(new Date(alert.lot.expiration_date), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {alert.days_until_expiration !== undefined ? (
                          <span className={cn(
                            "text-sm",
                            alert.days_until_expiration <= 0 && 'text-red-500 font-bold',
                            alert.days_until_expiration > 0 && alert.days_until_expiration <= 7 && 'text-orange-500'
                          )}>
                            {alert.days_until_expiration} jours
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{getAlertTypeBadge(alert.alert_type)}</TableCell>
                      <TableCell>{alert.lot.current_quantity}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={resolvingAlert === alert.id} onOpenChange={(open) => {
                          if (!open) {
                            setResolvingAlert(null);
                            setResolutionAction('');
                            setResolutionNotes('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setResolvingAlert(alert.id)} className="h-8">
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="text-xs sm:text-sm">Résoudre</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Résoudre l'Alerte</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Action de Résolution</Label>
                                <Select value={resolutionAction} onValueChange={setResolutionAction}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une action" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sold">Vendu</SelectItem>
                                    <SelectItem value="discounted">Soldé</SelectItem>
                                    <SelectItem value="returned">Retourné au fournisseur</SelectItem>
                                    <SelectItem value="destroyed">Détruit</SelectItem>
                                    <SelectItem value="transferred">Transféré</SelectItem>
                                    <SelectItem value="other">Autre</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Notes</Label>
                                <Textarea
                                  placeholder="Notes sur la résolution..."
                                  value={resolutionNotes}
                                  onChange={(e) => setResolutionNotes(e.target.value)}
                                  rows={4}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setResolvingAlert(null);
                                    setResolutionAction('');
                                    setResolutionNotes('');
                                  }}
                                >
                                  Annuler
                                </Button>
                                <Button onClick={() => handleResolve(alert.id)}>
                                  Confirmer
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        </CardContent>
      </Card>
    </div>
  );
}

// Alert Card Component for Mobile View
interface AlertCardProps {
  alert: any;
  getAlertTypeBadge: (type: string) => JSX.Element;
  onResolve: () => void;
  animationDelay?: number;
}

function AlertCard({ alert, getAlertTypeBadge, onResolve, animationDelay = 0 }: AlertCardProps) {
  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation",
        alert.alert_type === 'expired' && "border-l-4 border-l-red-500",
        alert.alert_type === 'expiring_today' && "border-l-4 border-l-orange-500",
        alert.alert_type === 'expiring_soon' && "border-l-4 border-l-yellow-500"
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1">
                Lot: {alert.lot.lot_number}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Produit #{alert.lot.physical_product_id.slice(0, 8)}
              </CardDescription>
            </div>
          </div>
          {getAlertTypeBadge(alert.alert_type)}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          {alert.lot.expiration_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Expire: {format(new Date(alert.lot.expiration_date), 'dd MMM yyyy', { locale: fr })}</span>
            </div>
          )}
          {alert.days_until_expiration !== undefined && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className={cn(
                alert.days_until_expiration <= 0 && 'text-red-500 font-bold',
                alert.days_until_expiration > 0 && alert.days_until_expiration <= 7 && 'text-orange-500'
              )}>
                {alert.days_until_expiration} jours restants
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>Quantité: {alert.lot.current_quantity}</span>
          </div>
        </div>
        <Button
          onClick={onResolve}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="text-xs sm:text-sm">Résoudre</span>
        </Button>
      </CardContent>
    </Card>
  );
}






