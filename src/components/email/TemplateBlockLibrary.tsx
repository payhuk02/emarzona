/**
 * Bibliothèque de blocs pour templates email
 * Date: 1er Février 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Layout,
  Image as ImageIcon,
  Type,
  Link2,
  Divide,
  Headphones,
  ShoppingCart,
  Mail,
} from 'lucide-react';

interface EmailBlock {
  id: string;
  name: string;
  description: string;
  category: 'header' | 'content' | 'footer' | 'cta';
  html: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EMAIL_BLOCKS: EmailBlock[] = [
  {
    id: 'header',
    name: 'En-tête',
    description: 'En-tête avec logo et navigation',
    category: 'header',
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
        <tr>
          <td align="center" style="padding: 20px;">
            <img src="{{logo_url}}" alt="{{store_name}}" style="max-width: 200px;" />
          </td>
        </tr>
      </table>
    `,
    icon: Layout,
  },
  {
    id: 'title',
    name: 'Titre',
    description: 'Titre principal',
    category: 'content',
    html: `
      <h1 style="font-size: 24px; font-weight: bold; color: #333333; margin: 20px 0;">
        {{title}}
      </h1>
    `,
    icon: Type,
  },
  {
    id: 'text',
    name: 'Texte',
    description: 'Bloc de texte',
    category: 'content',
    html: `
      <p style="font-size: 16px; line-height: 1.6; color: #666666; margin: 15px 0;">
        {{text_content}}
      </p>
    `,
    icon: Type,
  },
  {
    id: 'image',
    name: 'Image',
    description: 'Image avec légende',
    category: 'content',
    html: `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <img src="{{image_url}}" alt="{{image_alt}}" style="max-width: 100%; height: auto;" />
            {{#if image_caption}}
            <p style="font-size: 14px; color: #999999; margin-top: 10px;">{{image_caption}}</p>
            {{/if}}
          </td>
        </tr>
      </table>
    `,
    icon: ImageIcon,
  },
  {
    id: 'cta-button',
    name: 'Bouton CTA',
    description: 'Bouton d\'appel à l\'action',
    category: 'cta',
    html: `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 30px 0;">
            <a href="{{cta_url}}" style="display: inline-block; padding: 15px 30px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
              {{cta_text}}
            </a>
          </td>
        </tr>
      </table>
    `,
    icon: Link2,
  },
  {
    id: 'divider',
    name: 'Séparateur',
    description: 'Ligne de séparation',
    category: 'content',
    html: `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 20px 0; border-top: 1px solid #e0e0e0;"></td>
        </tr>
      </table>
    `,
    icon: Divide,
  },
  {
    id: 'product-card',
    name: 'Carte Produit',
    description: 'Carte produit avec image et prix',
    category: 'content',
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 5px; overflow: hidden;">
        <tr>
          <td width="150" style="padding: 0;">
            <img src="{{product_image}}" alt="{{product_name}}" style="width: 100%; height: auto; display: block;" />
          </td>
          <td style="padding: 20px; vertical-align: top;">
            <h3 style="margin: 0 0 10px 0; font-size: 18px;">{{product_name}}</h3>
            <p style="margin: 0 0 10px 0; color: #666666;">{{product_description}}</p>
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #007bff;">{{product_price}}</p>
          </td>
        </tr>
      </table>
    `,
    icon: ShoppingCart,
  },
  {
    id: 'footer',
    name: 'Pied de page',
    description: 'Pied de page avec liens',
    category: 'footer',
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; margin-top: 40px;">
        <tr>
          <td align="center" style="padding: 30px 20px;">
            <p style="font-size: 14px; color: #666666; margin: 10px 0;">
              © {{year}} {{store_name}}. Tous droits réservés.
            </p>
            <p style="font-size: 12px; color: #999999; margin: 10px 0;">
              <a href="{{unsubscribe_link}}" style="color: #999999;">Se désabonner</a> | 
              <a href="{{preferences_link}}" style="color: #999999;">Préférences</a>
            </p>
          </td>
        </tr>
      </table>
    `,
    icon: Layout,
  },
];

interface TemplateBlockLibraryProps {
  onInsertBlock: (html: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  header: 'En-tête',
  content: 'Contenu',
  footer: 'Pied de page',
  cta: 'Appel à l\'action',
};

const CATEGORY_COLORS: Record<string, string> = {
  header: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  content: 'bg-green-500/10 text-green-700 dark:text-green-400',
  footer: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  cta: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
};

export const TemplateBlockLibrary = ({ onInsertBlock }: TemplateBlockLibraryProps) => {
  const handleInsert = (block: EmailBlock) => {
    onInsertBlock(block.html);
  };

  const blocksByCategory = EMAIL_BLOCKS.reduce((acc, block) => {
    if (!acc[block.category]) {
      acc[block.category] = [];
    }
    acc[block.category].push(block);
    return acc;
  }, {} as Record<string, EmailBlock[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bibliothèque de Blocs</CardTitle>
        <CardDescription>
          Cliquez sur un bloc pour l&apos;insérer dans votre template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(blocksByCategory).map(([category, blocks]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={CATEGORY_COLORS[category]}>
                {CATEGORY_LABELS[category]}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {blocks.map((block) => {
                const Icon = block.icon;
                return (
                  <Card
                    key={block.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleInsert(block)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1">{block.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {block.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

