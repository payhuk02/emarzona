/**
 * Digital Product Detail Page - Professional
 * Date: 28 octobre 2025
 * 
 * Page complète de détail pour produits digitaux
 * Inspiré de Gumroad, Stripe, Lemonsqueezy
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  Shield, 
  Star, 
  Package,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Monitor,
  Globe,
  HardDrive,
  Clock,
  Lock,
  Unlock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DigitalDownloadButton } from '@/components/digital/DigitalDownloadButton';
import { DigitalLicenseCard } from '@/components/digital/DigitalLicenseCard';
import { useDigitalProduct } from '@/hooks/digital/useDigitalProducts';
import { useHasDownloadAccess } from '@/hooks/digital/useDigitalProducts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface DigitalProductDetailParams {
  productId: string;
}

/**
 * Page de détail d'un produit digital
 */
export default function DigitalProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch digital product with all relations
  const { data: digitalProduct, isLoading, error } = useDigitalProduct(productId || '');
  
  // Check if user has purchased this product
  const { data: hasAccess } = useHasDownloadAccess(productId || '');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="animate-pulse space-y-8">
          <div className="h-96 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !digitalProduct) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Produit non trouvé</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const product = digitalProduct.product;
  const files = digitalProduct.files || [];

  // Parse FAQs if exists
  const faqs = product.faqs ? (Array.isArray(product.faqs) ? product.faqs : []) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Product Image */}
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* File Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Fichiers inclus ({files.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.file_type} • {file.file_size_mb.toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      {file.is_main && (
                        <Badge variant="secondary" className="text-xs">
                          Principal
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right: Product Info & Actions */}
            <div className="space-y-6">
              {/* Title & Price */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold">{product.name}</h1>
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{product.short_description}</p>

                {/* Price */}
                <div className="flex items-baseline gap-3 mt-4">
                  {product.promotional_price ? (
                    <>
                      <span className="text-4xl font-bold text-primary">
                        {product.promotional_price.toLocaleString()} {product.currency}
                      </span>
                      <span className="text-xl line-through text-muted-foreground">
                        {product.price.toLocaleString()} {product.currency}
                      </span>
                      <Badge variant="destructive">
                        -{Math.round(((product.price - product.promotional_price) / product.price) * 100)}%
                      </Badge>
                    </>
                  ) : (
                    <span className="text-4xl font-bold">
                      {product.price.toLocaleString()} {product.currency}
                    </span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Access Status & Actions */}
              <div className="space-y-4">
                {hasAccess ? (
                  <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-green-500">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900 dark:text-green-100">
                            Vous possédez ce produit
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Téléchargez vos fichiers ci-dessous
                          </p>
                        </div>
                      </div>

                      {/* Download Buttons */}
                      <div className="space-y-2">
                        {files.map((file) => (
                          <DigitalDownloadButton
                            key={file.id}
                            fileId={file.id}
                            fileName={file.name}
                            fileSize={file.file_size_mb}
                            digitalProductId={digitalProduct.id}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button size="lg" className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Acheter maintenant
                  </Button>
                )}
              </div>

              {/* Product Specs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Spécifications</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Taille</p>
                      <p className="font-medium">{digitalProduct.total_size_mb?.toFixed(2) || 0} MB</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Format</p>
                      <p className="font-medium">{digitalProduct.main_file_format || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Téléchargements</p>
                      <p className="font-medium">
                        {digitalProduct.download_limit === -1 ? 'Illimités' : digitalProduct.download_limit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Expiration</p>
                      <p className="font-medium">
                        {digitalProduct.download_expiry_days === -1 
                          ? 'Permanent' 
                          : `${digitalProduct.download_expiry_days} jours`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">License</p>
                      <p className="font-medium capitalize">{digitalProduct.license_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {digitalProduct.watermark_enabled ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Unlock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Watermark</p>
                      <p className="font-medium">
                        {digitalProduct.watermark_enabled ? 'Oui' : 'Non'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* License Card (if user owns) */}
              {hasAccess && (
                <DigitalLicenseCard productId={productId || ''} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="description" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="files">Fichiers détails</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
          </TabsList>

          {/* Description Tab */}
          <TabsContent value="description" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>À propos de ce produit</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description || '' }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Détails des fichiers</CardTitle>
                <CardDescription>
                  Liste complète des fichiers inclus avec ce produit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {files.map((file, index) => (
                    <div
                      key={file.id}
                      className="flex items-start gap-4 p-4 rounded-lg border"
                    >
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{file.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Version {file.version || '1.0'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {file.is_main && (
                              <Badge variant="default">Principal</Badge>
                            )}
                            {file.is_preview && (
                              <Badge variant="secondary">Aperçu</Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-medium">{file.file_type}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Taille</p>
                            <p className="font-medium">{file.file_size_mb.toFixed(2)} MB</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Téléchargements</p>
                            <p className="font-medium">{file.download_count || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Questions fréquentes</CardTitle>
                <CardDescription>
                  Trouvez rapidement des réponses à vos questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {faqs.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq: any, index: number) => (
                      <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune FAQ disponible pour ce produit
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

