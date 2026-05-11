import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/stable-dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ProductPromotion } from '@/hooks/physical/usePromotions';
import { logger } from '@/lib/logger';

interface PromotionsTableProps {
  promotions: ProductPromotion[];
  onUpdate: () => void;
}

export const PromotionsTable: React.FC<PromotionsTableProps> = ({ promotions, onUpdate }) => {
  const getStatusBadge = (promotion: ProductPromotion) => {
    const now = new Date();
    const startsAt = promotion.starts_at ? new Date(promotion.starts_at) : null;
    const endsAt = promotion.ends_at ? new Date(promotion.ends_at) : null;

    if (!promotion.is_active) {
      return <Badge variant="secondary">Inactif</Badge>;
    }

    if (startsAt && now < startsAt) {
      return <Badge variant="outline">Programmé</Badge>;
    }

    if (endsAt && now > endsAt) {
      return <Badge variant="destructive">Expiré</Badge>;
    }

    return <Badge variant="default">Actif</Badge>;
  };

  const formatDiscount = (promotion: ProductPromotion) => {
    if (promotion.discount_type === 'percentage') {
      return `${promotion.discount_value}%`;
    }
    return `${promotion.discount_value}€`;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return '-';
    }
  };

  const handleEdit = (promotion: ProductPromotion) => {
    // TODO: Implement edit functionality
    logger.info('Edit promotion:', { promotion });
  };

  const handleDelete = (promotion: ProductPromotion) => {
    // TODO: Implement delete functionality
    logger.info('Delete promotion:', { promotion });
  };

  const handleView = (promotion: ProductPromotion) => {
    // TODO: Implement view functionality
    logger.info('View promotion:', { promotion });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promotions ({promotions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Réduction</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map(promotion => (
                <TableRow key={promotion.id}>
                  <TableCell className="font-medium">{promotion.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {promotion.discount_type === 'percentage' ? 'Pourcentage' : 'Montant fixe'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDiscount(promotion)}</TableCell>
                  <TableCell>{getStatusBadge(promotion)}</TableCell>
                  <TableCell>{formatDate(promotion.starts_at)}</TableCell>
                  <TableCell>{formatDate(promotion.ends_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(promotion)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(promotion)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(promotion)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
