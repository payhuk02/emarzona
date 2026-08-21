import type { ServiceProductFormData } from '@/types/service-product';

export type ServiceFormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'boolean';

export type ServiceFormFieldOption = { value: string; label: string };

export type ServiceFormField = {
  key: string;
  label: string;
  hint?: string;
  type: ServiceFormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: ServiceFormFieldOption[];
};

export type ServiceFormDefaults = {
  fulfillment_mode: NonNullable<ServiceProductFormData['fulfillment_mode']>;
  service_type: ServiceProductFormData['service_type'];
  location_type: ServiceProductFormData['location_type'];
  duration_minutes: number;
  requires_staff: boolean;
  pricing_type: ServiceProductFormData['pricing_type'];
};

export type ServiceFormProfile = {
  familySlug: string;
  familyLabel: string;
  headline: string;
  description: string;
  defaults: ServiceFormDefaults;
  requireSlots: boolean;
  staffRecommended: boolean;
  durationLabel: string;
  fields: ServiceFormField[];
};

const LANGS: ServiceFormFieldOption[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'pt', label: 'Portugais' },
  { value: 'ar', label: 'Arabe' },
  { value: 'wo', label: 'Wolof' },
  { value: 'other', label: 'Autre' },
];

function select(
  key: string,
  label: string,
  options: ServiceFormFieldOption[],
  extra?: Partial<ServiceFormField>
): ServiceFormField {
  return { key, label, type: 'select', options, ...extra };
}

function text(key: string, label: string, extra?: Partial<ServiceFormField>): ServiceFormField {
  return { key, label, type: 'text', ...extra };
}

function area(key: string, label: string, extra?: Partial<ServiceFormField>): ServiceFormField {
  return { key, label, type: 'textarea', ...extra };
}

function num(key: string, label: string, extra?: Partial<ServiceFormField>): ServiceFormField {
  return { key, label, type: 'number', ...extra };
}

function flags(
  key: string,
  label: string,
  options: ServiceFormFieldOption[],
  extra?: Partial<ServiceFormField>
): ServiceFormField {
  return { key, label, type: 'multiselect', options, ...extra };
}

function toggle(key: string, label: string, extra?: Partial<ServiceFormField>): ServiceFormField {
  return { key, label, type: 'boolean', ...extra };
}

const PROJECT: ServiceFormDefaults = {
  fulfillment_mode: 'project',
  service_type: 'other',
  location_type: 'online',
  duration_minutes: 60,
  requires_staff: false,
  pricing_type: 'fixed',
};

const APPOINTMENT: ServiceFormDefaults = {
  fulfillment_mode: 'appointment',
  service_type: 'appointment',
  location_type: 'on_site',
  duration_minutes: 60,
  requires_staff: true,
  pricing_type: 'fixed',
};

