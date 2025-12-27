/**
 * Composant d'aide contextuel pour les champs du formulaire
 * Affiche des tooltips et messages d'aide pour guider l'utilisateur
 */

import { Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getFieldHelp } from '@/lib/store-validation';

interface StoreFieldHelperProps {
  field: string;
  variant?: 'info' | 'warning' | 'success' | 'error';
  children?: React.ReactNode;
  className?: string;
}

const  HELP_MESSAGES: Record<string, { title?: string; message: string; variant?: 'info' | 'warning' }> = {
  name: {
    message: 'Choisissez un nom mémorable et descriptif pour votre boutique. Il apparaîtra sur votre page d\'accueil.',
  },
  slug: {
    message: 'Le slug est l\'identifiant unique de votre boutique dans l\'URL. Utilisez uniquement des lettres minuscules, chiffres et tirets.',
  },
  description: {
    message: 'Une description courte et accrocheuse qui apparaîtra dans les résultats de recherche et sur votre page d\'accueil.',
  },
  contact_email: {
    message: 'Cette adresse sera utilisée pour les communications importantes avec vos clients. Choisissez une adresse professionnelle.',
  },
  meta_title: {
    title: 'Optimisation SEO',
    message: 'Le titre idéal fait 50-60 caractères pour un affichage optimal dans les résultats Google. Incluez des mots-clés pertinents.',
    variant: 'info',
  },
  meta_description: {
    title: 'Optimisation SEO',
    message: 'La description idéale fait 150-160 caractères. Décrivez ce que vous vendez de manière attrayante pour inciter au clic.',
    variant: 'info',
  },
  google_analytics_id: {
    title: 'Format requis',
    message: 'GA4 : G-XXXXXXXXXX | Universal Analytics : UA-XXXXXX-XX. Trouvez cet ID dans votre compte Google Analytics.',
    variant: 'info',
  },
  facebook_pixel_id: {
    title: 'Format requis',
    message: '15-16 chiffres. Trouvez cet ID dans votre compte Facebook Business Manager > Events Manager.',
    variant: 'info',
  },
  whatsapp_number: {
    message: 'Format international avec indicatif pays (ex: +226 XX XX XX XX). Les clients pourront vous contacter directement via WhatsApp.',
  },
  latitude: {
    message: 'Coordonnée GPS de votre boutique. Aide les clients à vous trouver sur les cartes. Entre -90 et 90.',
  },
  longitude: {
    message: 'Coordonnée GPS de votre boutique. Aide les clients à vous trouver sur les cartes. Entre -180 et 180.',
  },
};

export const StoreFieldHelper = ({ field, variant = 'info', children, className = '' }: StoreFieldHelperProps) => {
  const helpMessage = HELP_MESSAGES[field] || { message: getFieldHelp(field) || '' };
  const message = helpMessage.message || '';
  const title = helpMessage.title;
  const messageVariant = helpMessage.variant || variant;

  if (!message) return children || null;

  const Icon = {
    info: Info,
    warning: AlertCircle,
    success: CheckCircle2,
    error: AlertCircle,
  }[messageVariant];

  const iconClass = {
    info: 'text-blue-500',
    warning: 'text-yellow-500',
    success: 'text-green-500',
    error: 'text-red-500',
  }[messageVariant];

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        {children}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Aide pour ${field}`}
            >
              <Icon className={`h-4 w-4 ${iconClass}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {title && <p className="font-semibold mb-1">{title}</p>}
            <p className="text-sm">{message}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

interface StoreFieldAlertProps {
  field: string;
  variant?: 'info' | 'warning';
  className?: string;
}

export const StoreFieldAlert = ({ field, variant = 'info', className = '' }: StoreFieldAlertProps) => {
  const helpMessage = HELP_MESSAGES[field];
  if (!helpMessage) return null;

  return (
    <Alert variant={variant === 'warning' ? 'destructive' : 'default'} className={className}>
      {variant === 'warning' ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Info className="h-4 w-4" />
      )}
      {helpMessage.title && <AlertTitle>{helpMessage.title}</AlertTitle>}
      <AlertDescription className="text-sm">{helpMessage.message}</AlertDescription>
    </Alert>
  );
};







