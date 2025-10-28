/**
 * Service Product - SEO & FAQs Configuration
 * Date: 28 octobre 2025
 * 
 * Combinaison de SEO et FAQs dans une seule étape
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, HelpCircle } from 'lucide-react';
import { ProductSEOForm } from '../shared/ProductSEOForm';
import { ProductFAQForm } from '../shared/ProductFAQForm';

interface ServiceSEOAndFAQsProps {
  data: {
    // SEO
    seo?: {
      meta_title?: string;
      meta_description?: string;
      meta_keywords?: string;
      og_title?: string;
      og_description?: string;
      og_image?: string;
    };
    // FAQs
    faqs?: Array<{
      id: string;
      question: string;
      answer: string;
      order: number;
    }>;
  };
  productName: string;
  productDescription?: string;
  productPrice?: number;
  onUpdate: (data: any) => void;
}

export const ServiceSEOAndFAQs = ({
  data,
  productName,
  productDescription,
  productPrice,
  onUpdate,
}: ServiceSEOAndFAQsProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SEO & Questions Fréquentes</CardTitle>
          <CardDescription>
            Optimisez le référencement et répondez aux questions courantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="seo" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                SEO & Métadonnées
              </TabsTrigger>
              <TabsTrigger value="faqs" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Questions Fréquentes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="seo" className="mt-6">
              <ProductSEOForm
                productName={productName}
                productDescription={productDescription}
                productPrice={productPrice}
                data={data.seo || {}}
                onUpdate={(seoData) => onUpdate({ ...data, seo: seoData })}
              />
            </TabsContent>

            <TabsContent value="faqs" className="mt-6">
              <ProductFAQForm
                data={data.faqs || []}
                onUpdate={(faqsData) => onUpdate({ ...data, faqs: faqsData })}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

