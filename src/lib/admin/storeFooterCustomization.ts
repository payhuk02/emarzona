/**
 * Configuration admin pour le pied de page boutique (storeFooter).
 */

import { Mail } from 'lucide-react';
import fr from '@/i18n/locales/fr.json';
import {
  STORE_FOOTER_LEGAL_LABELS,
  STORE_FOOTER_NAV_LINKS,
} from '@/lib/admin/storeFooterLinksConfig';
import type {
  LandingPremiumElement,
  LandingPremiumSection,
} from '@/lib/admin/landingPremiumCustomization';

export const STORE_FOOTER_PAGE_ID = 'storeFooter';

const sf = fr.storefront.footer;

function text(id: string, label: string, defaultValue: string): LandingPremiumElement {
  return { id, label, type: 'text', defaultValue };
}

function url(
  id: string,
  label: string,
  defaultValue: string,
  description?: string
): LandingPremiumElement {
  return { id, label, type: 'url', defaultValue, description };
}

export const STORE_FOOTER_SECTIONS: LandingPremiumSection[] = [
  {
    id: 'footer',
    name: 'Pied de page boutique',
    icon: Mail,
    elements: [
      text('linksTitle', 'Colonne Liens — titre', sf.linksTitle ?? 'Liens'),
      ...STORE_FOOTER_NAV_LINKS.flatMap(link => [
        text(
          link.labelKey,
          `Lien — ${link.linkKey}`,
          (sf.links as Record<string, string>)?.[link.linkKey] ?? link.linkKey
        ),
        url(
          link.hrefKey,
          `URL — ${link.linkKey}`,
          link.defaultHref,
          'Ancre (#products), chemin interne ou URL externe'
        ),
      ]),
      text('legal', 'Colonne Légales — titre', sf.legal),
      ...STORE_FOOTER_LEGAL_LABELS.map(item =>
        text(
          item.labelKey,
          `Libellé — ${item.legalKey}`,
          (sf as Record<string, string>)[item.labelKey] ?? item.legalKey
        )
      ),
      text('location', 'Colonne Localisation — titre', sf.location),
      text('africa', 'Localisation — Afrique', sf.africa),
      text('french', 'Localisation — Langue', sf.french),
      text('multiCurrency', 'Localisation — Devises', sf.multiCurrency),
      text('followUs', 'Colonne Réseaux — titre', sf.followUs ?? 'Nous suivre'),
      text('poweredBy', 'Mention « Propulsé par »', sf.poweredBy ?? 'Propulsé par'),
      text(
        'copyright',
        'Copyright (utiliser {{year}} et {{storeName}})',
        sf.copyright ?? '© {{year}} {{storeName}}. Tous droits réservés.'
      ),
    ],
  },
];
