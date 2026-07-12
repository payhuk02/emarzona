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
  return (
    <div className="space-y-4" role="group" aria-labelledby="basic-info-heading">
      <h4 id="basic-info-heading" className="sr-only">Informations de base de la boutique</h4>
      
      <div className="space-y-2">
        <Label htmlFor="name" className="required-field">
          Nom de la boutique <span aria-hidden="true">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          required
          aria-required="true"
          aria-describedby="name-description"
          autoComplete="organization"
        />
        <p id="name-description" className="text-xs text-muted-foreground">
          Le nom public de votre boutique (obligatoire)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (URL)</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          disabled={isSubmitting}
          placeholder="ma-boutique"
          aria-describedby="slug-description"
          autoComplete="off"
        />
        <p id="slug-description" className="text-xs text-muted-foreground">
          Utilisé dans l'URL de votre boutique: emarzona.com/{slug}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description courte</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          placeholder="Une brève description de votre boutique"
          maxLength={2000}
          aria-describedby="description-hint"
        />
        <p id="description-hint" className="text-xs text-muted-foreground">
          {description.length} / 2000 caractères
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="about">À propos de votre boutique</Label>
        <Textarea
          id="about"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          disabled={isSubmitting}
          rows={8}
          placeholder="Racontez l'histoire de votre boutique, vos valeurs, votre mission..."
          maxLength={10000}
          aria-describedby="about-hint"
        />
        <p id="about-hint" className="text-xs text-muted-foreground">
          {about.length} / 10000 caractères
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Devise par défaut</Label>
        <Input
          id="currency"
          value={defaultCurrency}
          onChange={(e) => setDefaultCurrency(e.target.value)}
          disabled={isSubmitting}
          placeholder="XOF"
          maxLength={3}
          aria-describedby="currency-description"
          autoComplete="off"
        />
        <p id="currency-description" className="text-xs text-muted-foreground">
          Code ISO 3166-1 alpha-3 (ex: XOF, EUR, USD)
        </p>
      </div>
    </div>
  );
};
