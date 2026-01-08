/**
 * Section Gestion du Contenu
 * Textes, emails, notifications - Personnalisation complète
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Mail, Bell, Search, Save, RefreshCw, Edit, X } from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { useEmailTemplates } from '@/hooks/useEmail';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/hooks/useI18n';
import type { EmailTemplate } from '@/types/email';

interface ContentManagementSectionProps {
  onChange?: () => void;
}

// Textes clés importants de la plateforme (étendu)
const KEY_TEXTS = [
  // Marketplace
  { key: 'marketplace.hero.title', label: 'Titre principal marketplace', category: 'Marketplace' },
  { key: 'marketplace.hero.subtitle', label: 'Sous-titre marketplace', category: 'Marketplace' },
  { key: 'marketplace.hero.tagline', label: 'Slogan marketplace', category: 'Marketplace' },
  { key: 'marketplace.title', label: 'Titre marketplace', category: 'Marketplace' },
  { key: 'marketplace.subtitle', label: 'Sous-titre marketplace', category: 'Marketplace' },
  { key: 'marketplace.searchPlaceholder', label: 'Placeholder recherche', category: 'Marketplace' },
  
  // Dashboard
  { key: 'dashboard.welcome', label: 'Message de bienvenue dashboard', category: 'Dashboard' },
  { key: 'dashboard.stats.totalSales', label: 'Total ventes', category: 'Dashboard' },
  { key: 'dashboard.stats.totalOrders', label: 'Total commandes', category: 'Dashboard' },
  { key: 'dashboard.stats.totalProducts', label: 'Total produits', category: 'Dashboard' },
  { key: 'dashboard.stats.totalCustomers', label: 'Total clients', category: 'Dashboard' },
  
  // Navigation
  { key: 'nav.home', label: 'Accueil', category: 'Navigation' },
  { key: 'nav.marketplace', label: 'Marketplace', category: 'Navigation' },
  { key: 'nav.dashboard', label: 'Tableau de bord', category: 'Navigation' },
  { key: 'nav.products', label: 'Produits', category: 'Navigation' },
  { key: 'nav.orders', label: 'Commandes', category: 'Navigation' },
  { key: 'nav.settings', label: 'Paramètres', category: 'Navigation' },
  
  // Auth
  { key: 'auth.welcome', label: 'Bienvenue', category: 'Authentification' },
  { key: 'auth.welcomeSubtitle', label: 'Sous-titre bienvenue', category: 'Authentification' },
  { key: 'auth.login.title', label: 'Titre connexion', category: 'Authentification' },
  { key: 'auth.login.subtitle', label: 'Sous-titre connexion', category: 'Authentification' },
  { key: 'auth.signup.title', label: 'Titre inscription', category: 'Authentification' },
  { key: 'auth.signup.subtitle', label: 'Sous-titre inscription', category: 'Authentification' },
  
  // Footer
  { key: 'footer.about', label: 'À propos (footer)', category: 'Footer' },
  { key: 'footer.contact', label: 'Contact (footer)', category: 'Footer' },
  { key: 'footer.terms', label: 'Conditions d\'utilisation', category: 'Footer' },
  { key: 'footer.privacy', label: 'Confidentialité', category: 'Footer' },
  { key: 'footer.help', label: 'Aide', category: 'Footer' },
  
  // Erreurs
  { key: 'errors.generic', label: 'Message d\'erreur générique', category: 'Erreurs' },
  { key: 'errors.notFound', label: 'Page non trouvée', category: 'Erreurs' },
  { key: 'errors.network', label: 'Erreur réseau', category: 'Erreurs' },
  { key: 'errors.unauthorized', label: 'Non autorisé', category: 'Erreurs' },
  { key: 'errors.serverError', label: 'Erreur serveur', category: 'Erreurs' },
  
  // Paramètres
  { key: 'settings.title', label: 'Titre paramètres', category: 'Paramètres' },
  { key: 'settings.profile', label: 'Profil', category: 'Paramètres' },
  { key: 'settings.store', label: 'Boutique', category: 'Paramètres' },
  { key: 'settings.payment', label: 'Paiement', category: 'Paramètres' },
  { key: 'settings.notifications', label: 'Notifications', category: 'Paramètres' },
  { key: 'settings.security', label: 'Sécurité', category: 'Paramètres' },
  
  // Notifications
  { key: 'notifications.title', label: 'Titre notifications', category: 'Notifications' },
  { key: 'notifications.markAllRead', label: 'Tout marquer comme lu', category: 'Notifications' },
  { key: 'notifications.noNotifications', label: 'Aucune notification', category: 'Notifications' },
  
  // Common
  { key: 'common.welcome', label: 'Bienvenue', category: 'Commun' },
  { key: 'common.loading', label: 'Chargement...', category: 'Commun' },
  { key: 'common.error', label: 'Erreur', category: 'Commun' },
  { key: 'common.success', label: 'Succès', category: 'Commun' },
  { key: 'common.save', label: 'Enregistrer', category: 'Commun' },
  { key: 'common.cancel', label: 'Annuler', category: 'Commun' },
  { key: 'common.delete', label: 'Supprimer', category: 'Commun' },
  { key: 'common.edit', label: 'Modifier', category: 'Commun' },
  { key: 'common.search', label: 'Rechercher', category: 'Commun' },
  { key: 'common.filter', label: 'Filtrer', category: 'Commun' },
  { key: 'common.close', label: 'Fermer', category: 'Commun' },
  { key: 'common.back', label: 'Retour', category: 'Commun' },
  { key: 'common.next', label: 'Suivant', category: 'Commun' },
  { key: 'common.previous', label: 'Précédent', category: 'Commun' },
  
  // Products
  { key: 'products.title', label: 'Titre produits', category: 'Produits' },
  { key: 'products.create', label: 'Créer produit', category: 'Produits' },
  { key: 'products.edit', label: 'Modifier produit', category: 'Produits' },
  { key: 'products.delete', label: 'Supprimer produit', category: 'Produits' },
  { key: 'products.noProducts', label: 'Aucun produit', category: 'Produits' },
  { key: 'products.addToCart', label: 'Ajouter au panier', category: 'Produits' },
  { key: 'products.price', label: 'Prix', category: 'Produits' },
  { key: 'products.stock', label: 'Stock', category: 'Produits' },
  
  // Orders
  { key: 'orders.title', label: 'Titre commandes', category: 'Commandes' },
  { key: 'orders.status', label: 'Statut commande', category: 'Commandes' },
  { key: 'orders.total', label: 'Total commande', category: 'Commandes' },
  { key: 'orders.date', label: 'Date commande', category: 'Commandes' },
  { key: 'orders.view', label: 'Voir commande', category: 'Commandes' },
  { key: 'orders.cancel', label: 'Annuler commande', category: 'Commandes' },
  
  // Cart
  { key: 'cart.title', label: 'Titre panier', category: 'Panier' },
  { key: 'cart.empty', label: 'Panier vide', category: 'Panier' },
  { key: 'cart.checkout', label: 'Passer commande', category: 'Panier' },
  { key: 'cart.remove', label: 'Retirer du panier', category: 'Panier' },
  { key: 'cart.total', label: 'Total panier', category: 'Panier' },
  
  // Storefront
  { key: 'storefront.title', label: 'Titre boutique', category: 'Boutique' },
  { key: 'storefront.description', label: 'Description boutique', category: 'Boutique' },
  { key: 'storefront.products', label: 'Produits boutique', category: 'Boutique' },
  { key: 'storefront.reviews', label: 'Avis boutique', category: 'Boutique' },
  { key: 'storefront.contact', label: 'Contacter boutique', category: 'Boutique' },
];

export const ContentManagementSection = ({ onChange }: ContentManagementSectionProps) => {
  const { customizationData, save } = usePlatformCustomization();
  const { toast } = useToast();
  const { currentLanguage } = useI18n();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateContent, setTemplateContent] = useState<{ subject: string; html: string }>({ subject: '', html: '' });
  
  const { data: templates, isLoading: templatesLoading } = useEmailTemplates();

  useEffect(() => {
    if (customizationData?.content?.texts) {
      setCustomTexts(customizationData.content.texts);
    }
  }, [customizationData]);

  useEffect(() => {
    if (templates) {
      setEmailTemplates(templates);
    }
  }, [templates]);

  useEffect(() => {
    if (editingTemplate) {
      // Utiliser la langue actuelle depuis i18n
      const currentLang = currentLanguage || 'fr';
      setTemplateContent({
        subject: editingTemplate.subject[currentLang] || '',
        html: editingTemplate.html_content[currentLang] || '',
      });
    }
  }, [editingTemplate, currentLanguage]);

  const categories = useMemo(() => 
    Array.from(new Set(KEY_TEXTS.map(t => t.category))), 
    []
  );

  /**
   * Textes filtrés selon la recherche et la catégorie sélectionnée
   * Mémorisé pour éviter les recalculs à chaque render
   */
  const filteredTexts = useMemo(() => 
    KEY_TEXTS.filter(text => {
      const matchesSearch = text.label.toLowerCase().includes(searchText.toLowerCase()) ||
                           text.key.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || text.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }),
    [searchText, selectedCategory]
  );

  const handleTextChange = useCallback((key: string, value: string) => {
    setCustomTexts(prev => {
      const updated = { ...prev, [key]: value };
      // Utiliser les données à jour du state local
      save('content', {
        ...customizationData?.content,
        texts: updated,
      }).catch((error) => {
        logger.error('Error saving text customization', { error, key, value });
      });
      return updated;
    });
    if (onChange) onChange();
  }, [customizationData, save, onChange]);

  /**
   * Met à jour un template d'email dans la base de données et l'état local
   * 
   * @param updatedTemplate - Template d'email avec les modifications
   * @returns Promise qui se résout avec le template mis à jour
   * @throws Error si la mise à jour échoue
   */
  const updateTemplate = useCallback(async (updatedTemplate: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject: updatedTemplate.subject,
          html_content: updatedTemplate.html_content,
          is_active: updatedTemplate.is_active,
          is_default: updatedTemplate.is_default,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedTemplate.id);

      if (error) throw error;

      // Mettre à jour l'état local
      const updated = { ...updatedTemplate };
      setEmailTemplates(prev => 
        prev.map(t => t.id === updatedTemplate.id ? updated : t)
      );
      setEditingTemplate(updated);
      setSelectedTemplate(updated);
      
      return updated;
    } catch (error) {
      logger.error('Error updating template', { error, templateId: updatedTemplate.id });
      throw error;
    }
  }, []);

  const resetText = useCallback((key: string) => {
    setCustomTexts(prev => {
      const newTexts = { ...prev };
      delete newTexts[key];
      save('content', {
        ...customizationData?.content,
        texts: newTexts,
      }).catch((error) => {
        logger.error('Error resetting text customization', { error, key });
      });
      return newTexts;
    });
  }, [customizationData, save]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="texts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-2">
          <TabsTrigger value="texts" className="text-xs sm:text-sm">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Textes ({KEY_TEXTS.length})</span>
            <span className="sm:hidden">Textes</span>
          </TabsTrigger>
          <TabsTrigger value="emails" className="text-xs sm:text-sm">
            <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Notif</span>
          </TabsTrigger>
        </TabsList>

        {/* Textes */}
        <TabsContent value="texts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Textes de la plateforme</CardTitle>
              <CardDescription>
                Personnalisez les textes affichés sur la plateforme. Les modifications sont appliquées en temps réel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recherche et filtres - Responsive */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un texte..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                    className="text-xs sm:text-sm"
                  >
                    Tous
                  </Button>
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className="text-xs sm:text-sm"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Liste des textes */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredTexts.map((text) => {
                  const currentValue = customTexts[text.key] || text.key;
                  const isCustom = !!customTexts[text.key];

                  return (
                    <Card key={text.key} className={isCustom ? 'border-primary' : ''}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Label className="text-sm font-semibold">{text.label}</Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Clé: <code className="bg-muted px-1 rounded">{text.key}</code>
                              </p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {text.category}
                              </Badge>
                            </div>
                            {isCustom && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resetText(text.key)}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Réinitialiser
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              Valeur actuelle:
                            </Label>
                            <Textarea
                              value={currentValue}
                              onChange={(e) => handleTextChange(text.key, e.target.value)}
                              rows={2}
                              className="font-medium"
                            />
                            {!isCustom && (
                              <p className="text-xs text-muted-foreground">
                                Valeur par défaut: {text.key}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emails */}
        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Modèles d'emails</CardTitle>
                  <CardDescription>
                    Personnalisez les emails envoyés aux utilisateurs. Les templates sont multilingues et supportent des variables dynamiques.
                  </CardDescription>
                </div>
                {templatesLoading && (
                  <Badge variant="outline">Chargement...</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : emailTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun template d'email trouvé.</p>
                  <p className="text-sm mt-2">Les templates seront créés automatiquement lors de leur première utilisation.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Liste des templates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {emailTemplates.map((template) => (
                      <Card 
                        key={template.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => {
                          setSelectedTemplate(template);
                          setEditingTemplate(template);
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {template.category}
                                </Badge>
                                {template.product_type && (
                                  <Badge variant="secondary" className="text-xs">
                                    {template.product_type}
                                  </Badge>
                                )}
                                {template.is_default && (
                                  <Badge variant="default" className="text-xs">
                                    Par défaut
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTemplate(template);
                                setEditingTemplate(template);
                              }}
                              aria-label={`Modifier le template ${template.name || template.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.subject['fr'] || template.subject['en'] || 'Aucun sujet'}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{template.sent_count} envoyés</span>
                              <span>{template.is_active ? 'Actif' : 'Inactif'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Éditeur de template */}
                  {editingTemplate && (
                    <Card className="border-primary">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Éditer: {editingTemplate.name}</CardTitle>
                            <CardDescription>
                              Slug: <code className="bg-muted px-1 rounded">{editingTemplate.slug}</code>
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTemplate(null);
                              setSelectedTemplate(null);
                            }}
                            aria-label="Fermer l'éditeur de template"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Sujet (FR)</Label>
                            <Input
                              value={templateContent.subject}
                              onChange={(e) => setTemplateContent(prev => ({ ...prev, subject: e.target.value }))}
                              placeholder="Sujet de l'email en français"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Statut</Label>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingTemplate.is_active}
                                  onChange={async (e) => {
                                    try {
                                      const updated = { ...editingTemplate, is_active: e.target.checked };
                                      await updateTemplate(updated);
                                    } catch (_error) {
                                      toast({
                                        title: 'Erreur',
                                        description: 'Impossible de mettre à jour le statut.',
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                  className="rounded"
                                />
                                <Label className="text-sm">Actif</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingTemplate.is_default}
                                  onChange={async (e) => {
                                    try {
                                      const updated = { ...editingTemplate, is_default: e.target.checked };
                                      await updateTemplate(updated);
                                    } catch (_error) {
                                      toast({
                                        title: 'Erreur',
                                        description: 'Impossible de mettre à jour le statut.',
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                  className="rounded"
                                />
                                <Label className="text-sm">Par défaut</Label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Contenu HTML (FR)</Label>
                          <Textarea
                            value={templateContent.html}
                            onChange={(e) => setTemplateContent(prev => ({ ...prev, html: e.target.value }))}
                            placeholder="Contenu HTML de l'email en français"
                            rows={12}
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Variables disponibles: {editingTemplate.variables.join(', ') || 'Aucune'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={async () => {
                              try {
                                const updatedSubject = { ...editingTemplate.subject, fr: templateContent.subject };
                                const updatedHtml = { ...editingTemplate.html_content, fr: templateContent.html };
                                const updated = {
                                  ...editingTemplate,
                                  subject: updatedSubject,
                                  html_content: updatedHtml,
                                };
                                await updateTemplate(updated);
                                toast({
                                  title: 'Template mis à jour',
                                  description: 'Le template a été sauvegardé avec succès.',
                                });
                              } catch (_error) {
                                toast({
                                  title: 'Erreur',
                                  description: 'Impossible de sauvegarder le template.',
                                  variant: 'destructive',
                                });
                              }
                            }}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Enregistrer
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingTemplate(null);
                              setSelectedTemplate(null);
                            }}
                          >
                            Annuler
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages de notification</CardTitle>
              <CardDescription>
                Personnalisez les messages de notification affichés aux utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Notification de nouvelle commande</Label>
                  <Input
                    placeholder="Vous avez reçu une nouvelle commande"
                    defaultValue={customizationData?.content?.notifications?.newOrder || ''}
                    onChange={(e) => {
                      save('content', {
                        ...customizationData?.content,
                        notifications: {
                          ...customizationData?.content?.notifications,
                          newOrder: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notification de paiement reçu</Label>
                  <Input
                    placeholder="Paiement reçu avec succès"
                    defaultValue={customizationData?.content?.notifications?.paymentReceived || ''}
                    onChange={(e) => {
                      save('content', {
                        ...customizationData?.content,
                        notifications: {
                          ...customizationData?.content?.notifications,
                          paymentReceived: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notification de nouveau message</Label>
                  <Input
                    placeholder="Vous avez reçu un nouveau message"
                    defaultValue={customizationData?.content?.notifications?.newMessage || ''}
                    onChange={(e) => {
                      save('content', {
                        ...customizationData?.content,
                        notifications: {
                          ...customizationData?.content?.notifications,
                          newMessage: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};






