import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  Info,
  Search,
  Share2,
  Users,
} from 'lucide-react';
import type { ServiceCategoryTreeNode } from '@/lib/services/service-categories';
import { isServiceGigFamily } from '@/lib/services/service-form-profiles';
import type { ServiceWizardFormFields } from '@/lib/service-wizard-step-validation';
import {
  resolvePersistedFulfillmentMode,
  resolveServiceFormProfile,
} from '@/lib/service-wizard-step-validation';

export type ServiceWizardStepKey =
  | 'basic'
  | 'scheduling'
  | 'staff'
  | 'pricing'
  | 'affiliation'
  | 'seo'
  | 'payment'
  | 'preview';

export type ServiceWizardStepDef = {
  key: ServiceWizardStepKey;
  title: string;
  description: string;
  icon: LucideIcon;
  optional?: boolean;
  /** Maps to validateServiceWizardStep(step) when defined */
  validationStep?: number;
};

export const SERVICE_WIZARD_VALIDATION_STEP_BY_KEY: Record<
  Exclude<ServiceWizardStepKey, 'preview'>,
  number
> = {
  basic: 1,
  scheduling: 2,
  staff: 3,
  pricing: 4,
  affiliation: 5,
  seo: 6,
  payment: 7,
};

export function serviceWizardShowsStaffStep(
  formData: ServiceWizardFormFields,
  categoryTree?: ServiceCategoryTreeNode[]
): boolean {
  const profile = resolveServiceFormProfile(formData, categoryTree);
  if (isServiceGigFamily(profile)) return false;
  const mode = resolvePersistedFulfillmentMode(formData, categoryTree);
  if (mode === 'project' && !formData.requires_staff) return false;
  return true;
}

function schedulingCopy(mode: NonNullable<ServiceWizardFormFields['fulfillment_mode']>) {
  if (mode === 'project') {
    return {
      title: 'Livraison & lieu',
      description: 'Délai indicatif, lieu de prestation',
    };
  }
  if (mode === 'both') {
    return {
      title: 'Durée, créneaux & lieu',
      description: 'Calendrier RDV et paramètres de livraison',
    };
  }
  return {
    title: 'Durée & Disponibilité',
    description: 'Horaires, créneaux, localisation',
  };
}

function pricingCopy(mode: NonNullable<ServiceWizardFormFields['fulfillment_mode']>) {
  if (mode === 'project' || mode === 'both') {
    return {
      title: 'Formules & tarifs',
      description: 'Packages, extras et brief client',
    };
  }
  return {
    title: 'Tarification & réservation',
    description: 'Prix, acompte, options de réservation',
  };
}

function staffCopy(mode: NonNullable<ServiceWizardFormFields['fulfillment_mode']>) {
  if (mode === 'project') {
    return {
      title: 'Équipe (optionnel)',
      description: 'Staff et ressources si nécessaire',
      optional: true,
    };
  }
  return {
    title: 'Personnel & Ressources',
    description: 'Staff, capacité, équipement',
    optional: false,
  };
}

/** Visible wizard steps adapted to fulfillment mode and category profile. */
export function resolveServiceWizardSteps(
  formData: ServiceWizardFormFields,
  categoryTree?: ServiceCategoryTreeNode[]
): ServiceWizardStepDef[] {
  const mode = resolvePersistedFulfillmentMode(formData, categoryTree);
  const scheduling = schedulingCopy(mode);
  const pricing = pricingCopy(mode);

  const steps: ServiceWizardStepDef[] = [
    {
      key: 'basic',
      title: 'Informations de base',
      description: 'Nom, description, type de service',
      icon: Info,
      validationStep: 1,
    },
    {
      key: 'scheduling',
      title: scheduling.title,
      description: scheduling.description,
      icon: Clock,
      validationStep: 2,
    },
  ];

  if (serviceWizardShowsStaffStep(formData, categoryTree)) {
    const staff = staffCopy(mode);
    steps.push({
      key: 'staff',
      title: staff.title,
      description: staff.description,
      icon: Users,
      optional: staff.optional,
      validationStep: 3,
    });
  }

  steps.push(
    {
      key: 'pricing',
      title: pricing.title,
      description: pricing.description,
      icon: DollarSign,
      validationStep: 4,
    },
    {
      key: 'affiliation',
      title: 'Affiliation',
      description: 'Commission, affiliés (optionnel)',
      icon: Share2,
      optional: true,
      validationStep: 5,
    },
    {
      key: 'seo',
      title: 'SEO & FAQs',
      description: 'Référencement, questions',
      icon: Search,
      optional: true,
      validationStep: 6,
    },
    {
      key: 'payment',
      title: 'Options de Paiement',
      description: 'Complet, partiel, escrow',
      icon: CreditCard,
      optional: true,
      validationStep: 7,
    },
    {
      key: 'preview',
      title: 'Aperçu & Validation',
      description: 'Vérifier et publier',
      icon: Eye,
    }
  );

  return steps;
}

export function findServiceWizardStepIndex(
  steps: ServiceWizardStepDef[],
  key: ServiceWizardStepKey
): number {
  const index = steps.findIndex(step => step.key === key);
  return index >= 0 ? index + 1 : 1;
}

export function findServiceWizardStepIndexByValidationStep(
  steps: ServiceWizardStepDef[],
  validationStep: number
): number {
  const index = steps.findIndex(step => step.validationStep === validationStep);
  return index >= 0 ? index + 1 : 1;
}

/** Subtitle shown in wizard header based on fulfillment mode. */
export function serviceWizardSubtitle(
  formData: ServiceWizardFormFields,
  categoryTree?: ServiceCategoryTreeNode[]
): string {
  const mode = resolvePersistedFulfillmentMode(formData, categoryTree);
  const stepCount = resolveServiceWizardSteps(formData, categoryTree).length;
  if (mode === 'project') {
    return `Configurez votre offre projet en ${stepCount} étapes`;
  }
  if (mode === 'both') {
    return `RDV + formules projet · ${stepCount} étapes`;
  }
  return `Créez un service à la réservation en ${stepCount} étapes`;
}

/** Icon for wizard header — calendar for RDV, briefcase feel via Calendar for all for now */
export function serviceWizardHeaderIcon(): LucideIcon {
  return Calendar;
}
