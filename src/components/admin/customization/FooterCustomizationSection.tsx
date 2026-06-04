/**
 * Personnalisation du pied de page plateforme et boutiques.
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Mail, Store } from 'lucide-react';
import { LandingPageCustomizationSection } from '@/components/admin/customization/LandingPageCustomizationSection';
import { PLATFORM_MARKETING_PAGES } from '@/lib/admin/platformMarketingPagesConfig';
import { STORE_FOOTER_PAGE_ID, STORE_FOOTER_SECTIONS } from '@/lib/admin/storeFooterCustomization';

interface FooterCustomizationSectionProps {
  onChange?: () => void;
}

export const FooterCustomizationSection = ({ onChange }: FooterCustomizationSectionProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Pied de page plateforme</CardTitle>
            <CardDescription>
              Colonnes Produit, Ressources et Entreprise, newsletter, liens légaux et réseaux
              sociaux. Visible sur l&apos;accueil et la marketplace.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/newsletter-subscribers">
              <Mail className="h-4 w-4 mr-2" />
              Voir les inscrits newsletter
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <LandingPageCustomizationSection
            onChange={onChange}
            sectionsFilter={['footer']}
            defaultSection="footer"
            hideCardWrapper
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Pied de page boutiques
          </CardTitle>
          <CardDescription>
            Libellés et liens par défaut pour toutes les boutiques (StoreFooter). Les réseaux
            sociaux restent configurables par boutique ; les pages légales s&apos;affichent selon le
            contenu de chaque vendeur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LandingPageCustomizationSection
            onChange={onChange}
            pageId={STORE_FOOTER_PAGE_ID}
            sectionsConfig={STORE_FOOTER_SECTIONS}
            sectionsFilter={['footer']}
            defaultSection="footer"
            hideCardWrapper
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pages liées au pied de page</CardTitle>
          <CardDescription>
            Contenu HTML de chaque page accessible depuis les liens du footer plateforme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {PLATFORM_MARKETING_PAGES.map(page => (
              <li key={page.slug}>
                <a
                  href={page.route}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  {page.name}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                </a>
                <span className="ml-2 text-xs text-muted-foreground">
                  — onglet Pages → {page.name}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Utilisez l&apos;onglet <strong>Pages</strong> du menu Personnalisation pour éditer le
            contenu de chaque page marketing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