export const SERVICE_FAMILY_LEAVES: Record<string, string[]> = {
  'svc-informatique-technologie': [
    'svc-developpement-web',
    'svc-developpement-mobile',
    'svc-creation-logiciels',
    'svc-maintenance-informatique',
    'svc-cybersecurite',
    'svc-bases-de-donnees',
    'svc-ia-automatisation',
    'svc-support-technique',
    'svc-installation-configuration',
    'svc-hebergement-serveurs',
  ],
  'svc-design-creation': [
    'svc-creation-logos',
    'svc-identite-visuelle',
    'svc-design-graphique',
    'svc-ui-ux-design',
    'svc-design-sites-web',
    'svc-flyers-affiches',
    'svc-presentations-pro',
    'svc-packaging',
    'svc-retouche-photo',
    'svc-illustration',
  ],
  'svc-marketing-communication': [
    'svc-marketing-digital',
    'svc-community-management',
    'svc-gestion-reseaux-sociaux',
    'svc-facebook-instagram-ads',
    'svc-google-ads',
    'svc-tiktok-ads',
    'svc-seo',
    'svc-email-marketing',
    'svc-copywriting-marketing',
    'svc-creation-contenu',
    'svc-strategie-marketing',
    'svc-influence-rp',
  ],
  'svc-formation-coaching': [
    'svc-coaching-professionnel',
    'svc-coaching-business',
    'svc-coaching-marketing',
    'svc-formation-informatique',
    'svc-formation-ecommerce',
    'svc-formation-langues',
    'svc-tutorat',
    'svc-mentorat',
    'svc-orientation-pro',
    'svc-accompagnement-perso',
  ],
  'svc-redaction-traduction': [
    'svc-redaction-web',
    'svc-copywriting-redaction',
    'svc-correction-relecture',
    'svc-traduction',
    'svc-transcription',
    'svc-redaction-cv',
    'svc-lettres-motivation',
    'svc-redaction-rapports',
    'svc-redaction-academique',
  ],
  'svc-photo-video-audiovisuel': [
    'svc-photographie',
    'svc-videographie',
    'svc-montage-video',
    'svc-motion-design',
    'svc-animation-2d-3d',
    'svc-voix-off',
    'svc-production-audiovisuelle',
    'svc-creation-reels',
    'svc-contenu-tiktok',
    'svc-production-evenementielle',
  ],
  'svc-services-entreprises': [
    'svc-creation-entreprise',
    'svc-domiciliation',
    'svc-gestion-administrative',
    'svc-secretariat-externalise',
    'svc-assistance-virtuelle',
    'svc-centres-appels',
    'svc-prospection-commerciale',
    'svc-televiente',
    'svc-gestion-projets',
    'svc-externalisation-services',
  ],
  'svc-maison-services-locaux': [
    'svc-nettoyage',
    'svc-entretien',
    'svc-jardinage',
    'svc-plomberie',
    'svc-electricite',
    'svc-climatisation',
    'svc-peinture',
    'svc-menuiserie',
    'svc-reparation',
    'svc-decoration-interieure',
  ],
  'svc-beaute-bien-etre': [
    'svc-coiffure',
    'svc-maquillage',
    'svc-onglerie',
    'svc-esthetique',
    'svc-massage',
    'svc-spa',
    'svc-coaching-sportif',
    'svc-nutrition-bien-etre',
    'svc-beaute-domicile',
  ],
  'svc-transport-automobile': [
    'svc-livraison',
    'svc-transport-personnes',
    'svc-location-vehicules',
    'svc-chauffeur-prive',
    'svc-entretien-automobile',
    'svc-reparation-automobile',
    'svc-diagnostic-automobile',
    'svc-lavage-automobile',
    'svc-assistance-routiere',
  ],
  'svc-evenementiel': [
    'svc-organisation-evenements',
    'svc-decoration-evenementielle',
    'svc-traiteur',
    'svc-photo-evenementielle',
    'svc-video-evenementielle',
    'svc-dj-animation',
    'svc-location-materiel',
    'svc-sonorisation',
    'svc-invitations-papeterie',
  ],
  'svc-juridique-administratif': [
    'svc-consultation-juridique',
    'svc-redaction-contrats',
    'svc-creation-societes',
    'svc-formalites-administratives',
    'svc-propriete-intellectuelle',
    'svc-droit-affaires',
    'svc-mediation',
    'svc-assistance-juridique',
  ],
};

const FAMILY_PROFILES: Record<
  string,
  Omit<ServiceFormProfile, 'fields'> & { fields: ServiceFormField[] }
