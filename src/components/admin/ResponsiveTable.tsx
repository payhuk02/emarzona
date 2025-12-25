/**
 * Composant de table responsive avec vue mobile (cartes)
 * Affiche une table sur desktop et des cartes sur mobile/tablette
 */

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  /**
   * En-têtes de la table (desktop)
   */
  headers: ReactNode[];
  
  /**
   * Données à afficher
   */
  rows: ReactNode[][];
  
  /**
   * Fonction pour rendre une carte mobile
   * Reçoit les données de la ligne (cells) et l'index
   */
  renderMobileCard?: (cells: ReactNode[], index: number) => ReactNode;
  
  /**
   * Message à afficher si aucune donnée
   */
  emptyMessage?: ReactNode;
  
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Composant de table responsive
 * 
 * @example
 * ```tsx
 * <ResponsiveTable
 *   headers={['Email', 'Nom', 'Rôle', 'Actions']}
 *   rows={users.map(user => [
 *     user.email,
 *     user.name,
 *     <Badge>{user.role}</Badge>,
 *     <Button>Action</Button>
 *   ])}
 *   renderMobileCard={(cells, index) => (
 *     <Card>
 *       <CardContent>
 *         <div className="space-y-2">
 *           <div><strong>Email:</strong> {cells[0]}</div>
 *           <div><strong>Nom:</strong> {cells[1]}</div>
 *           <div><strong>Rôle:</strong> {cells[2]}</div>
 *           <div className="pt-2">{cells[3]}</div>
 *         </div>
 *       </CardContent>
 *     </Card>
 *   )}
 * />
 * ```
 */
export const ResponsiveTable = ({
  headers,
  rows,
  renderMobileCard,
  emptyMessage,
  className,
}: ResponsiveTableProps) => {
  if (rows.length === 0) {
    return (
      <div className={cn("text-center py-12 text-muted-foreground", className)}>
        {emptyMessage || (
          <>
            <p className="font-medium">Aucune donnée</p>
            <p className="text-sm">Essayez de modifier vos filtres</p>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Vue Desktop - Table */}
      <div className="hidden lg:block">
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => (
                  <TableHead key={index}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Vue Mobile/Tablette - Cartes */}
      <div className="lg:hidden space-y-3">
        {rows.map((row, index) => {
          if (renderMobileCard) {
            return <div key={index}>{renderMobileCard(row, index)}</div>;
          }
          
          // Rendu par défaut si pas de renderMobileCard
          return (
            <Card key={index} className="border-border">
              <CardContent className="p-4 space-y-3">
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className={cn(
                      "flex items-center justify-between gap-2",
                      cellIndex === row.length - 1 && "pt-2 border-t"
                    )}
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {headers[cellIndex]}
                    </span>
                    <div className="flex-1 text-right">{cell}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

