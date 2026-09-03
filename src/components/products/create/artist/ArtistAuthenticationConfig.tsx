/**
 * Artist Product - Authentication Configuration
 * Date: 28 Janvier 2025
 */

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArtistFormField } from './ArtistFormField';
import { getFieldHelpHint, formatHelpHint } from '@/lib/artist-product-help-hints';
import { validateLength } from '@/lib/artist-product-validators';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, FileText, PenTool, Upload, X, CheckCircle2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import type { ArtistProductFormData } from '@/types/artist-product';
import { CertificateUploader } from '@/components/artist/CertificateUploader';

interface ArtistAuthenticationConfigProps {
  data: Partial<ArtistProductFormData>;
  onUpdate: (data: Partial<ArtistProductFormData>) => void;
}

const ArtistAuthenticationConfigComponent = ({
  data,
  onUpdate,
}: ArtistAuthenticationConfigProps) => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      {/* Certificate of Authenticity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Certificat d'authenticité
              </CardTitle>
              <CardDescription>
                Cette œuvre dispose-t-elle d'un certificat d'authenticité ?
              </CardDescription>
            </div>
            <Switch
              checked={data.certificate_of_authenticity ?? false}
              onCheckedChange={checked => onUpdate({ certificate_of_authenticity: checked })}
            />
          </div>
        </CardHeader>
        {data.certificate_of_authenticity && (
          <CardContent>
            <CertificateUploader
              certificateUrl={data.certificate_file_url || null}
              onCertificateChange={url => onUpdate({ certificate_file_url: url || '' })}
              productId={data.product_id}
              readOnly={false}
            />
          </CardContent>
        )}
      </Card>

      {/* Signature Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-blue-500" />
                Signature authentifiée
              </CardTitle>
              <CardDescription>L'œuvre est-elle signée par l'artiste ?</CardDescription>
            </div>
            <Switch
              checked={data.signature_authenticated ?? false}
              onCheckedChange={checked => onUpdate({ signature_authenticated: checked })}
            />
          </div>
        </CardHeader>
        {data.signature_authenticated && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <ArtistFormField
                id="signature_location"
                label="Emplacement de la signature"
                value={data.signature_location || ''}
                onChange={value => onUpdate({ signature_location: value as string })}
                placeholder="Ex: En bas à droite, Au dos, Sur le cadre"
                maxLength={200}
                showCharCount
                showHelpIcon
                helpHint={formatHelpHint(
                  getFieldHelpHint('signature_location') || {
                    hint: "Emplacement de la signature sur l'œuvre",
                  }
                )}
                validationFn={value => {
                  return validateLength(value as string, 0, 200, "L'emplacement de la signature");
                }}
              />
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Une signature authentifiée augmente significativement la valeur et l'authenticité de
                l'œuvre.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Edition Info */}
      {(data.edition_type === 'limited_edition' || data.edition_type === 'print') && (
        <Card>
          <CardHeader>
            <CardTitle>Informations d'édition</CardTitle>
            <CardDescription>Détails sur l'édition limitée ou la reproduction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edition_number">Numéro d'édition</Label>
                <Input
                  id="edition_number"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={data.edition_number || ''}
                  onChange={e =>
                    onUpdate({ edition_number: e.target.value ? parseInt(e.target.value) : null })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_editions">Total d'éditions</Label>
                <Input
                  id="total_editions"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={data.total_editions || ''}
                  onChange={e =>
                    onUpdate({ total_editions: e.target.value ? parseInt(e.target.value) : null })
                  }
                />
              </div>
            </div>
            {data.edition_number && data.total_editions && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Édition {data.edition_number} sur {data.total_editions}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Valeur ajoutée :</strong> Les certificats d'authenticité et signatures
          authentifiées renforcent la confiance des acheteurs et peuvent justifier un prix plus
          élevé pour l'œuvre.
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Optimisation avec React.memo
export const ArtistAuthenticationConfig = React.memo(ArtistAuthenticationConfigComponent);