> = {
  'svc-informatique-technologie': {
    familySlug: 'svc-informatique-technologie',
    familyLabel: 'Informatique & Technologie',
    headline: 'Prestation digitale sur projet',
    description: 'Précisez le livrable, la stack et le délai. Les créneaux RDV sont optionnels.',
    defaults: PROJECT,
    requireSlots: false,
    staffRecommended: false,
    durationLabel: 'Délai de réalisation estimé',
    fields: [
      select(
        'deliverable',
        'Type de livrable',
        [
          { value: 'website', label: 'Site web' },
          { value: 'app', label: 'Application' },
          { value: 'api', label: 'API / backend' },
          { value: 'maintenance', label: 'Maintenance / support' },
          { value: 'audit', label: 'Audit / conseil' },
          { value: 'other', label: 'Autre' },
        ],
        { required: true }
      ),
      text('stack', 'Stack / outils', { placeholder: 'Ex. React, WordPress, Flutter' }),
      num('delivery_days', 'Délai (jours)', { required: true, placeholder: '14' }),
      num('revisions', 'Nombre de révisions incluses', { placeholder: '2' }),
      area('scope', 'Périmètre', { placeholder: 'Pages, fonctionnalités, intégrations…' }),
    ],
  },
  'svc-design-creation': {
    familySlug: 'svc-design-creation',
    familyLabel: 'Design & Création',
    headline: 'Création graphique sur brief',
    description: 'Indiquez les formats et le nombre de propositions. Mode projet par défaut.',
    defaults: PROJECT,
    requireSlots: false,
    staffRecommended: false,
    durationLabel: 'Délai de livraison estimé',
    fields: [
      flags(
        'formats',
        'Formats livrés',
        [
          { value: 'png', label: 'PNG' },
          { value: 'jpg', label: 'JPG' },
          { value: 'svg', label: 'SVG' },
          { value: 'pdf', label: 'PDF' },
          { value: 'ai', label: 'AI / source' },
          { value: 'figma', label: 'Figma' },
        ],
        { required: true }
      ),
      num('proposals', 'Propositions initiales', { required: true, placeholder: '3' }),
      num('revisions', 'Révisions incluses', { placeholder: '2' }),
      toggle('brand_guidelines', 'Le client fournit une charte graphique'),
    ],
  },
  'svc-marketing-communication': {
    familySlug: 'svc-marketing-communication',
    familyLabel: 'Marketing & Communication',
    headline: 'Campagne ou accompagnement',
    description: 'Canaux, durée et objectifs. Projet ou suivi récurrent.',
    defaults: { ...PROJECT, fulfillment_mode: 'both', service_type: 'consultation' },
    requireSlots: false,
    staffRecommended: false,
    durationLabel: 'Durée d’une session (si RDV)',
    fields: [
      flags(
        'channels',
        'Canaux',
        [
          { value: 'meta', label: 'Meta (Facebook / Instagram)' },
          { value: 'google', label: 'Google' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'email', label: 'Email' },
          { value: 'seo', label: 'SEO' },
          { value: 'content', label: 'Contenu / social' },
        ],
        { required: true }
      ),
      num('campaign_weeks', 'Durée d’accompagnement (semaines)', { placeholder: '4' }),
      text('kpis', 'Objectifs / KPIs', { placeholder: 'Leads, ventes, portée…' }),
    ],
  },
  'svc-formation-coaching': {
    familySlug: 'svc-formation-coaching',
    familyLabel: 'Formation & Coaching',
    headline: 'Séances individuelles ou de groupe',
    description: 'Durée de séance et niveau. Les créneaux permettent la réservation.',
    defaults: {
      ...APPOINTMENT,
      service_type: 'class',
      location_type: 'online',
      duration_minutes: 60,
    },
    requireSlots: true,
    staffRecommended: false,
    durationLabel: 'Durée d’une séance',
    fields: [
      num('session_count', 'Nombre de séances incluses', { required: true, placeholder: '1' }),
      select(
        'level',
        'Niveau',
        [
          { value: 'beginner', label: 'Débutant' },
          { value: 'intermediate', label: 'Intermédiaire' },
          { value: 'advanced', label: 'Avancé' },
          { value: 'all', label: 'Tous niveaux' },
        ],
        { required: true }
      ),
      select('audience', 'Public', [
        { value: 'individual', label: 'Particulier' },
        { value: 'professional', label: 'Professionnel' },
        { value: 'group', label: 'Groupe / entreprise' },
      ]),
    ],
  },
  'svc-redaction-traduction': {
    familySlug: 'svc-redaction-traduction',
    familyLabel: 'Rédaction & Traduction',
    headline: 'Livrable écrit sur projet',
    description: 'Volume, langues et délai. Pas de créneau obligatoire.',
    defaults: PROJECT,
    requireSlots: false,
    staffRecommended: false,
    durationLabel: 'Délai de livraison estimé',
    fields: [
      num('word_count', 'Volume (mots)', { required: true, placeholder: '1000' }),
      select('language', 'Langue principale', LANGS, { required: true }),
      num('deadline_days', 'Délai (jours)', { required: true, placeholder: '5' }),
      text('tone', 'Ton / style', { placeholder: 'Professionnel, SEO, académique…' }),
    ],
  },
  'svc-photo-video-audiovisuel': {
    familySlug: 'svc-photo-video-audiovisuel',
    familyLabel: 'Photo, Vidéo & Audiovisuel',
    headline: 'Tournage ou post-production',
    description: 'Lieu, durée de captation et droits d’usage.',
    defaults: {
      ...APPOINTMENT,
      fulfillment_mode: 'both',
      location_type: 'customer_location',
      duration_minutes: 120,
      requires_staff: false,
    },
    requireSlots: false,
    staffRecommended: false,
    durationLabel: 'Durée de prestation',
    fields: [
      num('shoot_hours', 'Durée de captation (heures)', { placeholder: '2' }),
      select(
        'usage_rights',
        'Droits d’usage',
        [
          { value: 'web', label: 'Web / réseaux' },
          { value: 'commercial', label: 'Commercial' },
          { value: 'unlimited', label: 'Illimité' },
          { value: 'personal', label: 'Usage personnel' },
        ],
        { required: true }
      ),
      text('delivery_format', 'Format de livraison', { placeholder: '4K, Reels, galerie…' }),
    ],
  },
  'svc-services-entreprises': {
    familySlug: 'svc-services-entreprises',
    familyLabel: 'Services aux entreprises',
    headline: 'Accompagnement B2B',
    description: 'Volume horaire et modalité (remote / sur site).',
    defaults: { ...PROJECT, fulfillment_mode: 'both', service_type: 'consultation' },
    requireSlots: false,
    staffRecommended: false,
    durationLabel: 'Durée d’une intervention',
    fields: [
      num('hours_per_month', 'Volume (heures / mois)', { placeholder: '20' }),
      select(
        'engagement',
        'Engagement',
        [
          { value: 'oneshot', label: 'Ponctuel' },
          { value: 'retainer', label: 'Récurrent / forfait' },
          { value: 'project', label: 'Projet borné' },
        ],
        { required: true }
      ),
      toggle('remote', 'Prestation 100 % à distance'),
    ],
  },
  'svc-maison-services-locaux': {
    familySlug: 'svc-maison-services-locaux',
    familyLabel: 'Maison & Services locaux',
    headline: 'Intervention sur site',
    description: 'Adresse du client, urgence et ampleur. Créneaux recommandés.',
    defaults: {
      ...APPOINTMENT,
      location_type: 'customer_location',
      duration_minutes: 90,
    },
    requireSlots: true,
    staffRecommended: true,
    durationLabel: 'Durée d’intervention estimée',
    fields: [
      num('surface_m2', 'Surface (m²)', { placeholder: '80' }),
      select(
        'urgency',
        'Urgence',
        [
          { value: 'standard', label: 'Standard' },
          { value: 'priority', label: 'Prioritaire (48 h)' },
          { value: 'emergency', label: 'Urgence' },
        ],
        { required: true }
      ),
      toggle('materials_included', 'Fournitures incluses'),
      area('access_notes', 'Accès / contraintes', { placeholder: 'Étage, stationnement…' }),
    ],
  },
  'svc-beaute-bien-etre': {
    familySlug: 'svc-beaute-bien-etre',
    familyLabel: 'Beauté & Bien-être',
    headline: 'Rendez-vous en salon ou à domicile',
    description: 'Durée, lieu et personnel. Les créneaux sont requis.',
    defaults: { ...APPOINTMENT, duration_minutes: 45 },
    requireSlots: true,
    staffRecommended: true,
    durationLabel: 'Durée de la séance',
    fields: [
      toggle('at_home', 'Déplacement à domicile possible'),
      select('for_whom', 'Public', [
        { value: 'women', label: 'Femmes' },
        { value: 'men', label: 'Hommes' },
        { value: 'all', label: 'Tous' },
        { value: 'children', label: 'Enfants' },
      ]),
      text('products_used', 'Produits / protocole', { placeholder: 'Optionnel' }),
    ],
  },
  'svc-transport-automobile': {
    familySlug: 'svc-transport-automobile',
    familyLabel: 'Transport & Automobile',
    headline: 'Course, livraison ou atelier',
    description: 'Zone desservie et type de véhicule / intervention.',
    defaults: {
      ...APPOINTMENT,
      location_type: 'customer_location',
      duration_minutes: 60,
    },
    requireSlots: true,
    staffRecommended: true,
    durationLabel: 'Durée estimée',
    fields: [
      text('service_zone', 'Zone desservie', {
        required: true,
        placeholder: 'Ex. Dakar, Abidjan…',
      }),
      select(
        'vehicle_type',
        'Type de véhicule / intervention',
        [
          { value: 'moto', label: 'Moto' },
          { value: 'car', label: 'Voiture' },
          { value: 'van', label: 'Utilitaire' },
          { value: 'workshop', label: 'Atelier / garage' },
          { value: 'other', label: 'Autre' },
        ],
        { required: true }
      ),
      toggle('round_trip', 'Aller-retour inclus'),
    ],
  },
  'svc-evenementiel': {
    familySlug: 'svc-evenementiel',
    familyLabel: 'Événementiel',
    headline: 'Prestation datée',
    description: 'Jauge, type d’événement et lieu. Date précisée au briefing.',
    defaults: {
      ...APPOINTMENT,
      fulfillment_mode: 'both',
      service_type: 'event',
      location_type: 'on_site',
      duration_minutes: 180,
    },
    requireSlots: false,
    staffRecommended: true,
    durationLabel: 'Durée de présence sur site',
    fields: [
      select(
        'event_type',
        'Type d’événement',
        [
          { value: 'wedding', label: 'Mariage' },
          { value: 'corporate', label: 'Entreprise' },
          { value: 'private', label: 'Privé' },
          { value: 'public', label: 'Public / festival' },
          { value: 'other', label: 'Autre' },
        ],
        { required: true }
      ),
      num('guest_count', 'Jauge estimée', { placeholder: '100' }),
      text('venue_city', 'Ville / lieu', { placeholder: 'Optionnel' }),
    ],
  },
  'svc-juridique-administratif': {
    familySlug: 'svc-juridique-administratif',
    familyLabel: 'Juridique & Administratif',
    headline: 'Consultation ou formalités',
    description: 'Domaine du droit et visio. Créneaux pour les consultations.',
    defaults: {
      ...APPOINTMENT,
      service_type: 'consultation',
      location_type: 'online',
      duration_minutes: 45,
      requires_staff: false,
    },
    requireSlots: true,
    staffRecommended: false,
    durationLabel: 'Durée de consultation',
    fields: [
      select(
        'legal_domain',
        'Domaine',
        [
          { value: 'business', label: 'Droit des affaires' },
          { value: 'labor', label: 'Droit du travail' },
          { value: 'civil', label: 'Droit civil' },
          { value: 'ip', label: 'Propriété intellectuelle' },
          { value: 'admin', label: 'Formalités / sociétés' },
          { value: 'other', label: 'Autre' },
        ],
        { required: true }
      ),
      toggle('documents_review', 'Revue de documents incluse'),
      area('prerequisites', 'Pièces à préparer', {
        placeholder: 'Statuts, contrat, pièce d’identité…',
      }),
    ],
  },
};

