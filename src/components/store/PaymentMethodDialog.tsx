/**
 * Composant: PaymentMethodDialog
 * Description: Dialog pour ajouter/modifier une méthode de paiement sauvegardée
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileFormField } from '@/components/ui/mobile-form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from '@/components/icons';
import { useResponsiveModal } from '@/hooks/use-responsive-modal';
import { 
  SavedStorePaymentMethod, 
  StorePaymentMethodForm,
  StorePaymentMethod,
  MobileMoneyDetails,
  BankCardDetails,
  BankTransferDetails,
  MobileMoneyOperator
} from '@/types/store-withdrawals';
import { COUNTRIES } from '@/lib/countries';
import { getMobileMoneyOperatorsForCountry, getDefaultOperatorForCountry, MobileMoneyOperatorInfo } from '@/lib/mobile-money-operators';

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method?: SavedStorePaymentMethod | null;
  onSubmit: (formData: StorePaymentMethodForm) => Promise<void>;
}

export const PaymentMethodDialog = ({
  open,
  onOpenChange,
  method,
  onSubmit,
}: PaymentMethodDialogProps) => {
  const { useBottomSheet } = useResponsiveModal();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<StorePaymentMethod>('mobile_money');
  const [label, setLabel] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  // Mobile Money fields
  const [mobileCountry, setMobileCountry] = useState('BF'); // Burkina Faso par défaut
  const [mobilePhone, setMobilePhone] = useState('');
  const [mobileOperator, setMobileOperator] = useState<MobileMoneyOperator>('orange_money');
  const [mobileFullName, setMobileFullName] = useState('');

  // Opérateurs disponibles selon le pays
  const availableOperators = getMobileMoneyOperatorsForCountry(mobileCountry);

  // Bank Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [bankName, setBankName] = useState('');

  // Bank Transfer fields
  const [accountNumber, setAccountNumber] = useState('');
  const [transferBankName, setTransferBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [iban, setIban] = useState('');

  // Initialiser les champs si on modifie une méthode existante
  useEffect(() => {
    if (method) {
      setPaymentMethod(method.payment_method);
      setLabel(method.label);
      setIsDefault(method.is_default);
      setIsActive(method.is_active);
      setNotes(method.notes || '');

      const details = method.payment_details;
      if (method.payment_method === 'mobile_money') {
        const mobileDetails = details as MobileMoneyDetails;
        setMobileCountry(mobileDetails.country || 'BF');
        setMobilePhone(mobileDetails.phone || '');
        setMobileOperator(mobileDetails.operator || 'orange_money');
        setMobileFullName(mobileDetails.full_name || '');
      } else if (method.payment_method === 'bank_card') {
        const cardDetails = details as BankCardDetails;
        setCardNumber(cardDetails.card_number || '');
        setCardholderName(cardDetails.cardholder_name || '');
        setExpiryMonth(cardDetails.expiry_month || '');
        setExpiryYear(cardDetails.expiry_year || '');
        setBankName(cardDetails.bank_name || '');
      } else {
        const transferDetails = details as BankTransferDetails;
        setAccountNumber(transferDetails.account_number || '');
        setTransferBankName(transferDetails.bank_name || '');
        setAccountHolderName(transferDetails.account_holder_name || '');
        setIban(transferDetails.iban || '');
      }
    } else {
      // Réinitialiser pour une nouvelle méthode
      setPaymentMethod('mobile_money');
      setLabel('');
      setIsDefault(false);
      setIsActive(true);
      setNotes('');
      setMobileCountry('BF');
      setMobilePhone('');
      setMobileOperator('orange_money');
      setMobileFullName('');
      setCardNumber('');
      setCardholderName('');
      setExpiryMonth('');
      setExpiryYear('');
      setBankName('');
      setAccountNumber('');
      setTransferBankName('');
      setAccountHolderName('');
      setIban('');
    }
  }, [method, open]);

  const handleSubmit = async () => {
    if (!label.trim()) {
      return;
    }

    let  paymentDetails: MobileMoneyDetails | BankCardDetails | BankTransferDetails;

    if (paymentMethod === 'mobile_money') {
      if (!mobilePhone || !mobileOperator || !mobileCountry) return;
      paymentDetails = {
        phone: mobilePhone,
        operator: mobileOperator,
        country: mobileCountry,
        full_name: mobileFullName,
      };
    } else if (paymentMethod === 'bank_card') {
      if (!cardNumber || !cardholderName) return;
      paymentDetails = {
        card_number: cardNumber,
        cardholder_name: cardholderName,
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        bank_name: bankName,
      };
    } else {
      if (!accountNumber || !transferBankName || !accountHolderName) return;
      paymentDetails = {
        account_number: accountNumber,
        bank_name: transferBankName,
        account_holder_name: accountHolderName,
        iban: iban,
      };
    }

    setLoading(true);
    try {
      await onSubmit({
        payment_method: paymentMethod,
        label: label.trim(),
        payment_details: paymentDetails,
        is_default: isDefault,
        is_active: isActive,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const isValid = () => {
    if (!label.trim()) return false;

    if (paymentMethod === 'mobile_money') {
      return !!mobilePhone && !!mobileOperator && !!mobileCountry;
    } else if (paymentMethod === 'bank_card') {
      return !!cardNumber && !!cardholderName;
    } else {
      return !!accountNumber && !!transferBankName && !!accountHolderName;
    }
  };

  const formContent = (
    <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          {/* Label */}
          <MobileFormField
            label="Nom de la méthode"
            name="label"
            type="text"
            value={label}
            onChange={setLabel}
            required
            fieldProps={{
              placeholder: "Ex: Orange Money Principal, Carte UBA...",
            }}
          />

          {/* Type de méthode */}
          <MobileFormField
            label="Type de paiement"
            name="payment_method"
            type="select"
            value={paymentMethod}
            onChange={(value) => setPaymentMethod(value as any)}
            required
            selectOptions={[
              { value: 'mobile_money', label: 'Mobile Money' },
              { value: 'bank_card', label: 'Carte bancaire' },
              { value: 'bank_transfer', label: 'Virement bancaire' },
            ]}
          />

          {/* Détails selon la méthode */}
          {paymentMethod === 'mobile_money' && (
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg">
              <h4 className="font-semibold text-sm sm:text-base">Détails Mobile Money</h4>
              <MobileFormField
                label="Pays"
                name="mobile_country"
                type="select"
                value={mobileCountry}
                onChange={(value) => {
                  setMobileCountry(value);
                  const defaultOp = getDefaultOperatorForCountry(value);
                  setMobileOperator(defaultOp);
                }}
                required
                selectOptions={COUNTRIES.map((country) => ({
                  value: country.code,
                  label: country.name,
                }))}
              />
              <MobileFormField
                label="Opérateur"
                name="operator"
                type="select"
                value={mobileOperator}
                onChange={(value) => setMobileOperator(value as any)}
                required
                selectOptions={availableOperators.map((op) => ({
                  value: op.value,
                  label: op.label,
                }))}
              />
              <MobileFormField
                label="Numéro de téléphone"
                name="mobile_phone"
                type="tel"
                value={mobilePhone}
                onChange={setMobilePhone}
                required
                fieldProps={{
                  placeholder: "+226 XX XX XX XX",
                }}
              />
              <MobileFormField
                label="Nom complet"
                name="mobile_full_name"
                type="text"
                value={mobileFullName}
                onChange={setMobileFullName}
                fieldProps={{
                  placeholder: "Nom complet du titulaire",
                }}
              />
            </div>
          )}

          {paymentMethod === 'bank_card' && (
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg">
              <h4 className="font-semibold text-sm sm:text-base">Détails Carte bancaire</h4>
              <MobileFormField
                label="Numéro de carte"
                name="card_number"
                type="text"
                value={cardNumber}
                onChange={setCardNumber}
                required
                fieldProps={{
                  placeholder: "1234 5678 9012 3456",
                  maxLength: 19,
                }}
              />
              <MobileFormField
                label="Nom du titulaire"
                name="cardholder_name"
                type="text"
                value={cardholderName}
                onChange={setCardholderName}
                required
                fieldProps={{
                  placeholder: "Nom complet",
                }}
              />
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <MobileFormField
                  label="Mois d'expiration"
                  name="expiry_month"
                  type="text"
                  value={expiryMonth}
                  onChange={setExpiryMonth}
                  fieldProps={{
                    placeholder: "MM",
                    maxLength: 2,
                  }}
                />
                <MobileFormField
                  label="Année d'expiration"
                  name="expiry_year"
                  type="text"
                  value={expiryYear}
                  onChange={setExpiryYear}
                  fieldProps={{
                    placeholder: "YYYY",
                    maxLength: 4,
                  }}
                />
              </div>
              <MobileFormField
                label="Nom de la banque"
                name="bank_name"
                type="text"
                value={bankName}
                onChange={setBankName}
                fieldProps={{
                  placeholder: "Nom de la banque",
                }}
              />
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg">
              <h4 className="font-semibold text-sm sm:text-base">Détails Virement bancaire</h4>
              <MobileFormField
                label="Numéro de compte"
                name="account_number"
                type="text"
                value={accountNumber}
                onChange={setAccountNumber}
                required
                fieldProps={{
                  placeholder: "Numéro de compte bancaire",
                }}
              />
              <MobileFormField
                label="Nom de la banque"
                name="transfer_bank_name"
                type="text"
                value={transferBankName}
                onChange={setTransferBankName}
                required
                fieldProps={{
                  placeholder: "Nom de la banque",
                }}
              />
              <MobileFormField
                label="Nom du titulaire"
                name="account_holder_name"
                type="text"
                value={accountHolderName}
                onChange={setAccountHolderName}
                required
                fieldProps={{
                  placeholder: "Nom complet du titulaire",
                }}
              />
              <MobileFormField
                label="IBAN"
                name="iban"
                type="text"
                value={iban}
                onChange={setIban}
                fieldProps={{
                  placeholder: "IBAN",
                }}
              />
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_default" className="text-xs sm:text-sm">Méthode par défaut</Label>
                <p className="text-xs text-muted-foreground">
                  Cette méthode sera sélectionnée automatiquement lors des retraits
                </p>
              </div>
              <Switch
                id="is_default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
            {method && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="text-xs sm:text-sm">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Désactiver pour masquer sans supprimer
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <MobileFormField
            label="Notes"
            name="notes"
            type="textarea"
            value={notes}
            onChange={setNotes}
            fieldProps={{
              placeholder: "Informations supplémentaires...",
              rows: 3,
            }}
          />

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isValid() || loading}
              className="w-full sm:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {method ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </div>
  );

  return (
    <>
      {useBottomSheet ? (
        <BottomSheet open={open} onOpenChange={onOpenChange}>
          <BottomSheetContent
            title={method ? 'Modifier la méthode de paiement' : 'Ajouter une méthode de paiement'}
            description="Enregistrez vos informations de paiement pour faciliter vos retraits"
            className="max-h-[90vh] overflow-y-auto"
          >
            {formContent}
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {method ? 'Modifier la méthode de paiement' : 'Ajouter une méthode de paiement'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Enregistrez vos informations de paiement pour faciliter vos retraits
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};







