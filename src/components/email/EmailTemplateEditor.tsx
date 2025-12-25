/**
 * Composant Éditeur de Templates Email
 * Date: 1er Février 2025
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichTextEditorPro } from '@/components/ui/rich-text-editor-pro';
import { Code2, Eye, Save, X } from 'lucide-react';
import type { EmailTemplate, EmailCategory, ProductType } from '@/types/email';

interface EmailTemplateEditorProps {
  template?: EmailTemplate | null;
  onSave: (template: Partial<EmailTemplate>) => Promise<void>;
  onCancel?: () => void;
  language?: string;
  onChange?: (data: { htmlContent: string; subject: string }) => void;
}

export const EmailTemplateEditor = ({
  template,
  onSave,
  onCancel,
  language = 'fr',
  onChange,
}: EmailTemplateEditorProps) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<EmailCategory>('marketing');
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [showHtmlMode, setShowHtmlMode] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSlug(template.slug);
      setCategory(template.category);
      setProductType(template.product_type);
      setSubject(template.subject[language] || template.subject['fr'] || '');
      setHtmlContent(template.html_content[language] || template.html_content['fr'] || '');
      setTextContent(template.text_content?.[language] || template.text_content?.['fr'] || '');
      setFromEmail(template.from_email);
      setFromName(template.from_name);
      setVariables(template.variables || []);
    } else {
      // Reset form
      setName('');
      setSlug('');
      setCategory('marketing');
      setProductType(null);
      setSubject('');
      setHtmlContent('');
      setTextContent('');
      setFromEmail('');
      setFromName('');
      setVariables([]);
    }
  }, [template, language]);

  // Extraire les variables du contenu HTML
  useEffect(() => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = Array.from(htmlContent.matchAll(variableRegex));
    const extractedVariables = Array.from(new Set(matches.map(m => `{{${m[1]}}}`)));
    setVariables(extractedVariables);

    // Notifier le parent des changements pour la prévisualisation
    if (onChange) {
      onChange({ htmlContent, subject });
    }
  }, [htmlContent, subject, onChange]);

  const handleSave = async () => {
    const templateData: Partial<EmailTemplate> = {
      name,
      slug,
      category,
      product_type: productType,
      subject: { [language]: subject },
      html_content: { [language]: htmlContent },
      text_content: textContent ? { [language]: textContent } : undefined,
      from_email: fromEmail,
      from_name: fromName,
      variables,
    };

    await onSave(templateData);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.activeElement as HTMLTextAreaElement;
    if (textarea && textarea.tagName === 'TEXTAREA') {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      textarea.value = value.substring(0, start) + variable + value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
      textarea.focus();
    }
  };

  const commonVariables = [
    '{{user_name}}',
    '{{user_email}}',
    '{{order_id}}',
    '{{order_total}}',
    '{{product_name}}',
    '{{store_name}}',
    '{{unsubscribe_link}}',
  ];

  return (
    <div className="space-y-4">
      {/* En-tête avec métadonnées */}
      <Card>
        <CardHeader>
          <CardTitle>Métadonnées du Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom du Template *</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ex: Confirmation de commande"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="ex: order-confirmation"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <select
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value as EmailCategory)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px] touch-manipulation cursor-pointer"
              >
                <option value="transactional">Transactionnel</option>
                <option value="marketing">Marketing</option>
                <option value="notification">Notification</option>
              </select>
            </div>
            <div>
              <Label htmlFor="productType">Type de Produit</Label>
              <select
                id="productType"
                value={productType || ''}
                onChange={e => setProductType((e.target.value as ProductType) || null)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px] touch-manipulation cursor-pointer"
              >
                <option value="">Universel</option>
                <option value="digital">Digital</option>
                <option value="physical">Physique</option>
                <option value="service">Service</option>
                <option value="course">Cours</option>
                <option value="artist">Artiste</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromEmail">Email Expéditeur *</Label>
              <Input
                id="fromEmail"
                type="email"
                value={fromEmail}
                onChange={e => setFromEmail(e.target.value)}
                placeholder="noreply@example.com"
              />
            </div>
            <div>
              <Label htmlFor="fromName">Nom Expéditeur *</Label>
              <Input
                id="fromName"
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                placeholder="Nom de votre boutique"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variables disponibles */}
      {variables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Variables détectées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {variables.map((variable, index) => (
                <Badge key={index} variant="outline">
                  {variable}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Éditeur principal */}
      <Tabs defaultValue="html" className="space-y-4">
        <TabsList>
          <TabsTrigger value="html">Contenu HTML</TabsTrigger>
          <TabsTrigger value="text">Version Texte</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
        </TabsList>

        {/* Onglet HTML */}
        <TabsContent value="html" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sujet de l&apos;Email</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Variables disponibles : {commonVariables.join(', ')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHtmlMode(!showHtmlMode)}
                >
                  {showHtmlMode ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" /> Mode Visual
                    </>
                  ) : (
                    <>
                      <Code2 className="h-4 w-4 mr-2" /> Mode HTML
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Sujet de l'email (ex: Confirmation de commande {{order_id}})"
                rows={2}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contenu HTML</CardTitle>
            </CardHeader>
            <CardContent>
              {showHtmlMode ? (
                <Textarea
                  value={htmlContent}
                  onChange={e => setHtmlContent(e.target.value)}
                  placeholder="<html>...</html>"
                  className="font-mono text-xs"
                  rows={20}
                />
              ) : (
                <RichTextEditorPro
                  content={htmlContent}
                  onChange={setHtmlContent}
                  placeholder="Créez votre template email..."
                  showWordCount={true}
                  maxHeight="600px"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Version Texte */}
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Version Texte (Optionnel)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Version texte alternative pour les clients email qui ne supportent pas HTML
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder="Version texte de l'email..."
                rows={15}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Variables */}
        <TabsContent value="variables">
          <Card>
            <CardHeader>
              <CardTitle>Variables Communes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cliquez sur une variable pour l&apos;insérer dans le contenu
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonVariables.map(variable => (
                  <Button
                    key={variable}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable)}
                    className="justify-start"
                  >
                    {variable}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        )}
        <Button onClick={handleSave} disabled={!name || !slug || !fromEmail || !fromName}>
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </div>
    </div>
  );
};
