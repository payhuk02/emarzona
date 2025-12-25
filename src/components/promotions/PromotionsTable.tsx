import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Copy, Trash2, Percent, Calendar, TrendingUp, Tag } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Promotion } from "@/hooks/usePromotions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface PromotionsTableProps {
  promotions: Promotion[];
  onUpdate: () => void;
}

// PromotionCard component for mobile view
const PromotionCard = ({ 
  promotion, 
  onCopy,
  onDelete 
}: { 
  promotion: Promotion; 
  onCopy: (code: string) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-mono font-semibold text-base sm:text-lg">{promotion.code}</h3>
              <Badge variant={promotion.is_active ? "default" : "secondary"} className="text-xs">
                {promotion.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {promotion.description && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                {promotion.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions pour la promotion ${promotion.name || promotion.code}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCopy(promotion.code)}>
                <Copy className="h-4 w-4 mr-2" />
                Copier le code
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(promotion.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 pt-3 border-t border-border/50">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Percent className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Réduction</p>
                <p className="text-sm font-semibold">
                  {promotion.discount_value}
                  {promotion.discount_type === "percentage" ? "%" : " XOF"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Utilisations</p>
                <p className="text-sm font-semibold">
                  {promotion.used_count}
                  {promotion.max_uses ? ` / ${promotion.max_uses}` : " / ∞"}
                </p>
              </div>
            </div>
          </div>

          {(promotion.start_date || promotion.end_date) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {promotion.start_date && (
                  <>Du {format(new Date(promotion.start_date), "dd/MM/yyyy", { locale: fr })}</>
                )}
                {promotion.start_date && promotion.end_date && " "}
                {promotion.end_date && (
                  <>au {format(new Date(promotion.end_date), "dd/MM/yyyy", { locale: fr })}</>
                )}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const PromotionsTableComponent = ({ promotions, onUpdate }: PromotionsTableProps) => {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tableRef = useScrollAnimation<HTMLDivElement>();

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Promotion supprimée avec succès",
      });

      onUpdate();
      setDeleteId(null);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [deleteId, onUpdate]); // Note: toast est stable

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copié",
      description: `Le code "${code}" a été copié dans le presse-papier`,
    });
  }, []); // Note: toast est stable

  return (
    <>
      {/* Desktop Table View */}
      <div ref={tableRef} className="hidden lg:block animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Code</TableHead>
                  <TableHead className="text-xs sm:text-sm">Type</TableHead>
                  <TableHead className="text-xs sm:text-sm">Réduction</TableHead>
                  <TableHead className="text-xs sm:text-sm">Utilisations</TableHead>
                  <TableHead className="text-xs sm:text-sm">Période</TableHead>
                  <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promo) => (
                  <TableRow key={promo.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono font-medium text-xs sm:text-sm">{promo.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {promo.discount_type === "percentage" ? "Pourcentage" : "Montant fixe"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm font-medium">
                      {promo.discount_value}
                      {promo.discount_type === "percentage" ? "%" : " XOF"}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {promo.used_count}
                      {promo.max_uses ? ` / ${promo.max_uses}` : " / ∞"}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {promo.start_date && (
                        <div>Du {format(new Date(promo.start_date), "dd/MM/yyyy", { locale: fr })}</div>
                      )}
                      {promo.end_date && (
                        <div>Au {format(new Date(promo.end_date), "dd/MM/yyyy", { locale: fr })}</div>
                      )}
                      {!promo.start_date && !promo.end_date && "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={promo.is_active ? "default" : "secondary"} className="text-xs">
                        {promo.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions pour la promotion ${promo.name || promo.code}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCopyCode(promo.code)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copier le code
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(promo.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
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
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {promotions.map((promotion) => (
          <PromotionCard 
            key={promotion.id} 
            promotion={promotion} 
            onCopy={handleCopyCode}
            onDelete={setDeleteId}
          />
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette promotion ? Cette action est irréversible.
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

PromotionsTableComponent.displayName = 'PromotionsTableComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const PromotionsTable = React.memo(PromotionsTableComponent, (prevProps, nextProps) => {
  return (
    prevProps.promotions.length === nextProps.promotions.length &&
    prevProps.onUpdate === nextProps.onUpdate &&
    // Comparaison superficielle des promotions (comparer les IDs et statuts)
    prevProps.promotions.every((promotion, index) => 
      promotion.id === nextProps.promotions[index]?.id &&
      promotion.is_active === nextProps.promotions[index]?.is_active &&
      promotion.discount_type === nextProps.promotions[index]?.discount_type
    )
  );
});

PromotionsTable.displayName = 'PromotionsTable';
