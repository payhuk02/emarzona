/**
 * Découvertes IA — aligné sur le langage Marketplace (landing-premium / mp-*).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuyerDiscoveryPageLayout } from '@/components/layout/BuyerDiscoveryPageLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Compass,
  Shuffle,
  Package,
  Users,
  GraduationCap,
  Palette,
  Wrench,
  FileText,
} from 'lucide-react';
import { AIProductRecommendations } from '@/components/recommendations/AIProductRecommendations';
import { useStoreContext } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/marketplace-premium.css';

const Discover = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const authenticated = Boolean(user) && !authLoading;
  const { selectedStoreId } = useStoreContext();
  const [activeTab, setActiveTab] = useState('cross-type');

  const discoveryCategories = [
    {
      id: 'cross-type',
      title: 'Multi-types',
      description: 'Explorez différents types de produits',
      icon: Compass,
    },
    {
      id: 'similar-users',
      title: 'Semblables',
      description: 'Ce que les utilisateurs similaires ont aimé',
      icon: Users,
    },
    {
      id: 'random-curated',
      title: 'Sélection',
      description: 'Une sélection curatée des meilleurs produits',
      icon: Sparkles,
    },
  ];

  const productTypes = [
    { type: 'Digital', icon: FileText, description: 'Templates, ebooks, logiciels' },
    { type: 'Physique', icon: Package, description: 'Produits tangibles' },
    { type: 'Services', icon: Wrench, description: 'Prestations, consultations' },
    { type: 'Cours', icon: GraduationCap, description: 'Formations en ligne' },
    { type: 'Art', icon: Palette, description: "Œuvres d'artistes" },
  ];

  return (
    <BuyerDiscoveryPageLayout
      authenticated={authenticated}
      mainAriaLabel="Découvertes IA"
      guestClassName="landing-premium marketplace-premium min-h-screen overflow-x-hidden bg-background"
      shellMainClassName="landing-premium marketplace-premium overflow-x-hidden"
    >
      <div className="container mx-auto max-w-7xl p-3 sm:p-4 lg:p-6 space-y-6 sm:space-y-8">
        <header className="space-y-2">
          <p className="lp-eyebrow">Découverte</p>
          <h1 className="mp-controls__title text-2xl sm:text-3xl md:text-4xl text-[var(--lp-text)]">
            Découvertes personnalisées
          </h1>
          <p className="text-sm sm:text-base text-[var(--lp-text-muted)] max-w-2xl">
            Explorez de nouveaux produits et laissez-vous surprendre par nos recommandations.
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto gap-1 bg-[var(--lp-surface-muted)] p-1 rounded-lg">
            {discoveryCategories.map(category => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center justify-center gap-2 rounded-md py-2.5 data-[state=active]:bg-[var(--lp-surface-elevated)] data-[state=active]:text-[var(--lp-text)]"
                >
                  <IconComponent className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline text-xs sm:text-sm">{category.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="cross-type" className="space-y-6">
            <div className="rounded-lg border border-[var(--lp-border-light)] bg-[var(--lp-surface-elevated)] p-4 sm:p-6">
              <h2 className="mp-controls__title text-lg mb-2 flex items-center gap-2">
                <Compass className="h-5 w-5 text-[var(--lp-blue)]" />
                Découvertes multi-types
              </h2>
              <p className="text-sm text-[var(--lp-text-muted)] mb-6">
                Explorez digital, physique, services, cours et œuvres d&apos;art.
              </p>

              <div className="grid gap-3 grid-cols-2 md:grid-cols-5 mb-6">
                {productTypes.map(item => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.type}
                      className="text-center p-3 rounded-lg border border-[var(--lp-border-light)] bg-[var(--lp-surface)]"
                    >
                      <Icon className="h-5 w-5 mx-auto mb-2 text-[var(--lp-blue)]" />
                      <h4 className="font-medium text-sm text-[var(--lp-text)]">{item.type}</h4>
                      <p className="text-xs text-[var(--lp-text-muted)] mt-1">{item.description}</p>
                    </div>
                  );
                })}
              </div>

              <AIProductRecommendations
                title=""
                limit={16}
                showReasoning={true}
                layout="grid"
                className="border-none bg-transparent shadow-none p-0"
              />
            </div>
          </TabsContent>

          <TabsContent value="similar-users" className="space-y-6">
            <div className="rounded-lg border border-[var(--lp-border-light)] bg-[var(--lp-surface-elevated)] p-4 sm:p-6">
              <h2 className="mp-controls__title text-lg mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-[var(--lp-blue)]" />
                Comme vos semblables
              </h2>
              <p className="text-sm text-[var(--lp-text-muted)] mb-4">
                Produits appréciés par des utilisateurs aux goûts similaires.
              </p>
              <ul className="text-sm text-[var(--lp-text-muted)] space-y-1 mb-6 list-disc pl-5">
                <li>Analyse de votre historique d&apos;achat</li>
                <li>Recherche d&apos;utilisateurs avec des patterns similaires</li>
                <li>Proposition des produits qu&apos;ils ont aimés</li>
              </ul>
              <AIProductRecommendations
                userId={selectedStoreId}
                title=""
                limit={12}
                showReasoning={true}
                layout="grid"
                className="border-none bg-transparent shadow-none p-0"
              />
            </div>
          </TabsContent>

          <TabsContent value="random-curated" className="space-y-6">
            <div className="rounded-lg border border-[var(--lp-border-light)] bg-[var(--lp-surface-elevated)] p-4 sm:p-6 text-center py-12">
              <Shuffle className="h-10 w-10 text-[var(--lp-text-muted)] mx-auto mb-4" />
              <h2 className="mp-controls__title text-lg mb-2">Sélection curatée</h2>
              <p className="text-sm text-[var(--lp-text-muted)] mb-6 max-w-md mx-auto">
                Cette découverte intelligente arrive bientôt. En attendant, explorez le marketplace.
              </p>
              <Button
                onClick={() => navigate('/marketplace')}
                className="lp-btn-primary rounded-lg"
              >
                Explorer le Marketplace
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <section className="mp-hero relative overflow-hidden rounded-lg px-4 py-10 sm:py-12">
          <div className="mp-hero__inner relative z-[1] text-center max-w-2xl mx-auto">
            <h3 className="mp-hero__title text-xl sm:text-2xl text-white mb-2">
              Continuez votre exploration
            </h3>
            <p className="mp-hero__subtitle text-sm mb-6">
              Plus vous explorez, plus les recommandations deviennent précises.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/marketplace')}
                className="lp-btn-primary rounded-lg"
              >
                Marketplace
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/recommendations')}
                className="lp-btn-outline rounded-lg"
              >
                Mes recommandations
              </Button>
            </div>
          </div>
        </section>
      </div>
    </BuyerDiscoveryPageLayout>
  );
};

export default Discover;
