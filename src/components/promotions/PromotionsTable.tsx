import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Copy, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Promotion } from "@/hooks/usePromotions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PromotionsTableProps {
  promotions: Promotion[];
  onUpdate: () => void;
}

export const PromotionsTable = ({ promotions, onUpdate }: PromotionsTableProps) => {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
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
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copié",
      description: `Le code "${code}" a été copié dans le presse-papier`,
    });
  };

  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Réduction</TableHead>
                <TableHead>Utilisations</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-mono font-medium">{promo.code}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {promo.discount_type === "percentage" ? "Pourcentage" : "Montant fixe"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {promo.discount_value}
                    {promo.discount_type === "percentage" ? "%" : " XOF"}
                  </TableCell>
                  <TableCell>
                    {promo.used_count}
                    {promo.max_uses ? ` / ${promo.max_uses}` : " / ∞"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {promo.start_date && (
                      <div>Du {format(new Date(promo.start_date), "dd/MM/yyyy", { locale: fr })}</div>
                    )}
                    {promo.end_date && (
                      <div>Au {format(new Date(promo.end_date), "dd/MM/yyyy", { locale: fr })}</div>
                    )}
                    {!promo.start_date && !promo.end_date && "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={promo.is_active ? "default" : "secondary"}>
                      {promo.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette promotion ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
