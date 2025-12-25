/**
 * Gestionnaire de réparations
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRepairs } from '@/hooks/physical/useSerialTracking';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Wrench, Eye, Clock, CheckCircle2, DollarSign, Package } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface RepairsManagerProps {
  storeId: string;
}

export function RepairsManager({ storeId }: RepairsManagerProps) {
  const { data: repairs, isLoading } = useRepairs();

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const repairsRef = useScrollAnimation<HTMLDivElement>();

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      received: { label: 'Reçu', variant: 'secondary' },
      diagnosed: { label: 'Diagnostiqué', variant: 'default', className: 'bg-blue-500' },
      in_progress: { label: 'En Cours', variant: 'default', className: 'bg-yellow-500' },
      waiting_parts: { label: 'En Attente Pièces', variant: 'default', className: 'bg-orange-500' },
      completed: { label: 'Terminée', variant: 'default', className: 'bg-green-500' },
      returned: { label: 'Retourné', variant: 'default', className: 'bg-purple-500' },
      cancelled: { label: 'Annulée', variant: 'secondary' },
    };

    const badge = badges[status] || { label: status, variant: 'secondary' };
    return (
      <Badge variant={badge.variant} className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  // Stats calculées
  const stats = useMemo(() => {
    if (!repairs) return { total: 0, inProgress: 0, completed: 0, totalCost: 0 };
    const total = repairs.length;
    const inProgress = repairs.filter(r => ['received', 'diagnosed', 'in_progress', 'waiting_parts'].includes(r.status)).length;
    const completed = repairs.filter(r => ['completed', 'returned'].includes(r.status)).length;
    const totalCost = repairs.reduce((sum, r) => sum + r.total_cost, 0);
    return { total, inProgress, completed, totalCost };
  }, [repairs]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards - Responsive */}
      {repairs && repairs.length > 0 && (
        <div 
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          {[
            { label: 'Total Réparations', value: stats.total, icon: Wrench, color: 'from-purple-600 to-pink-600' },
            { label: 'En Cours', value: stats.inProgress, icon: Clock, color: 'from-yellow-600 to-orange-600' },
            { label: 'Terminées', value: stats.completed, icon: CheckCircle2, color: 'from-green-600 to-emerald-600' },
            { label: 'Coût Total', value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.totalCost), icon: DollarSign, color: 'from-blue-600 to-cyan-600', isCurrency: true },
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
                  {stat.isCurrency ? (
                    <div className={`text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                  ) : (
                    <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Repairs List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
            Réparations
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {repairs?.length || 0} réparation{(repairs?.length || 0) > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!repairs || repairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center py-8 sm:py-12">
              <Wrench className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground">Aucune réparation</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3 sm:space-y-4">
                {repairs.map((repair, index) => (
                  <RepairCard
                    key={repair.id}
                    repair={repair}
                    getStatusBadge={getStatusBadge}
                    animationDelay={index * 50}
                  />
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Numéro Réparation</TableHead>
                      <TableHead className="min-w-[120px]">Date Réception</TableHead>
                      <TableHead className="min-w-[120px]">Type</TableHead>
                      <TableHead className="min-w-[200px]">Problème</TableHead>
                      <TableHead className="min-w-[130px]">Statut</TableHead>
                      <TableHead className="min-w-[120px]">Coût Total</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repairs.map((repair) => (
                      <TableRow key={repair.id}>
                        <TableCell className="font-medium font-mono">{repair.repair_number}</TableCell>
                        <TableCell>
                          <span className="text-sm truncate block">
                            {format(new Date(repair.received_date), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm truncate block">
                            {repair.repair_type === 'warranty' ? 'Garantie' : 
                             repair.repair_type === 'out_of_warranty' ? 'Hors Garantie' : 
                             'Payé par Client'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm truncate block max-w-xs">{repair.issue_description}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(repair.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm truncate block">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                              minimumFractionDigits: 0,
                            }).format(repair.total_cost)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Voir les détails de la réparation ${repair.id || ''}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Repair Card Component for Mobile View
interface RepairCardProps {
  repair: Repair;
  getStatusBadge: (status: string) => JSX.Element;
  animationDelay?: number;
}

function RepairCard({ repair, getStatusBadge, animationDelay = 0 }: RepairCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1 font-mono">
                {repair.repair_number}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {format(new Date(repair.received_date), 'dd MMM yyyy', { locale: fr })}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(repair.status)}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>
              {repair.repair_type === 'warranty' ? 'Garantie' : 
               repair.repair_type === 'out_of_warranty' ? 'Hors Garantie' : 
               'Payé par Client'}
            </span>
          </div>
          <p className="text-muted-foreground line-clamp-2">{repair.issue_description}</p>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  minimumFractionDigits: 0,
                }).format(repair.total_cost)}
              </span>
            </div>
            <Button variant="outline" size="sm" className="h-8">
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm">Voir</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