const LEAF_EXTRA_FIELDS: Record<string, ServiceFormField[]> = {
  'svc-traduction': [
    select('source_lang', 'Langue source', LANGS, { required: true }),
    select('target_lang', 'Langue cible', LANGS, { required: true }),
  ],
  'svc-formation-langues': [select('teaching_lang', 'Langue enseignée', LANGS, { required: true })],
  'svc-developpement-web': [
    select(
      'cms',
      'Plateforme',
      [
        { value: 'custom', label: 'Sur mesure' },
        { value: 'wordpress', label: 'WordPress' },
        { value: 'shopify', label: 'Shopify' },
        { value: 'webflow', label: 'Webflow' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-livraison': [
    select(
      'parcel_type',
      'Type de colis',
      [
        { value: 'document', label: 'Document' },
        { value: 'small', label: 'Petit colis' },
        { value: 'medium', label: 'Moyen' },
        { value: 'fragile', label: 'Fragile' },
      ],
      { required: true }
    ),
  ],
  'svc-coiffure': [
    select(
      'service_focus',
      'Prestation',
      [
        { value: 'cut', label: 'Coupe' },
        { value: 'color', label: 'Coloration' },
        { value: 'braids', label: 'Tresses / locking' },
        { value: 'styling', label: 'Coiffage' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-plomberie': [
    select(
      'issue_type',
      'Type d’intervention',
      [
        { value: 'leak', label: 'Fuite' },
        { value: 'install', label: 'Installation' },
        { value: 'unclog', label: 'Débouchage' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-consultation-juridique': [
    select(
      'format',
      'Format',
      [
        { value: 'visio', label: 'Visio' },
        { value: 'phone', label: 'Téléphone' },
        { value: 'office', label: 'Cabinet' },
      ],
      { required: true }
    ),
  ],
};

const LEAF_TO_FAMILY: Record<string, string> = Object.fromEntries(
  Object.entries(SERVICE_FAMILY_LEAVES).flatMap(([family, leaves]) =>
    leaves.map(leaf => [leaf, family])
  )
);

export function findServiceFamilySlug(
  parentSlug?: string | null,
  leafSlug?: string | null
): string | null {
  if (parentSlug && FAMILY_PROFILES[parentSlug]) return parentSlug;
  if (leafSlug && FAMILY_PROFILES[leafSlug]) return leafSlug;
  if (leafSlug && LEAF_TO_FAMILY[leafSlug]) return LEAF_TO_FAMILY[leafSlug];
  return null;
}

export function getServiceFormProfile(
  parentSlug?: string | null,
  leafSlug?: string | null
): ServiceFormProfile | null {
  const familySlug = findServiceFamilySlug(parentSlug, leafSlug);
  if (!familySlug) return null;
  const base = FAMILY_PROFILES[familySlug];
  if (!base) return null;
  const extras = leafSlug ? (LEAF_EXTRA_FIELDS[leafSlug] ?? []) : [];
  const seen = new Set(extras.map(f => f.key));
  return {
    ...base,
    fields: [...extras, ...base.fields.filter(f => !seen.has(f.key))],
  };
}

export function profileDefaultsPatch(profile: ServiceFormProfile): Partial<ServiceProductFormData> {
  return { ...profile.defaults };
}

export type ServiceCategoryAttributes = Record<string, string | number | boolean | string[]>;

export function validateServiceFormAttributes(
  profile: ServiceFormProfile | null,
  values: ServiceCategoryAttributes | undefined
): string[] {
  if (!profile) return [];
  const attrs = values || {};
  const errors: string[] = [];
  for (const field of profile.fields) {
    if (!field.required) continue;
    const value = attrs[field.key];
    const emptyArray = Array.isArray(value) && value.length === 0;
    if (value === undefined || value === null || value === '' || emptyArray) {
      errors.push(`${field.label} est requis pour ${profile.familyLabel}`);
    }
  }
  return errors;
}

export function formatServiceAttributeValue(
  field: ServiceFormField,
  value: ServiceCategoryAttributes[string] | undefined
): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (Array.isArray(value)) {
    return value.map(v => field.options?.find(o => o.value === v)?.label ?? v).join(', ');
  }
  if (field.options) {
    return field.options.find(o => o.value === String(value))?.label ?? String(value);
  }
  return String(value);
}
