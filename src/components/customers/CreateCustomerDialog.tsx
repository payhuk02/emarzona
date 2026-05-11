import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BottomSheet, BottomSheetContent } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileFormField } from "@/components/ui/mobile-form-field";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSpaceInputFix } from "@/hooks/useSpaceInputFix";
import { logger } from "@/lib/logger";
import { useResponsiveModal } from "@/hooks/use-responsive-modal";

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  storeId: string;
}

const CreateCustomerDialogComponent = ({ open, onOpenChange, onSuccess, storeId }: CreateCustomerDialogProps) => {
  const { toast } = useToast();
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    notes: "",
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      notes: "",
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .insert({
          store_id: storeId,
          ...formData,
        })
        .select()
        .single();

      if (error) throw error;

      // Déclencher webhook customer.created (asynchrone)
      if (customer) {
        import('@/lib/webhooks/webhook-system').then(({ triggerWebhook }) => {
          triggerWebhook(storeId, 'customer.created', {
            customer_id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            created_at: customer.created_at,
          }).catch((err) => {
            logger.error('Error triggering webhook', { error: err });
          });
        });
      }

      toast({
        title: "Succès",
        description: "Client créé avec succès",
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
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
  }, [formData, storeId, onSuccess, onOpenChange, resetForm]); // Note: toast est stable

  const { useBottomSheet } = useResponsiveModal();

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <MobileFormField
        label="Nom"
        name="name"
        type="text"
        value={formData.name}
        onChange={(value) => setFormData({ ...formData, name: value })}
        required
        fieldProps={{
          onKeyDown: handleSpaceKeyDown,
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MobileFormField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
        />

        <MobileFormField
          label="Téléphone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={(value) => setFormData({ ...formData, phone: value })}
        />
      </div>

      <MobileFormField
        label="Adresse"
        name="address"
        type="text"
        value={formData.address}
        onChange={(value) => setFormData({ ...formData, address: value })}
        fieldProps={{
          onKeyDown: handleSpaceKeyDown,
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MobileFormField
          label="Ville"
          name="city"
          type="text"
          value={formData.city}
          onChange={(value) => setFormData({ ...formData, city: value })}
          fieldProps={{
            onKeyDown: handleSpaceKeyDown,
          }}
        />

        <MobileFormField
          label="Pays"
          name="country"
          type="text"
          value={formData.country}
          onChange={(value) => setFormData({ ...formData, country: value })}
          fieldProps={{
            onKeyDown: handleSpaceKeyDown,
          }}
        />
      </div>

      <MobileFormField
        label="Notes"
        name="notes"
        type="textarea"
        value={formData.notes}
        onChange={(value) => setFormData({ ...formData, notes: value })}
        fieldProps={{
          onKeyDown: handleSpaceKeyDown,
          placeholder: "Notes sur le client...",
        }}
      />

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
          {loading ? "Création..." : "Créer le client"}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {useBottomSheet ? (
        <BottomSheet open={open} onOpenChange={onOpenChange}>
          <BottomSheetContent
            title="Nouveau client"
            description="Ajoutez un nouveau client à votre base de données"
            className="max-h-[90vh] overflow-y-auto"
          >
            {formContent}
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau client</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau client à votre base de données
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

CreateCustomerDialogComponent.displayName = 'CreateCustomerDialogComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const CreateCustomerDialog = React.memo(CreateCustomerDialogComponent, (prevProps, nextProps) => {
  return (
    prevProps.open === nextProps.open &&
    prevProps.onOpenChange === nextProps.onOpenChange &&
    prevProps.onSuccess === nextProps.onSuccess &&
    prevProps.storeId === nextProps.storeId
  );
});

CreateCustomerDialog.displayName = 'CreateCustomerDialog';






