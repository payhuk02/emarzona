import React, { useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Mail, Phone, MapPin, ShoppingBag, DollarSign, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/hooks/useCustomers";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTableCard } from "@/components/ui/mobile-table-card";

interface CustomersTableProps {
  customers: Customer[];
  onUpdate: () => void;
}


const CustomersTableComponent = ({ customers, onUpdate }: CustomersTableProps) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tableRef = useScrollAnimation<HTMLDivElement>();

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Client supprimé avec succès",
      });

      onUpdate();
      setDeleteId(null);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [deleteId, onUpdate]); // Note: toast est stable, pas besoin de le mettre dans les dépendances

  return (
    <>
      {isMobile ? (
        <MobileTableCard
          data={useMemo(() => customers.map((c) => ({ id: c.id, ...c })), [customers])}
          columns={[
            {
              key: 'name',
              header: 'Nom',
              priority: 'high',
              className: 'font-medium',
            },
            {
              key: 'email',
              header: 'Contact',
              priority: 'high',
              render: (row) => (
                <div className="flex flex-col gap-1">
                  {row.email && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{row.email}</span>
                    </div>
                  )}
                  {row.phone && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{row.phone}</span>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'location',
              header: 'Localisation',
              priority: 'medium',
              render: (row) => (
                row.city && row.country
                  ? `${row.city}, ${row.country}`
                  : row.city || row.country || "—"
              ),
            },
            {
              key: 'total_orders',
              header: 'Commandes',
              priority: 'high',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span>{row.total_orders || 0}</span>
                </div>
              ),
            },
            {
              key: 'total_spent',
              header: 'Total dépensé',
              priority: 'high',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="font-medium">{Number(row.total_spent).toLocaleString()} XOF</span>
                </div>
              ),
              className: 'font-medium',
            },
            {
              key: 'created_at',
              header: 'Inscrit le',
              priority: 'low',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span>{format(new Date(row.created_at), "dd MMM yyyy", { locale: fr })}</span>
                </div>
              ),
            },
          ]}
          actions={(row) => (
            <Select>
              <SelectTrigger
                className="min-h-[44px] min-w-[44px] touch-manipulation"
                aria-label="Actions pour le client"
              >
                <MoreHorizontal className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                <SelectItem value="edit" onSelect={() => {}}>
                  <div className="flex items-center">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </div>
                </SelectItem>
                <SelectItem value="delete" onSelect={() => setDeleteId(row.id)} className="text-destructive">
                  <div className="flex items-center">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      ) : (
        <div ref={tableRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Nom</TableHead>
                    <TableHead className="text-xs sm:text-sm">Contact</TableHead>
                    <TableHead className="text-xs sm:text-sm">Localisation</TableHead>
                    <TableHead className="text-xs sm:text-sm">Commandes</TableHead>
                    <TableHead className="text-xs sm:text-sm">Total dépensé</TableHead>
                    <TableHead className="text-xs sm:text-sm">Inscrit le</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium text-xs sm:text-sm">{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs sm:text-sm">
                          {customer.email && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[200px]">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {customer.city && customer.country
                          ? `${customer.city}, ${customer.country}`
                          : customer.city || customer.country || "—"}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">{customer.total_orders || 0}</TableCell>
                      <TableCell className="text-xs sm:text-sm font-medium">
                        {Number(customer.total_spent).toLocaleString()} XOF
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {format(new Date(customer.created_at), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select>
                          <SelectTrigger
                            className="h-8 w-8 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] touch-manipulation"
                            aria-label={`Actions pour ${customer.email || 'le client'}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </SelectTrigger>
                          <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                            <SelectItem value="edit" onSelect={() => {}}>
                              <div className="flex items-center">
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </div>
                            </SelectItem>
                            <SelectItem value="delete" onSelect={() => setDeleteId(customer.id)} className="text-destructive">
                              <div className="flex items-center">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={loading} className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={loading}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
            >
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const CustomersTable = React.memo(CustomersTableComponent, (prevProps, nextProps) => {
  return (
    prevProps.customers.length === nextProps.customers.length &&
    prevProps.onUpdate === nextProps.onUpdate &&
    // Comparaison superficielle des customers (comparer les IDs)
    prevProps.customers.every((customer, index) => 
      customer.id === nextProps.customers[index]?.id &&
      customer.name === nextProps.customers[index]?.name &&
      customer.total_orders === nextProps.customers[index]?.total_orders &&
      customer.total_spent === nextProps.customers[index]?.total_spent
    )
  );
});

CustomersTable.displayName = 'CustomersTable';






