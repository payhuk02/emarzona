/**
 * Composant: WithdrawalRequestDialog
 * Description: Formulaire de demande de retrait
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from '@/components/icons';
import { useResponsiveModal } from '@/hooks/use-responsive-modal';
import { StoreWithdrawalRequestForm, MobileMoneyDetails, BankCardDetails, BankTransferDetails, MobileMoneyOperator } from '@/types/store-withdrawals';
import { formatCurrency } from '@/lib/utils';
import { useStorePaymentMethods } from '@/hooks/useStorePaymentMethods';
import { COUNTRIES } from '@/lib/countries';
import { getMobileMoneyOperatorsForCountry, getDefaultOperatorForCountry } from '@/lib/mobile-money-operators';

interface WithdrawalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  storeId?: string;
  onSubmit: (formData: StoreWithdrawalRequestForm) => Promise<void>;
}

export const WithdrawalRequestDialog = ({
  open,
  onOpenChange,
  availableBalance,
  storeId,
  onSubmit,
}: WithdrawalRequestDialogProps) => {
  const { useBottomSheet } = useResponsiveModal();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'bank_card' | 'bank_transfer'>('mobile_money');
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<string>('new');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Charger les méthodes sauvegardées
  const { paymentMethods } = useStorePaymentMethods({
    storeId,
    paymentMethod,
    activeOnly: true,
  });

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

  const MIN_WITHDRAWAL = 10000;
  const amountNum = parseFloat(amount) || 0;

  // Charger les détails d'une méthode sauvegardée sélectionnée
  useEffect(() => {
    if (selectedSavedMethod && selectedSavedMethod !== 'new') {
      const savedMethod = paymentMethods.find(m => m.id === selectedSavedMethod);
      if (savedMethod) {
        setPaymentMethod(savedMethod.payment_method);
        const details = savedMethod.payment_details;
        
        if (savedMethod.payment_method === 'mobile_money') {
          const mobileDetails = details as MobileMoneyDetails;
          setMobileCountry(mobileDetails.country || 'BF');
          setMobilePhone(mobileDetails.phone || '');
          setMobileOperator(mobileDetails.operator || 'orange_money');
          setMobileFullName(mobileDetails.full_name || '');
        } else if (savedMethod.payment_method === 'bank_card') {
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
      }
    } else {
      // Réinitialiser les champs si on choisit "Nouvelle méthode"
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
  }, [selectedSavedMethod, paymentMethods]);

  // Réinitialiser quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setSelectedSavedMethod('new');
      setAmount('');
      setNotes('');
      setMobileCountry('BF');
      // Sélectionner la méthode par défaut si disponible
      const defaultMethod = paymentMethods.find(m => m.is_default && m.payment_method === paymentMethod);
      if (defaultMethod) {
        setSelectedSavedMethod(defaultMethod.id);
      }
    }
  }, [open, paymentMethods, paymentMethod]);

  const handleSubmit = async () => {
    if (!amount || amountNum < MIN_WITHDRAWAL) {
      return;
    }

    if (amountNum > availableBalance) {
      return;
    }

    let paymentDetails: MobileMoneyDetails | BankCardDetails | BankTransferDetails;

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
        amount: amountNum,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        notes: notes || undefined,
      });
      // Reset form
      setAmount('');
      setNotes('');
      setMobilePhone('');
      setMobileFullName('');
      setCardNumber('');
      setCardholderName('');
      setAccountNumber('');
      setTransferBankName('');
      setAccountHolderName('');
      onOpenChange(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const isValid = () => {
    if (!amount || amountNum < MIN_WITHDRAWAL || amountNum > availableBalance) {
      return false;
    }

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
      {/* Montant */}
      <MobileFormField
        label="Montant (XOF)"
        name="amount"
        type="number"
        value={amount}
        onChange={setAmount}
        required
        description={
          <div className="text-xs sm:text-sm text-muted-foreground space-y-1 mt-1">
            <p>Solde disponible : {formatCurrency(availableBalance)}</p>
            {amountNum > 0 && (
              <>
                <p>Montant demandé : {formatCurrency(amountNum)}</p>
                {amountNum < MIN_WITHDRAWAL && (
                  <p className="text-destructive">
                    Minimum requis : {formatCurrency(MIN_WITHDRAWAL)}
                  </p>
                )}
                {amountNum > availableBalance && (
                  <p className="text-destructive">
                    Montant supérieur au solde disponible
                  </p>
                )}
              </>
            )}
          </div>
        }
        error={
          amountNum > 0 && (amountNum < MIN_WITHDRAWAL || amountNum > availableBalance)
            ? amountNum < MIN_WITHDRAWAL
              ? `Minimum requis : ${formatCurrency(MIN_WITHDRAWAL)}`
              : "Montant supérieur au solde disponible"
            : undefined
        }
        fieldProps={{
          min: MIN_WITHDRAWAL,
          max: availableBalance,
          step: "1000",
          placeholder: `Minimum: ${formatCurrency(MIN_WITHDRAWAL)}`,
        }}
      />

      {/* Méthode de paiement */}
          <MobileFormField
            label="Méthode de paiement"
            name="payment_method"
            type="select"
            value={paymentMethod}
            onChange={(value) => {
              setPaymentMethod(value as any);
              setSelectedSavedMethod('new');
            }}
            required
            selectOptions={[
              { value: 'mobile_money', label: 'Mobile Money' },
              { value: 'bank_card', label: 'Carte bancaire' },
              { value: 'bank_transfer', label: 'Virement bancaire' },
            ]}
          />

          {/* Sélectionner une méthode sauvegardée */}
          {storeId && paymentMethods.length > 0 && (
            <div className="space-y-2">
              <MobileFormField
                label="Utiliser une méthode sauvegardée"
                name="saved_method"
                type="select"
                value={selectedSavedMethod}
                onChange={setSelectedSavedMethod}
                selectOptions={[
                  { value: 'new', label: 'Nouvelle méthode' },
                  ...paymentMethods.map((method) => ({
                    value: method.id,
                    label: `${method.label}${method.is_default ? ' (Par défaut)' : ''}`,
                  })),
                ]}
              />
              {selectedSavedMethod !== 'new' && (
                <p className="text-xs text-muted-foreground">
                  Les détails seront pré-remplis automatiquement
                </p>
              )}
            </div>
          )}

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
                label="Nom complet (optionnel)"
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
                label="IBAN (optionnel)"
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

          {/* Notes */}
          <MobileFormField
            label="Notes (optionnel)"
            name="notes"
            type="textarea"
            value={notes}
            onChange={setNotes}
            fieldProps={{
              placeholder: "Informations supplémentaires...",
              rows: 3,
            }}
          />

          {/* Alertes */}
          {amountNum > 0 && amountNum < MIN_WITHDRAWAL && (
            <Alert variant="destructive" className="text-xs sm:text-sm">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                Le montant minimum de retrait est de {formatCurrency(MIN_WITHDRAWAL)}
              </AlertDescription>
            </Alert>
          )}

          {amountNum > availableBalance && (
            <Alert variant="destructive" className="text-xs sm:text-sm">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                Le montant demandé dépasse votre solde disponible
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
            className="w-full sm:w-auto"
            size="sm"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid() || loading}
            className="w-full sm:w-auto"
            size="sm"
          >
            {loading && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
            <span className="text-xs sm:text-sm">Envoyer la demande</span>
          </Button>
        </div>
    </div>
  );

  return (
    <>
      {useBottomSheet ? (
        <BottomSheet open={open} onOpenChange={onOpenChange}>
          <BottomSheetContent
            title="Demander un retrait"
            description="Retirez vos revenus via Mobile Money ou Carte bancaire"
            className="max-h-[90vh] overflow-y-auto"
          >
            {formContent}
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Demander un retrait</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Retirez vos revenus via Mobile Money ou Carte bancaire
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

