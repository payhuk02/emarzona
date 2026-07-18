/**
 * StoreBasicInfo Component
 * Extracted from StoreForm.tsx to reduce complexity
 * Handles basic store information fields
 *
 * Accessibility: WCAG 2.1 AA compliant with proper ARIA labels and keyboard navigation
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

interface StoreBasicInfoProps {
  name: string;
  slug: string;
  description: string;
  about: string;
  defaultCurrency: string;
  setName: (value: string) => void;
  setSlug: (value: string) => void;
  setDescription: (value: string) => void;
  setAbout: (value: string) => void;
  setDefaultCurrency: (value: string) => void;
  isSubmitting?: boolean;
  fieldTouched?: Record<string, boolean>;
  handleFieldBlur?: (fieldName: string) => void;
  validateField?: (fieldName: string, value: string) => string | null;
}

export const StoreBasicInfo = ({
  name,
  slug,
  description,
  about,
  defaultCurrency,
  setName,
  setSlug,
  setDescription,
  setAbout,
  setDefaultCurrency,
  isSubmitting = false,
  _fieldTouched = {},
  _handleFieldBlur,
  _validateField,
}: StoreBasicInfoProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4" role="group" aria-labelledby="basic-info-heading">
      <h4 id="basic-info-heading" className="sr-only">
        {t('store.form.basicInfo.srHeading')}
      </h4>

      <div className="space-y-2">
        <Label htmlFor="name" className="required-field">
          {t('store.form.basicInfo.storeName')} <span aria-hidden="true">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={isSubmitting}
          required
          aria-required="true"
          aria-describedby="name-description"
          autoComplete="organization"
        />
        <p id="name-description" className="text-xs text-muted-foreground">
          {t('store.form.basicInfo.storeNameHint')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">{t('store.form.basicInfo.slug')}</Label>
        <Input
          id="slug"
          value={slug}
          onChange={e => setSlug(e.target.value)}
          disabled={isSubmitting}
          placeholder={t('store.form.basicInfo.slugPlaceholder')}
          aria-describedby="slug-description"
          autoComplete="off"
        />
        <p id="slug-description" className="text-xs text-muted-foreground">
          {t('store.form.basicInfo.slugHint', { slug })}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('store.form.basicInfo.shortDescription')}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          placeholder={t('store.form.basicInfo.shortDescriptionPlaceholder')}
          maxLength={2000}
          aria-describedby="description-hint"
        />
        <p id="description-hint" className="text-xs text-muted-foreground">
          {t('store.form.basicInfo.charCount', { count: description.length, max: 2000 })}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="about">{t('store.form.basicInfo.about')}</Label>
        <Textarea
          id="about"
          value={about}
          onChange={e => setAbout(e.target.value)}
          disabled={isSubmitting}
          rows={8}
          placeholder={t('store.form.basicInfo.aboutPlaceholder')}
          maxLength={10000}
          aria-describedby="about-hint"
        />
        <p id="about-hint" className="text-xs text-muted-foreground">
          {t('store.form.basicInfo.charCount', { count: about.length, max: 10000 })}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">{t('store.form.basicInfo.defaultCurrency')}</Label>
        <Input
          id="currency"
          value={defaultCurrency}
          onChange={e => setDefaultCurrency(e.target.value)}
          disabled={isSubmitting}
          placeholder={t('store.form.basicInfo.currencyPlaceholder')}
          maxLength={3}
          aria-describedby="currency-description"
          autoComplete="off"
        />
        <p id="currency-description" className="text-xs text-muted-foreground">
          {t('store.form.basicInfo.currencyHint')}
        </p>
      </div>
    </div>
  );
};
