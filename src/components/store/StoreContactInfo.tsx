/**
 * StoreContactInfo Component
 * Extracted from StoreForm.tsx to reduce complexity
 * Handles contact information fields
 * 
 * Accessibility: WCAG 2.1 AA compliant with proper ARIA labels and keyboard navigation
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { StoreFieldWithValidation } from './StoreFieldWithValidation';

interface StoreContactInfoProps {
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  salesEmail: string;
  pressEmail: string;
  partnershipEmail: string;
  supportPhone: string;
  salesPhone: string;
  whatsappNumber: string;
  telegramUsername: string;
  setContactEmail: (value: string) => void;
  setContactPhone: (value: string) => void;
  setSupportEmail: (value: string) => void;
  setSalesEmail: (value: string) => void;
  setPressEmail: (value: string) => void;
  setPartnershipEmail: (value: string) => void;
  setSupportPhone: (value: string) => void;
  setSalesPhone: (value: string) => void;
  setWhatsappNumber: (value: string) => void;
  setTelegramUsername: (value: string) => void;
  isSubmitting?: boolean;
  fieldTouched?: Record<string, boolean>;
  handleFieldBlur?: (fieldName: string) => void;
  validateField?: (fieldName: string, value: string) => string | null;
}

export const StoreContactInfo = ({
  contactEmail,
  contactPhone,
  supportEmail,
  salesEmail,
  pressEmail,
  partnershipEmail,
  supportPhone,
  salesPhone,
  whatsappNumber,
  telegramUsername,
  setContactEmail,
  setContactPhone,
  setSupportEmail,
  setSalesEmail,
  setPressEmail,
  setPartnershipEmail,
  setSupportPhone,
  setSalesPhone,
  setWhatsappNumber,
  setTelegramUsername,
  isSubmitting = false,
  fieldTouched = {},
  handleFieldBlur,
  validateField,
}: StoreContactInfoProps) => {
  return (
    <div className="space-y-4" role="group" aria-labelledby="contact-info-heading">
      <h4 id="contact-info-heading" className="text-sm font-semibold">Contact principal</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StoreFieldWithValidation
          id="contact-email"
          label="Email de contact"
          type="email"
          value={contactEmail}
          onChange={setContactEmail}
          onBlur={() => handleFieldBlur?.('contact_email')}
          placeholder="contact@votreboutique.com"
          disabled={isSubmitting}
          touched={fieldTouched.contact_email}
          validationFn={(val) => validateField?.('contact_email', val)}
          hint="Email principal pour les contacts clients"
          autoComplete="email"
        />
        <StoreFieldWithValidation
          id="contact-phone"
          label="Téléphone de contact"
          type="tel"
          value={contactPhone}
          onChange={setContactPhone}
          onBlur={() => handleFieldBlur?.('contact_phone')}
          placeholder="+226 XX XX XX XX"
          disabled={isSubmitting}
          touched={fieldTouched.contact_phone}
          validationFn={(val) => validateField?.('contact_phone', val)}
          hint="Format international recommandé"
          autoComplete="tel"
        />
      </div>

      <h4 className="text-sm font-semibold border-t pt-4">Contacts supplémentaires</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StoreFieldWithValidation
          id="support-email"
          label="Email support"
          type="email"
          value={supportEmail}
          onChange={setSupportEmail}
          onBlur={() => handleFieldBlur?.('support_email')}
          placeholder="support@votreboutique.com"
          disabled={isSubmitting}
          touched={fieldTouched.support_email}
          validationFn={(val) => validateField?.('support_email', val)}
          hint="Email dédié au support client"
          autoComplete="email"
        />
        <StoreFieldWithValidation
          id="sales-email"
          label="Email ventes"
          type="email"
          value={salesEmail}
          onChange={setSalesEmail}
          onBlur={() => handleFieldBlur?.('sales_email')}
          placeholder="ventes@votreboutique.com"
          disabled={isSubmitting}
          touched={fieldTouched.sales_email}
          validationFn={(val) => validateField?.('sales_email', val)}
          hint="Email dédié aux ventes"
          autoComplete="email"
        />
        <StoreFieldWithValidation
          id="press-email"
          label="Email presse"
          type="email"
          value={pressEmail}
          onChange={setPressEmail}
          onBlur={() => handleFieldBlur?.('press_email')}
          placeholder="presse@votreboutique.com"
          disabled={isSubmitting}
          touched={fieldTouched.press_email}
          validationFn={(val) => validateField?.('press_email', val)}
          hint="Email pour les relations presse"
          autoComplete="email"
        />
        <StoreFieldWithValidation
          id="partnership-email"
          label="Email partenariats"
          type="email"
          value={partnershipEmail}
          onChange={setPartnershipEmail}
          onBlur={() => handleFieldBlur?.('partnership_email')}
          placeholder="partenariats@votreboutique.com"
          disabled={isSubmitting}
          touched={fieldTouched.partnership_email}
          validationFn={(val) => validateField?.('partnership_email', val)}
          hint="Email pour les partenariats"
          autoComplete="email"
        />
        <div className="space-y-2">
          <Label htmlFor="support-phone">Téléphone support</Label>
          <Input
            id="support-phone"
            type="tel"
            value={supportPhone}
            onChange={(e) => setSupportPhone(e.target.value)}
            placeholder="+226 XX XX XX XX"
            disabled={isSubmitting}
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sales-phone">Téléphone ventes</Label>
          <Input
            id="sales-phone"
            type="tel"
            value={salesPhone}
            onChange={(e) => setSalesPhone(e.target.value)}
            placeholder="+226 XX XX XX XX"
            disabled={isSubmitting}
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp-number">WhatsApp</Label>
          <Input
            id="whatsapp-number"
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+226 XX XX XX XX"
            disabled={isSubmitting}
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telegram-username">Telegram</Label>
          <Input
            id="telegram-username"
            type="text"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
            placeholder="@username"
            disabled={isSubmitting}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
};
