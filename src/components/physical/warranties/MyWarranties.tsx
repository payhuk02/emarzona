/**
 * My Warranties Component
 * Date: 27 Janvier 2025
 * 
 * Composant client pour voir et gérer ses garanties enregistrées
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWarrantyRegistrations, useCreateWarrantyClaim } from '@/hooks/physical/useWarranties';
import { useAuth } from '@/hooks/useAuth';
import { Shield, AlertTriangle, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function MyWarranties() {
  const { user } = useAuth();
  const { data: registrations, isLoading } = useWarrantyRegistrations(user?.id);
  const createClaim = useCreateWarrantyClaim();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mes Garanties</h2>
          <p className="text-muted-foreground">
            Gérez vos garanties enregistrées et créez des réclamations
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Garanties enregistrées</CardTitle>
          <CardDescription>
            {registrations?.length || 0} garantie{(registrations?.length || 0) > 1 ? 's' : ''} active{(registrations?.length || 0) > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Garantie</TableHead>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!registrations || registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucune garantie enregistrée
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {(registration.product as any)?.name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {(registration.warranty as any)?.warranty_name || 'N/A'}
                          </div>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {(registration.warranty as any)?.warranty_type || 'N/A'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {registration.registration_number}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(registration.warranty_start_date), 'dd MMM yyyy', { locale: fr })} - {' '}
                          {format(new Date(registration.warranty_end_date), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {registration.is_expired ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Expirée
                          </Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!registration.is_expired && (
                          <Button variant="outline" size="sm">
                            Créer une réclamation
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

