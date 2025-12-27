/**
 * Dedication Preview Component
 * Date: 1 Février 2025
 * 
 * Aperçu de la dédicace avec différents styles et positions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DedicationPreviewProps {
  dedicationText: string;
  recipientName?: string;
  fontStyle?: 'standard' | 'elegant' | 'casual' | 'formal';
  textPosition?: 'top' | 'center' | 'bottom';
  onClose?: () => void;
  onDownload?: () => void;
  className?: string;
}

const fontStyles = {
  standard: 'font-sans',
  elegant: 'font-serif italic',
  casual: 'font-sans font-normal',
  formal: 'font-serif font-bold',
};

const positionClasses = {
  top: 'items-start justify-center pt-8',
  center: 'items-center justify-center',
  bottom: 'items-end justify-center pb-8',
};

export const DedicationPreview = ({
  dedicationText,
  recipientName,
  fontStyle = 'standard',
  textPosition = 'center',
  onClose,
  onDownload,
  className,
}: DedicationPreviewProps) => {
  const fullText = recipientName
    ? `Pour ${recipientName},\n\n${dedicationText}`
    : dedicationText;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Aperçu de la dédicace</CardTitle>
            <CardDescription>
              Voici comment votre dédicace apparaîtra
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{fontStyle}</Badge>
            <Badge variant="outline">{textPosition}</Badge>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Preview Canvas */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg border-2 border-amber-200 dark:border-amber-800 overflow-hidden">
          {/* Simulated artwork background */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
          </div>

          {/* Dedication text overlay */}
          <div
            className={cn(
              'absolute inset-0 flex flex-col px-8 py-12',
              positionClasses[textPosition],
              fontStyles[fontStyle]
            )}
          >
            <div className="text-center max-w-md">
              <p className="text-lg md:text-xl leading-relaxed whitespace-pre-line text-amber-900 dark:text-amber-100">
                {fullText}
              </p>
            </div>
          </div>

          {/* Watermark (simulated) */}
          <div className="absolute bottom-4 right-4 text-xs text-amber-600 dark:text-amber-400 opacity-50">
            Aperçu
          </div>
        </div>

        {/* Actions */}
        {onDownload && (
          <div className="mt-4 flex justify-end">
            <Button onClick={onDownload} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger l'aperçu
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};







