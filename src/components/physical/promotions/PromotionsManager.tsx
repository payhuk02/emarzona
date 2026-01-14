/**
 * Promotions Manager Component
 * Date: 2025-01-28
 * 
 * Component for managing product promotions
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MoreVertical, Edit, Trash2, Tag, Calendar, Users, Percent, TrendingUp } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import {
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  ProductPromotion,
} from '@/hooks/physical/usePromotions';
import { useStore } from '@/hooks/useStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { PromotionScopeSelector } from '@/components/promotions/PromotionScopeSelector';
import { useToast } from '@/hooks/use-toast';
import {
  validatePromotionData,
  validateCodeFormat,
  checkCodeUniqueness,
  getErrorMessage,
} from '@/lib/validations/promotionValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const PromotionsManager : React.FC = () => {
  const { store } = useStore();
  const { toast } = useToast();
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const { data: promotions = [], isLoading } = usePromotions(store?.id);
  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();
  const deleteMutation = useDeletePromotion();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<ProductPromotion | null>(null);
  const [deletePromotionId, setDeletePromotionId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [codeValidation, setCodeValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    discount_type: 'percentage' as const,
    discount_value: 0,
    applies_to: 'all_products' as const,
    product_ids: [] as string[],
    category_ids: [] as string[],
    collection_ids: [] as string[],
    applies_to_variants: true,
    variant_ids: [] as string[],
    min_purchase_amount: undefined as number | undefined,
    min_quantity: undefined as number | undefined,
    max_uses: undefined as number | undefined,
    max_uses_per_customer: undefined as number | undefined,
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: undefined as string | undefined,
    is_active: true,
    is_automatic: false,
  });

  const handleOpenDialog = (promotion?: ProductPromotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        name: promotion.name,
        description: promotion.description || '',
        code: promotion.code || '',
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value,
        applies_to: promotion.applies_to,
        product_ids: promotion.product_ids || [],
        category_ids: promotion.category_ids || [],
        collection_ids: promotion.collection_ids || [],
        applies_to_variants: promotion.applies_to_variants,
        variant_ids: promotion.variant_ids || [],
        min_purchase_amount: promotion.min_purchase_amount,
        min_quantity: promotion.min_quantity,
        max_uses: promotion.max_uses,
        max_uses_per_customer: promotion.max_uses_per_customer,
        starts_at: promotion.starts_at.slice(0, 16),
        ends_at: promotion.ends_at ? promotion.ends_at.slice(0, 16) : undefined,
        is_active: promotion.is_active,
        is_automatic: promotion.is_automatic,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        name: '',
        description: '',
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        applies_to: 'all_products',
        product_ids: [],
        category_ids: [],
        collection_ids: [],
        applies_to_variants: true,
        variant_ids: [],
        min_purchase_amount: undefined,
        min_quantity: undefined,
        max_uses: undefined,
        max_uses_per_customer: undefined,
        starts_at: new Date().toISOString().slice(0, 16),
        ends_at: undefined,
        is_active: true,
        is_automatic: false,
      });
      setValidationErrors([]);
      setCodeValidation(null);
    }
    setIsDialogOpen(true);
  };

  // Validation en temps réel du code
  const handleCodeChange = (value: string) => {
    const normalizedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setFormData({ ...formData, code: normalizedValue });
    
    if (normalizedValue.length > 0) {
      const validation = validateCodeFormat(normalizedValue);
      setCodeValidation(validation);
    } else {
      setCodeValidation(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    setValidationErrors([]);

    // Validation : vérifier qu'au moins un élément est sélectionné si nécessaire
    if (formData.applies_to === 'specific_products' && formData.product_ids.length === 0) {
      setValidationErrors(["Veuillez sélectionner au moins un produit"]);
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner au moins un produit",
        variant: "destructive",
      });
      return;
    }

    if (formData.applies_to === 'categories' && formData.category_ids.length === 0) {
      setValidationErrors(["Veuillez sélectionner au moins une catégorie"]);
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner au moins une catégorie",
        variant: "destructive",
      });
      return;
    }

    if (formData.applies_to === 'collections' && formData.collection_ids.length === 0) {
      setValidationErrors(["Veuillez sélectionner au moins une collection"]);
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner au moins une collection",
        variant: "destructive",
      });
      return;
    }

    // Validation complète des données si un code est fourni
    if (formData.code) {
      const validation = validatePromotionData({
        code: formData.code,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        start_date: formData.starts_at,
        end_date: formData.ends_at,
        min_purchase_amount: formData.min_purchase_amount,
        max_uses: formData.max_uses,
      });

      if (!validation.valid) {
        setValidationErrors(validation.errors);
        toast({
          title: "Erreur de validation",
          description: validation.errors[0] || "Veuillez corriger les erreurs dans le formulaire",
          variant: "destructive",
        });
        return;
      }

      // Vérifier l'unicité du code
      const normalizedCode = formData.code.trim().toUpperCase();
      const uniquenessCheck = await checkCodeUniqueness(
        normalizedCode,
        store.id,
        editingPromotion?.id,
        "product_promotions"
      );

      if (!uniquenessCheck.unique) {
        setValidationErrors([uniquenessCheck.error || "Ce code promo existe déjà"]);
        toast({
          title: "Code déjà utilisé",
          description: uniquenessCheck.error || "Ce code promo existe déjà",
          variant: "destructive",
        });
        return;
      }
    }

    // Validation supplémentaire pour discount_value
    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      setValidationErrors(["Le pourcentage ne peut pas dépasser 100%"]);
      toast({
        title: "Erreur de validation",
        description: "Le pourcentage ne peut pas dépasser 100%",
        variant: "destructive",
      });
      return;
    }

    // Validation des dates
    if (formData.ends_at && new Date(formData.starts_at) >= new Date(formData.ends_at)) {
      setValidationErrors(["La date de fin doit être après la date de début"]);
      toast({
        title: "Erreur de validation",
        description: "La date de fin doit être après la date de début",
        variant: "destructive",
      });
      return;
    }

    const promotionData = {
      ...formData,
      store_id: store.id,
      code: formData.code ? formData.code.trim().toUpperCase() : null,
      starts_at: new Date(formData.starts_at).toISOString(),
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : undefined,
    };

    try {
      if (editingPromotion) {
        await updateMutation.mutateAsync({
          id: editingPromotion.id,
          ...promotionData,
        });
      } else {
        await createMutation.mutateAsync(promotionData);
      }

      setIsDialogOpen(false);
      setEditingPromotion(null);
      setValidationErrors([]);
      setCodeValidation(null);
    } catch ( _error: any) {
      const errorMessage = getErrorMessage(error);
      setValidationErrors([errorMessage]);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletePromotionId) return;
    await deleteMutation.mutateAsync(deletePromotionId);
    setDeletePromotionId(null);
  };

  // Refs for animations
  const cardRef = useScrollAnimation<HTMLDivElement>();

  const isActive = (promotion: ProductPromotion) => {
    const now = new Date();
    return (
      promotion.is_active &&
      new Date(promotion.starts_at) <= now &&
      (!promotion.ends_at || new Date(promotion.ends_at) >= now)
    );
  };

  // Stats calculées
  const stats = useMemo(() => {
    if (!promotions || promotions.length === 0) {
      return { total: 0, active: 0, totalUses: 0, averageDiscount: 0 };
    }
    
    const total = promotions.length;
    const active = promotions.filter(p => {
      const now = new Date();
      return (
        p.is_active &&
        new Date(p.starts_at) <= now &&
        (!p.ends_at || new Date(p.ends_at) >= now)
      );
    }).length;
    const totalUses = promotions.reduce((sum, p) => sum + (p.current_uses || 0), 0);
    const totalDiscount = promotions.reduce((sum, p) => {
      if (p.discount_type === 'percentage') {
        return sum + p.discount_value;
      }
      return sum;
    }, 0);
    const averageDiscount = total > 0 ? totalDiscount / total : 0;
    
    return { total, active, totalUses, averageDiscount };
  }, [promotions]);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards - Responsive */}
      {promotions && promotions.length > 0 && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Promotions</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {stats.total}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                  <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Actives</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {stats.active}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Utilisations</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {stats.totalUses}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Moyenne Réduction</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {stats.averageDiscount.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5">
                  <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card 
        ref={cardRef}
        className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl">Promotions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Gérez vos promotions et codes de réduction
            </CardDescription>
          </div>
          <Button 
            onSelect={() => handleOpenDialog()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            size="sm"
          >
            <Plus className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Créer une promotion</span>
          </Button>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500">
                <Tag className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucune promotion</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md">
                Aucune promotion configurée. Créez votre première promotion pour commencer.
              </p>
              <Button 
                onSelect={() => handleOpenDialog()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une promotion
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Nom</TableHead>
                        <TableHead className="text-xs sm:text-sm">Code</TableHead>
                        <TableHead className="text-xs sm:text-sm">Type</TableHead>
                        <TableHead className="text-xs sm:text-sm">Valeur</TableHead>
                        <TableHead className="text-xs sm:text-sm">Portée</TableHead>
                        <TableHead className="text-xs sm:text-sm">Dates</TableHead>
                        <TableHead className="text-xs sm:text-sm">Utilisations</TableHead>
                        <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promotions.map((promotion) => (
                        <TableRow key={promotion.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium text-xs sm:text-sm">{promotion.name}</TableCell>
                          <TableCell>
                            {promotion.code ? (
                              <code className="text-xs sm:text-sm bg-muted px-2 py-1 rounded font-mono">
                                {promotion.code}
                              </code>
                            ) : (
                              <span className="text-muted-foreground text-xs sm:text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {promotion.discount_type === 'percentage' && '%'}
                              {promotion.discount_type === 'fixed_amount' && 'Montant fixe'}
                              {promotion.discount_type === 'free_shipping' && 'Livraison gratuite'}
                              {promotion.discount_type === 'buy_x_get_y' && 'Acheter X obtenir Y'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm font-medium">
                            {promotion.discount_type === 'percentage'
                              ? `${promotion.discount_value}%`
                              : `${promotion.discount_value} XOF`}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {promotion.applies_to === 'all_products' && 'Tous les produits'}
                              {promotion.applies_to === 'specific_products' && 'Produits spécifiques'}
                              {promotion.applies_to === 'categories' && 'Catégories'}
                              {promotion.applies_to === 'collections' && 'Collections'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {format(new Date(promotion.starts_at), 'dd MMM yyyy', { locale: fr })}
                                {promotion.ends_at &&
                                  ` - ${format(new Date(promotion.ends_at), 'dd MMM yyyy', { locale: fr })}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>
                                {promotion.current_uses}
                                {promotion.max_uses && ` / ${promotion.max_uses}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isActive(promotion) ? (
                              <Badge variant="outline" className="text-green-600 text-xs">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 text-xs">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Select>
                              <SelectTrigger className="h-8 w-8">

                                  <MoreVertical className="h-4 w-4" />
                                
</SelectTrigger>
                              <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                                <SelectItem value="edit" onSelect={() => handleOpenDialog(promotion)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Modifier
                                </SelectItem>
                                <DropdownMenuSeparator />
                                <SelectItem value="delete" onSelect={() => setDeletePromotionId(promotion.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3 sm:space-y-4">
                {promotions.map((promotion) => (
                  <Card 
                    key={promotion.id}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-base sm:text-lg">{promotion.name}</h3>
                            {isActive(promotion) ? (
                              <Badge variant="outline" className="text-green-600 text-xs">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          {promotion.code && (
                            <code className="text-xs sm:text-sm bg-muted px-2 py-1 rounded font-mono mb-2 inline-block">
                              {promotion.code}
                            </code>
                          )}
                        </div>
                        <Select>
                          <SelectTrigger className="h-8 w-8">

                              <MoreVertical className="h-4 w-4" />
                            
</SelectTrigger>
                          <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                            <SelectItem value="copy" onSelect={() => handleOpenDialog(promotion)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </SelectItem>
                            <DropdownMenuSeparator />
                            <SelectItem value="view" onSelect={() => setDeletePromotionId(promotion.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-border/50">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Percent className="h-4 w-4 text-purple-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Type</p>
                              <p className="text-xs sm:text-sm font-semibold">
                                {promotion.discount_type === 'percentage' && '%'}
                                {promotion.discount_type === 'fixed_amount' && 'Montant fixe'}
                                {promotion.discount_type === 'free_shipping' && 'Livraison gratuite'}
                                {promotion.discount_type === 'buy_x_get_y' && 'Acheter X obtenir Y'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Tag className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Valeur</p>
                              <p className="text-xs sm:text-sm font-semibold">
                                {promotion.discount_type === 'percentage'
                                  ? `${promotion.discount_value}%`
                                  : `${promotion.discount_value} XOF`}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {format(new Date(promotion.starts_at), 'dd MMM yyyy', { locale: fr })}
                            {promotion.ends_at &&
                              ` - ${format(new Date(promotion.ends_at), 'dd MMM yyyy', { locale: fr })}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>
                            {promotion.current_uses}
                            {promotion.max_uses && ` / ${promotion.max_uses}`} utilisations
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? 'Modifier la promotion' : 'Nouvelle promotion'}
            </DialogTitle>
            <DialogDescription>
              Configurez votre promotion ou code de réduction
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onKeyDown={handleSpaceKeyDown}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code promotionnel (optionnel)</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  placeholder="EXEMPLE2025"
                  maxLength={20}
                  className={codeValidation && !codeValidation.valid ? "border-red-500" : ""}
                  aria-invalid={codeValidation && !codeValidation.valid}
                  aria-describedby={codeValidation && !codeValidation.valid ? "code-error" : undefined}
                />
                {codeValidation && !codeValidation.valid && (
                  <p id="code-error" className="text-sm text-red-500">
                    {codeValidation.errors[0]}
                  </p>
                )}
                {codeValidation && codeValidation.valid && (
                  <p className="text-sm text-green-600">Format valide</p>
                )}
                {formData.code && (
                  <p className="text-xs text-muted-foreground">
                    Alphanumérique, 3-20 caractères (ex: PROMO2025)
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                onKeyDown={handleSpaceKeyDown}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type">Type de réduction *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed_amount">Montant fixe</SelectItem>
                    <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                    <SelectItem value="buy_x_get_y">Acheter X obtenir Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_value">Valeur *</Label>
                <Input
                  id="discount_value"
                  type="number"
                  min="0"
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (formData.discount_type === 'percentage' && value > 100) {
                      return; // Empêcher les valeurs > 100%
                    }
                    setFormData({ ...formData, discount_value: value });
                  }}
                  required
                />
                {formData.discount_type === 'percentage' && (
                  <>
                    <p className="text-xs text-muted-foreground">En pourcentage (ex: 10 pour 10%)</p>
                    {formData.discount_value > 100 && (
                      <p className="text-sm text-red-500">Le pourcentage ne peut pas dépasser 100%</p>
                    )}
                  </>
                )}
                {formData.discount_type === 'fixed_amount' && (
                  <p className="text-xs text-muted-foreground">En XOF</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applies_to">S'applique à *</Label>
              <Select
                value={formData.applies_to}
                onValueChange={(value: any) => {
                  // Réinitialiser les sélections quand on change le type
                  setFormData({
                    ...formData,
                    applies_to: value,
                    product_ids: [],
                    category_ids: [],
                    collection_ids: [],
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_products">Tous les produits</SelectItem>
                  <SelectItem value="specific_products">Produits spécifiques</SelectItem>
                  <SelectItem value="categories">Catégories</SelectItem>
                  <SelectItem value="collections">Collections</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sélecteur de produits/catégories/collections */}
            {formData.applies_to !== 'all_products' && store?.id && (
              <PromotionScopeSelector
                appliesTo={formData.applies_to}
                selectedProductIds={formData.product_ids}
                selectedCategoryIds={formData.category_ids}
                selectedCollectionIds={formData.collection_ids}
                onProductIdsChange={(ids) => setFormData({ ...formData, product_ids: ids })}
                onCategoryIdsChange={(ids) => setFormData({ ...formData, category_ids: ids })}
                onCollectionIdsChange={(ids) => setFormData({ ...formData, collection_ids: ids })}
                storeId={store.id}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Date de début *</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at">Date de fin (optionnel)</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={formData.ends_at || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, ends_at: e.target.value || undefined })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses">Limite d'utilisations (optionnel)</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={formData.max_uses || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_uses: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_uses_per_customer">Par client (optionnel)</Label>
                <Input
                  id="max_uses_per_customer"
                  type="number"
                  min="1"
                  value={formData.max_uses_per_customer || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_uses_per_customer: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_purchase_amount">Montant minimum (optionnel)</Label>
                <Input
                  id="min_purchase_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_purchase_amount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_purchase_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="is_automatic"
                  checked={formData.is_automatic}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_automatic: checked as boolean })
                  }
                />
                <Label htmlFor="is_automatic" className="cursor-pointer">
                  Application automatique
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Actif
              </Label>
            </div>

            {/* Affichage des erreurs de validation */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onSelect={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingPromotion ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletePromotionId}
        onOpenChange={(open) => !open && setDeletePromotionId(null)}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette promotion ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};










