/**
 * Gestionnaire de réclamations garantie
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWarrantyClaims } from '@/hooks/physical/useSerialTracking';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, Eye, Clock, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface WarrantyClaimsManagerProps {
  storeId: string;
}

export function WarrantyClaimsManager({ storeId }: WarrantyClaimsManagerProps) {
  const { data: claims, isLoading } = useWarrantyClaims();

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const claimsRef = useScrollAnimation<HTMLDivElement>();

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      pending: { label: 'En Attente', variant: 'secondary' },
      under_review: { label: 'En Examen', variant: 'default', className: 'bg-yellow-500' },
      approved: { label: 'Approuvée', variant: 'default', className: 'bg-green-500' },
      rejected: { label: 'Rejetée', variant: 'destructive' },
      repair_in_progress: { label: 'Réparation en Cours', variant: 'default', className: 'bg-blue-500' },
      repaired: { label: 'Réparée', variant: 'default', className: 'bg-green-500' },
      replacement_sent: { label: 'Remplacement Envoyé', variant: 'default', className: 'bg-purple-500' },
      refunded: { label: 'Remboursée', variant: 'default', className: 'bg-indigo-500' },
      resolved: { label: 'Résolue', variant: 'default', className: 'bg-green-500' },
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
    if (!claims) return { total: 0, pending: 0, resolved: 0, totalCost: 0 };
    const total = claims.length;
    const pending = claims.filter(c => ['pending', 'under_review', 'repair_in_progress'].includes(c.status)).length;
    const resolved = claims.filter(c => ['resolved', 'repaired', 'replacement_sent', 'refunded'].includes(c.status)).length;
    const totalCost = claims.reduce((sum, c) => sum + c.total_cost, 0);
    return { total, pending, resolved, totalCost };
  }, [claims]);

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
      {claims && claims.length > 0 && (
        <div 
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          {[
            { label: 'Total Réclamations', value: stats.total, icon: AlertTriangle, color: 'from-purple-600 to-pink-600' },
            { label: 'En Attente', value: stats.pending, icon: Clock, color: 'from-yellow-600 to-orange-600' },
            { label: 'Résolues', value: stats.resolved, icon: CheckCircle2, color: 'from-green-600 to-emerald-600' },
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

      {/* Claims List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            Réclamations Garantie
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {claims?.length || 0} réclamation{(claims?.length || 0) > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!claims || claims.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center py-8 sm:py-12">
              <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground">Aucune réclamation garantie</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3 sm:space-y-4">
                {claims.map((claim, index) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
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
                      <TableHead className="min-w-[150px]">Numéro Réclamation</TableHead>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[200px]">Problème</TableHead>
                      <TableHead className="min-w-[130px]">Statut</TableHead>
                      <TableHead className="min-w-[120px]">Coût</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium font-mono">{claim.claim_number}</TableCell>
                        <TableCell>
                          <span className="text-sm truncate block">
                            {format(new Date(claim.claim_date), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm truncate block max-w-xs">{claim.issue_description}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(claim.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm truncate block">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                              minimumFractionDigits: 0,
                            }).format(claim.total_cost)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Voir les détails de la réclamation ${claim.id || ''}`}>
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

import type { WarrantyClaim } from '@/hooks/physical/useSerialTracking';

// Claim Card Component for Mobile View
interface ClaimCardProps {
  claim: WarrantyClaim;
  getStatusBadge: (status: string) => JSX.Element;
  animationDelay?: number;
}

function ClaimCard({ claim, getStatusBadge, animationDelay = 0 }: ClaimCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1 font-mono">
                {claim.claim_number}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {format(new Date(claim.claim_date), 'dd MMM yyyy', { locale: fr })}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(claim.status)}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          <p className="text-muted-foreground line-clamp-2">{claim.issue_description}</p>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  minimumFractionDigits: 0,
                }).format(claim.total_cost)}
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
