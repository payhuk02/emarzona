import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BottomSheet, BottomSheetContent } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileFormField } from "@/components/ui/mobile-form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSpaceInputFix } from "@/hooks/useSpaceInputFix";
import { useResponsiveModal } from "@/hooks/use-responsive-modal";
import {
  validatePromotionData,
  validateCodeFormat,
  checkCodeUniqueness,
  getErrorMessage,
} from "@/lib/validations/promotionValidation";
import { AlertCircle, Sparkles } from "lucide-react";
import { PreviewPromotion } from "@/components/promotions/PreviewPromotion";
import { generateCodeSuggestions } from "@/lib/utils/codeSuggestions";
import { PromotionScopeSelector } from "@/components/promotions/PromotionScopeSelector";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CreatePromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  storeId: string;
}

const CreatePromotionDialogComponent = ({ open, onOpenChange, onSuccess, storeId }: CreatePromotionDialogProps) => {
  const { toast } = useToast();
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const { useBottomSheet } = useResponsiveModal();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [codeValidation, setCodeValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const codeSuggestions = generateCodeSuggestions(3);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase_amount: "0",
    max_uses: "",
    start_date: "",
    end_date: "",
    is_active: true,
    applies_to: "all_products" as "all_products" | "specific_products" | "categories" | "collections",
    product_ids: [] as string[],
    category_ids: [] as string[],
    collection_ids: [] as string[],
    product_types: [] as string[],
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationErrors([]);

    try {
      // Validation complète des données
      const validation = validatePromotionData({
        code: formData.code,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
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
        setLoading(false);
        return;
      }

      // Vérifier l'unicité du code
      const normalizedCode = formData.code.trim().toUpperCase();
      const uniquenessCheck = await checkCodeUniqueness(normalizedCode, storeId);
      
      if (!uniquenessCheck.unique) {
        setValidationErrors([uniquenessCheck.error || "Ce code promo existe déjà"]);
        toast({
          title: "Code déjà utilisé",
          description: uniquenessCheck.error || "Ce code promo existe déjà pour ce store",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Créer la promotion
      const { error } = await supabase
        .from('promotions')
        .insert({
          store_id: storeId,
          code: normalizedCode,
          description: formData.description || null,
          discount_type: formData.discount_type,
          discount_value: Number(formData.discount_value),
          min_purchase_amount: Number(formData.min_purchase_amount),
          max_uses: formData.max_uses ? Number(formData.max_uses) : null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          is_active: formData.is_active,
          applicable_to_product_ids: formData.applies_to === 'specific_products' && formData.product_ids.length > 0 
            ? formData.product_ids 
            : null,
          applicable_to_product_types: formData.product_types.length > 0 
            ? formData.product_types 
            : null,
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Promotion créée avec succès",
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch ( _error: unknown) {
      const errorMessage = getErrorMessage(error);
      setValidationErrors([errorMessage]);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [formData, storeId, onSuccess, onOpenChange, toast]);

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_purchase_amount: "0",
      max_uses: "",
      start_date: "",
      end_date: "",
      is_active: true,
      applies_to: "all_products",
      product_ids: [],
      category_ids: [],
      collection_ids: [],
      product_types: [],
    });
    setValidationErrors([]);
    setCodeValidation(null);
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

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="code">Code promo *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs min-h-[44px] min-w-[44px]"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Suggestions</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-64 max-w-[calc(100vw-2rem)] sm:max-w-xs p-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold mb-2">Suggestions de codes</p>
                {codeSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs font-mono min-h-[44px]"
                    onClick={() => handleCodeChange(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyDown={handleSpaceKeyDown}
          placeholder="PROMO2025"
          required
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
        <p className="text-xs text-muted-foreground">
          Alphanumérique, 3-20 caractères (ex: PROMO2025)
        </p>
      </div>

      <MobileFormField
        label="Description"
        name="description"
        type="textarea"
        value={formData.description}
        onChange={(value) => setFormData({ ...formData, description: value })}
        fieldProps={{
          onKeyDown: handleSpaceKeyDown,
          placeholder: "Description de la promotion...",
        }}
      />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MobileFormField
              label="Type de réduction"
              name="discount_type"
              type="select"
              value={formData.discount_type}
              onChange={(value) => setFormData({ ...formData, discount_type: value as any })}
              required
              selectOptions={[
                { value: 'percentage', label: 'Pourcentage (%)' },
                { value: 'fixed', label: 'Montant fixe (XOF)' },
              ]}
            />

            <MobileFormField
              label={`Valeur de la réduction * ${formData.discount_type === "percentage" ? "(%)" : "(XOF)"}`}
              name="discount_value"
              type="number"
              value={formData.discount_value}
              onChange={(value) => {
                if (formData.discount_type === "percentage" && parseFloat(value) > 100) {
                  return; // Empêcher les valeurs > 100%
                }
                setFormData({ ...formData, discount_value: value });
              }}
              required
              error={formData.discount_type === "percentage" && formData.discount_value && parseFloat(formData.discount_value) > 100 ? "Le pourcentage ne peut pas dépasser 100%" : undefined}
              fieldProps={{
                min: "0",
                max: formData.discount_type === "percentage" ? "100" : undefined,
                step: formData.discount_type === "percentage" ? "0.01" : "1",
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MobileFormField
              label="Montant minimum d'achat (XOF)"
              name="min_purchase"
              type="number"
              value={formData.min_purchase_amount}
              onChange={(value) => setFormData({ ...formData, min_purchase_amount: value })}
              fieldProps={{
                min: "0",
              }}
            />

            <MobileFormField
              label="Nombre d'utilisations max"
              name="max_uses"
              type="number"
              value={formData.max_uses}
              onChange={(value) => setFormData({ ...formData, max_uses: value })}
              fieldProps={{
                min: "1",
                placeholder: "Illimité",
              }}
            />
          </div>

          {/* Sélection de portée (Produits/Catégories/Collections) */}
          <div className="space-y-2">
            <Label>Portée de la promotion</Label>
            <Select
              value={formData.applies_to}
              onValueChange={(value: "all_products" | "specific_products" | "categories" | "collections") => setFormData({ ...formData, applies_to: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la portée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_products">Tous les produits</SelectItem>
                <SelectItem value="specific_products">Produits spécifiques</SelectItem>
                <SelectItem value="categories">Catégories</SelectItem>
                <SelectItem value="collections">Collections</SelectItem>
              </SelectContent>
            </Select>
            
            <PromotionScopeSelector
              appliesTo={formData.applies_to}
              selectedProductIds={formData.product_ids}
              selectedCategoryIds={formData.category_ids}
              selectedCollectionIds={formData.collection_ids}
              onProductIdsChange={(ids) => setFormData({ ...formData, product_ids: ids })}
              onCategoryIdsChange={(ids) => setFormData({ ...formData, category_ids: ids })}
              onCollectionIdsChange={(ids) => setFormData({ ...formData, collection_ids: ids })}
              storeId={storeId}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MobileFormField
              label="Date de début"
              name="start_date"
              type="datetime-local"
              value={formData.start_date}
              onChange={(value) => setFormData({ ...formData, start_date: value })}
            />

            <MobileFormField
              label="Date de fin"
              name="end_date"
              type="datetime-local"
              value={formData.end_date}
              onChange={(value) => setFormData({ ...formData, end_date: value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Activer la promotion</Label>
          </div>

          {/* Toggle Preview */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Label htmlFor="show-preview" className="cursor-pointer">
              Aperçu de la promotion
            </Label>
            <Switch
              id="show-preview"
              checked={showPreview}
              onCheckedChange={setShowPreview}
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <PreviewPromotion
              code={formData.code}
              description={formData.description}
              discountType={formData.discount_type}
              discountValue={formData.discount_value}
              minPurchaseAmount={formData.min_purchase_amount}
              maxUses={formData.max_uses}
              startDate={formData.start_date || undefined}
              endDate={formData.end_date || undefined}
              isActive={formData.is_active}
            />
          )}

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

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Création..." : "Créer la promotion"}
            </Button>
          </div>
        </form>
  );

  return (
    <>
      {useBottomSheet ? (
        <BottomSheet open={open} onOpenChange={onOpenChange}>
          <BottomSheetContent
            title="Nouvelle promotion"
            description="Créez un code promo pour vos clients"
            className="max-h-[90vh] overflow-y-auto"
          >
            {formContent}
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle promotion</DialogTitle>
              <DialogDescription>
                Créez un code promo pour vos clients
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

CreatePromotionDialogComponent.displayName = 'CreatePromotionDialogComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const CreatePromotionDialog = React.memo(CreatePromotionDialogComponent, (prevProps, nextProps) => {
  return (
    prevProps.open === nextProps.open &&
    prevProps.onOpenChange === nextProps.onOpenChange &&
    prevProps.onSuccess === nextProps.onSuccess &&
    prevProps.storeId === nextProps.storeId
  );
});

CreatePromotionDialog.displayName = 'CreatePromotionDialog';






