/**
 * License Table Component
 * Date: 27 octobre 2025
 * 
 * Table de gestion des licenses avec actions massives
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Ban, RefreshCw, Trash2, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LicenseTableProps {
  searchQuery: string;
  statusFilter: string;
}

export const LicenseTable = ({ searchQuery, statusFilter }: LicenseTableProps) => {
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);

  // Mock data - À remplacer par les vrais hooks
  const licenses: any[] = [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirée</Badge>;
      case 'suspended':
        return <Badge variant="secondary">Suspendue</Badge>;
      case 'revoked':
        return <Badge variant="outline">Révoquée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (licenses.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucune license</h3>
          <p className="text-muted-foreground">
            Générez votre première license pour commencer
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        {selectedLicenses.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedLicenses.length} sélectionnée(s)
            </span>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Renouveler
            </Button>
            <Button variant="outline" size="sm">
              <Ban className="h-4 w-4 mr-2" />
              Suspendre
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox />
                </TableHead>
                <TableHead>Clé de License</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Activations</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLicenses.includes(license.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLicenses([...selectedLicenses, license.id]);
                        } else {
                          setSelectedLicenses(
                            selectedLicenses.filter((id) => id !== license.id)
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {license.license_key}
                  </TableCell>
                  <TableCell>{license.product_name}</TableCell>
                  <TableCell>{license.user_email}</TableCell>
                  <TableCell>{getStatusBadge(license.status)}</TableCell>
                  <TableCell>
                    {license.current_activations}/{license.max_activations}
                  </TableCell>
                  <TableCell>
                    {license.expires_at
                      ? format(new Date(license.expires_at), 'dd MMM yyyy', { locale: fr })
                      : 'Jamais'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Renouveler
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Ban className="h-4 w-4 mr-2" />
                          Suspendre
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Révoquer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
};

