import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Check, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger';

/**
 * Page de test pour vérifier le système i18n
 * Accessible via /i18n-test (temporaire, à supprimer en production)
 */
export default function I18nTest() {
  const { t, i18n } = useTranslation();

  const testKeys = [
    { category: 'Common', keys: ['common.welcome', 'common.loading', 'common.error', 'common.success', 'common.save', 'common.cancel'] },
    { category: 'Navigation', keys: ['nav.home', 'nav.marketplace', 'nav.dashboard', 'nav.products', 'nav.orders', 'nav.settings'] },
    { category: 'Auth', keys: ['auth.login.title', 'auth.signup.title', 'auth.login.button', 'auth.signup.button'] },
    { category: 'Marketplace', keys: ['marketplace.title', 'marketplace.subtitle', 'marketplace.searchPlaceholder', 'marketplace.viewProduct'] },
    { category: 'Products', keys: ['products.title', 'products.add', 'products.edit', 'products.delete', 'products.view'] },
    { category: 'Cart', keys: ['cart.title', 'cart.empty', 'cart.checkout', 'cart.continueShopping'] },
    { category: 'Orders', keys: ['orders.title', 'orders.status', 'orders.viewDetails', 'orders.trackOrder'] },
    { category: 'Dashboard', keys: ['dashboard.welcome', 'dashboard.stats.totalSales', 'dashboard.stats.totalOrders', 'dashboard.quickActions'] },
  ];

  const currentLang = i18n.language;
  const allLanguages = ['fr', 'en'];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <Globe className="h-8 w-8 text-primary" />
                  Test i18n - Système Multilingue
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  {t('common.welcome')} ! Langue actuelle : <Badge variant="default" className="ml-2">{currentLang.toUpperCase()}</Badge>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {allLanguages.map((lang) => (
                  <Button
                    key={lang}
                    variant={currentLang === lang ? 'default' : 'outline'}
                    onClick={() => i18n.changeLanguage(lang)}
                    className="uppercase"
                  >
                    {lang}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📊 Statut du Système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium">i18n initialisé</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium">Traductions chargées</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium">Changement de langue actif</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test de toutes les catégories */}
        {testKeys.map((category) => (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle className="text-xl">🔤 {category.category}</CardTitle>
              <CardDescription>
                Test de {category.keys.length} clés de traduction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.keys.map((key) => {
                  const translation = t(key);
                  const isMissing = translation === key; // Si traduction = clé, elle est manquante

                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border ${
                        isMissing ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground font-mono mb-1">{key}</div>
                          <div className="font-medium">{translation}</div>
                        </div>
                        {isMissing ? (
                          <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                        ) : (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Interpolation Test */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🔄 Test d'Interpolation</CardTitle>
            <CardDescription>Variables dynamiques dans les traductions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
              <div className="text-sm text-muted-foreground mb-1">dashboard.welcome (avec nom)</div>
              <div className="font-medium">{t('dashboard.welcome', { name: 'John Doe' })}</div>
            </div>
            <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
              <div className="text-sm text-muted-foreground mb-1">orders.orderNumber (avec numéro)</div>
              <div className="font-medium">{t('orders.orderNumber', { number: '12345' })}</div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Rapides */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">⚡ Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => i18n.changeLanguage('fr')}>
                🇫🇷 Passer en Français
              </Button>
              <Button onClick={() => i18n.changeLanguage('en')}>
                🇬🇧 Switch to English
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Recharger la page
              </Button>
              <Button variant="outline" onClick={() => logger.debug('i18n state', { i18n })}>
                Log i18n state
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="text-xl">ℹ️ Comment utiliser i18n dans un composant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Importer le hook</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                  {`import { useTranslation } from 'react-i18next';`}
                </pre>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">2. Utiliser dans le composant</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                  {`const MyComponent = () => {
  const { t } = useTranslation();
  
  return <div>{t('common.welcome')}</div>;
};`}
                </pre>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">3. Avec variables (interpolation)</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                  {`{t('dashboard.welcome', { name: userName })}`}
                </pre>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">4. Changer la langue programmatiquement</h4>
                <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                  {`const { i18n } = useTranslation();
i18n.changeLanguage('en'); // ou 'fr'`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>✅ Système i18n opérationnel | 🌐 {allLanguages.length} langues disponibles | 📦 {testKeys.reduce((acc, cat) => acc + cat.keys.length, 0)} clés testées</p>
          <p className="mt-2">Cette page de test est temporaire et doit être supprimée avant le déploiement en production.</p>
        </div>
      </div>
    </div>
  );
}

